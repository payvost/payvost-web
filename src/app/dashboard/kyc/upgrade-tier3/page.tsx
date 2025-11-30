'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, UploadCloud, BadgeCheck, Clock, CheckCircle, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { onSnapshot } from 'firebase/firestore';

type DocumentType = 'source-of-funds' | 'proof-of-income' | 'tax-document';

interface DocumentFile {
  file: File | null;
  url: string | null;
}

export default function UpgradeTier3Page() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'approved' | 'pending_review'>('idle');
  const [userData, setUserData] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<{
    autoApproved?: boolean;
    confidenceScore?: number;
    status?: string;
  } | null>(null);
  const [documents, setDocuments] = useState<Record<DocumentType, DocumentFile>>({
    'source-of-funds': { file: null, url: null },
    'proof-of-income': { file: null, url: null },
    'tax-document': { file: null, url: null },
  });
  const [formData, setFormData] = useState({
    occupation: '',
    sourceOfFunds: '',
    taxId: '',
    additionalInfo: '',
  });
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    return () => unsub();
  }, [user]);

  const handleFileChange = (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ 
          title: 'File too large', 
          description: 'Please upload a file smaller than 10MB.', 
          variant: 'destructive' 
        });
        return;
      }
      setDocuments(prev => ({ ...prev, [type]: { file, url: null } }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'Authentication is required to submit.', variant: 'destructive' });
      return;
    }

    // Check if user is eligible
    if (userData?.kycTier !== 'tier2' || 
        userData?.kycStatus !== 'verified' ||
        userData?.kycProfile?.tiers?.tier2?.status !== 'approved') {
      toast({ 
        title: 'Not Eligible', 
        description: 'Please complete Tier 2 verification first.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate required fields
    if (!formData.occupation && !formData.sourceOfFunds) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please provide either occupation or source of funds information.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!documents['source-of-funds'].file) {
      toast({ 
        title: 'Missing Document', 
        description: 'Please upload a source of funds document.', 
        variant: 'destructive' 
      });
      return;
    }

    setSubmissionState('submitting');

    try {
      const submissionId = `tier3_${user.uid}_${Date.now()}`;
      const countryCode = userData?.country || userData?.countryCode || 'NG';
      
      // Upload files
      const uploadedDocs: any[] = [];
      for (const [type, docFile] of Object.entries(documents)) {
        if (!docFile.file) continue;
        
        // Sanitize file name to avoid issues with special characters
        const sanitizedFileName = docFile.file.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/\s+/g, '_')
          .toLowerCase();
        
        const storageRef = ref(storage, `kyc_submissions/${user.uid}/${submissionId}/${type}/${sanitizedFileName}`);
        
        try {
          await uploadBytes(storageRef, docFile.file);
          const url = await getDownloadURL(storageRef);
        
          uploadedDocs.push({
            key: type,
            name: docFile.file.name,
            url,
            type,
            status: 'submitted',
            contentType: docFile.file.type,
            size: docFile.file.size,
          });
        } catch (uploadError: any) {
          console.error(`Error uploading ${type}:`, uploadError);
          throw new Error(`Failed to upload ${type}: ${uploadError.message || 'Unknown error'}`);
        }
      }

      // Create KYC submission
      const submission = {
        id: submissionId,
        userId: user.uid,
        countryCode,
        level: 'tier3',
        tier: 'tier3',
        documents: uploadedDocs,
        formData: {
          occupation: formData.occupation,
          sourceOfFunds: formData.sourceOfFunds,
          taxId: formData.taxId,
          additionalInfo: formData.additionalInfo,
        },
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Store submission
      await setDoc(doc(collection(db, 'kyc_submissions'), submissionId), submission);

      // Call verification API
      try {
        const verificationResponse = await fetch('/api/kyc/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            submissionId,
            tier: 'tier3',
            country: countryCode,
            email: userData?.email || user?.email,
            phone: userData?.phone,
            fullName: userData?.name || user?.displayName,
            dateOfBirth: userData?.dateOfBirth,
            residentialAddress: userData?.addressLine1 || userData?.street,
            taxID: formData.taxId || userData?.bvn || userData?.additionalFields?.bvn,
            sourceOfFunds: formData.sourceOfFunds || formData.occupation,
            documentUrls: {
              sourceOfFunds: uploadedDocs.find(d => d.key === 'source-of-funds')?.url,
              proofOfIncome: uploadedDocs.find(d => d.key === 'proof-of-income')?.url,
              taxDocument: uploadedDocs.find(d => d.key === 'tax-document')?.url,
            },
            metadata: {
              occupation: formData.occupation,
              additionalInfo: formData.additionalInfo,
              ...(userData?.additionalFields || {}),
            },
          }),
        });

        if (!verificationResponse.ok) {
          throw new Error('Verification API call failed');
        }

        const result = await verificationResponse.json();
        setVerificationResult(result);

        // Update user's kycProfile based on verification result
        const userRef = doc(db, 'users', user.uid);
        const currentData = await getDoc(userRef);
        if (currentData.exists()) {
          const updateData: any = {
            updatedAt: serverTimestamp(),
          };

          // Tier 3 typically requires manual review for enhanced due diligence
          updateData['kycProfile.status'] = 'pending_review';
          updateData['kycProfile.tiers.tier3.status'] = 'submitted';
          updateData['kycProfile.tiers.tier3.submittedAt'] = serverTimestamp();
          if (result.confidenceScore) {
            updateData['kycProfile.tiers.tier3.confidenceScore'] = result.confidenceScore;
          }

          setSubmissionState('pending_review');
          toast({ 
            title: 'Submitted for Review', 
            description: 'Your Tier 3 documents have been submitted for enhanced due diligence review. This may take 2-5 business days.',
          });

          await updateDoc(userRef, updateData);
        }
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        // Still mark as submitted even if verification fails
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'kycProfile.status': 'pending_review',
          'kycProfile.tiers.tier3.status': 'submitted',
          'kycProfile.tiers.tier3.submittedAt': serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSubmissionState('pending_review');
        toast({ 
          title: 'Submitted', 
          description: 'Your documents have been submitted. Verification will be processed shortly.',
        });
      }
    } catch (error) {
      console.error('Tier 3 submission error:', error);
      toast({ title: 'Submission Failed', description: 'An error occurred. Please try again.', variant: 'destructive' });
      setSubmissionState('idle');
    }
  };

  if (submissionState === 'approved' || submissionState === 'pending_review' || submissionState === 'submitted') {
    const isApproved = submissionState === 'approved';

    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className={`mx-auto ${isApproved ? 'bg-green-100 dark:bg-green-900/20' : 'bg-primary/10'} p-4 rounded-full w-fit`}>
                {isApproved ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : (
                  <Clock className="h-10 w-10 text-primary" />
                )}
              </div>
              <CardTitle className="mt-4">
                {isApproved ? 'Verification Approved!' : 'Review in Progress'}
              </CardTitle>
              <CardDescription>
                {isApproved ? (
                  'Your Tier 3 verification has been approved. You now have access to unlimited transactions and escrow services.'
                ) : (
                  'We have received your Tier 3 documents and are conducting an enhanced due diligence review. This process may take 2-5 business days. We will notify you once the review is complete.'
                )}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push('/dashboard/profile')}>
                Back to Profile
              </Button>
            </CardFooter>
          </Card>
        </main>
      </DashboardLayout>
    );
  }

  const requiredDocs = [
    {
      type: 'source-of-funds' as DocumentType,
      label: 'Source of Funds Declaration',
      description: 'Document explaining the origin of your funds (bank statements, employment letter, business registration, etc.)',
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
      required: true,
    },
    {
      type: 'proof-of-income' as DocumentType,
      label: 'Proof of Income (Optional)',
      description: 'Recent payslips, bank statements, or tax returns showing your income',
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
      required: false,
    },
    {
      type: 'tax-document' as DocumentType,
      label: 'Tax Identification Document (Optional)',
      description: 'Tax ID, TIN, or other tax-related documentation',
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
      required: false,
    },
  ];

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href="/dashboard/profile">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold md:text-2xl">Upgrade to Tier 3</h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Tier 3: Verified Pro</CardTitle>
                    <CardDescription>
                      Complete enhanced due diligence to unlock unlimited transactions and escrow services.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tier 3 Benefits
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Unlimited transactions</li>
                    <li>• Escrow services</li>
                    <li>• All Tier 2 services</li>
                  </ul>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="occupation">Occupation *</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                      placeholder="e.g., Software Engineer, Business Owner, Consultant"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Your current occupation or job title</p>
                  </div>

                  <div>
                    <Label htmlFor="sourceOfFunds">Source of Funds *</Label>
                    <Textarea
                      id="sourceOfFunds"
                      value={formData.sourceOfFunds}
                      onChange={(e) => setFormData(prev => ({ ...prev, sourceOfFunds: e.target.value }))}
                      placeholder="Describe the origin of your funds (salary, business income, investments, inheritance, etc.)"
                      className="mt-1 min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Detailed explanation of where your funds come from</p>
                  </div>

                  <div>
                    <Label htmlFor="taxId">Tax ID / TIN (Optional)</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      placeholder="Your Tax Identification Number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                    <Textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      placeholder="Any additional information that may help with the review process"
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Required Documents
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Source of funds declaration document</li>
                    <li>• Proof of income (if applicable)</li>
                    <li>• Additional AML and sanctions screening will be performed</li>
                  </ul>
                </div>

                {requiredDocs.map((req) => (
                  <div key={req.type} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {req.label}
                      {req.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    {req.description && <p className="text-sm text-muted-foreground mb-2">{req.description}</p>}
                    <label
                      htmlFor={`doc-${req.type}`}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer border",
                        documents[req.type].file ? "bg-green-500/10 text-green-700 border-green-500" : "bg-transparent border-input"
                      )}
                    >
                      {documents[req.type].file ? (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      {documents[req.type].file ? `Uploaded: ${documents[req.type].file?.name}` : 'Upload Document'}
                    </label>
                    <input
                      id={`doc-${req.type}`}
                      type="file"
                      className="hidden"
                      accept={req.acceptedFormats?.join(',')}
                      onChange={(e) => handleFileChange(req.type, e)}
                    />
                    {req.acceptedFormats && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Allowed: {req.acceptedFormats.join(', ')} (Max 10MB)
                      </p>
                    )}
                  </div>
                ))}

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Enhanced due diligence review may take 2-5 business days. Manual compliance review may be required depending on your risk profile.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={submissionState === 'submitting'}>
                  {submissionState === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Enhanced Due Diligence Review
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
}

