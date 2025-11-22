'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, UploadCloud, BadgeCheck, Clock, CheckCircle, FileText, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { onSnapshot } from 'firebase/firestore';

type DocumentType = 'government-id' | 'proof-of-address' | 'face-match';

interface DocumentFile {
  file: File | null;
  url: string | null;
}

export default function UpgradeTier2Page() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'approved' | 'pending_review'>('idle');
  const [userData, setUserData] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<{
    autoApproved?: boolean;
    confidenceScore?: number;
    status?: string;
  } | null>(null);
  const [documents, setDocuments] = useState<Record<DocumentType, DocumentFile>>({
    'government-id': { file: null, url: null },
    'proof-of-address': { file: null, url: null },
    'face-match': { file: null, url: null },
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
    if (userData?.kycTier !== 'tier1' || 
        (userData?.kycStatus !== 'verified' && userData?.kycStatus !== 'tier1_verified') ||
        userData?.kycProfile?.tiers?.tier1?.status !== 'approved') {
      toast({ 
        title: 'Not Eligible', 
        description: 'Please complete Tier 1 verification first.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate required documents
    if (!documents['government-id'].file) {
      toast({ title: 'Missing Document', description: 'Please upload a government-issued ID.', variant: 'destructive' });
      return;
    }
    if (!documents['proof-of-address'].file) {
      toast({ title: 'Missing Document', description: 'Please upload a proof of address document.', variant: 'destructive' });
      return;
    }

    setSubmissionState('submitting');

    try {
      const submissionId = `tier2_${user.uid}_${Date.now()}`;
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
            name: docFile.file.name, // Keep original name for display
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
        level: 'tier2',
        documents: uploadedDocs,
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
            tier: 'tier2',
            country: countryCode,
            email: userData?.email || user?.email,
            phone: userData?.phone,
            fullName: userData?.name || user?.displayName,
            dateOfBirth: userData?.dateOfBirth,
            residentialAddress: userData?.addressLine1 || userData?.street,
            taxID: userData?.bvn || userData?.additionalFields?.bvn,
            documentUrls: {
              idDocument: uploadedDocs.find(d => d.key === 'government-id')?.url,
              proofOfAddress: uploadedDocs.find(d => d.key === 'proof-of-address')?.url,
              selfie: uploadedDocs.find(d => d.key === 'face-match')?.url,
            },
            metadata: {
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

          if (result.autoApproved && result.verificationStatus === 'approved') {
            updateData['kycProfile.status'] = 'approved';
            updateData['kycProfile.tiers.tier2.status'] = 'approved';
            updateData['kycProfile.tiers.tier2.approvedAt'] = serverTimestamp();
            updateData['kycProfile.tiers.tier2.confidenceScore'] = result.confidenceScore;
            updateData['kycProfile.tiers.tier2.autoApproved'] = true;
            updateData['kycTier'] = 'tier2';
            updateData['kycStatus'] = 'verified';
            updateData['kycLevel'] = 'Full';
            updateData['userType'] = 'Tier 2';

            setSubmissionState('approved');
            toast({ 
              title: 'Verification Approved!', 
              description: `Your Tier 2 verification was automatically approved with ${result.confidenceScore}% confidence.`,
            });
          } else {
            updateData['kycProfile.status'] = 'pending_review';
            updateData['kycProfile.tiers.tier2.status'] = 'submitted';
            updateData['kycProfile.tiers.tier2.submittedAt'] = serverTimestamp();
            if (result.confidenceScore) {
              updateData['kycProfile.tiers.tier2.confidenceScore'] = result.confidenceScore;
            }

            setSubmissionState('pending_review');
            toast({ 
              title: 'Submitted for Review', 
              description: 'Your Tier 2 documents have been submitted for manual review.',
            });
          }

          await updateDoc(userRef, updateData);
        }
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        // Still mark as submitted even if verification fails
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'kycProfile.status': 'pending_review',
          'kycProfile.tiers.tier2.status': 'submitted',
          'kycProfile.tiers.tier2.submittedAt': serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSubmissionState('pending_review');
        toast({ 
          title: 'Submitted', 
          description: 'Your documents have been submitted. Verification will be processed shortly.',
        });
      }
    } catch (error) {
      console.error('Tier 2 submission error:', error);
      toast({ title: 'Submission Failed', description: 'An error occurred. Please try again.', variant: 'destructive' });
      setSubmissionState('idle');
    }
  };

  if (submissionState === 'approved' || submissionState === 'pending_review' || submissionState === 'submitted') {
    const isApproved = submissionState === 'approved';
    const isAutoApproved = verificationResult?.autoApproved === true;

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
                  <span>
                    {isAutoApproved 
                      ? `Your Tier 2 verification was automatically approved with ${verificationResult?.confidenceScore || 0}% confidence.`
                      : 'Your Tier 2 verification has been approved.'}
                  </span>
                ) : (
                  'We have received your Tier 2 documents and are reviewing them. We will notify you within 24-48 hours.'
                )}
              </CardDescription>
            </CardHeader>
            {isApproved && isAutoApproved && verificationResult?.confidenceScore && (
              <CardContent>
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Auto-Approved</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence Score: <span className="font-semibold">{verificationResult.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${verificationResult.confidenceScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            )}
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
      type: 'government-id' as DocumentType,
      label: 'Government-Issued ID',
      description: 'NIN Slip, Driver\'s Licence, Voter\'s Card, or Passport',
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    {
      type: 'proof-of-address' as DocumentType,
      label: 'Proof of Address',
      description: 'Utility bill or bank statement dated within the last 3 months',
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    {
      type: 'face-match' as DocumentType,
      label: 'Face Match Verification',
      description: 'A clear selfie photo for identity verification',
      acceptedFormats: ['image/jpeg', 'image/png'],
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
          <h1 className="text-lg font-semibold md:text-2xl">Upgrade to Tier 2</h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BadgeCheck className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Tier 2 Verification</CardTitle>
                    <CardDescription>
                      Provide full Nigerian KYC documents to lift daily limits and access virtual cards.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Required Documents
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Valid government ID (NIN Slip, Driver's Licence, Voter's Card, or Passport)</li>
                    <li>• Proof of address (utility bill or bank statement)</li>
                    <li>• Mandatory BVN</li>
                    <li>• Face match verification</li>
                  </ul>
                </div>

                {requiredDocs.map((req) => (
                  <div key={req.type} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{req.label}</h4>
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
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={submissionState === 'submitting'}>
                  {submissionState === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Verification
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
}

