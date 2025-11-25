
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, UploadCloud, BadgeCheck, Clock, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getBusinessDocumentRequirements, type BusinessTierKey } from '@/config/business-kyc-config';
import type { KycDocument } from '@/types/kyc';

interface BusinessDocument {
  key: string;
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  status?: string;
}

export default function VerifyBusinessPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'approved' | 'pending_review'>('idle');
  const [countryCode, setCountryCode] = useState<string>('NG');
  const [businessTier, setBusinessTier] = useState<BusinessTierKey>('tier2');
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    autoApproved?: boolean;
    confidenceScore?: number;
    status?: string;
  } | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Load user data and business onboarding data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingUser(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          // Set country from user's registration country
          if (data.countryCode) {
            setCountryCode(data.countryCode);
          } else if (data.country) {
            // Try to extract country code from country name if available
            const countryMap: Record<string, string> = {
              'Nigeria': 'NG',
              'Ghana': 'GH',
              'Kenya': 'KE',
              'South Africa': 'ZA',
              'United States': 'US',
              'United Kingdom': 'GB',
              'Canada': 'CA',
              'Australia': 'AU',
              'Germany': 'DE',
            };
            if (countryMap[data.country]) {
              setCountryCode(countryMap[data.country]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserData();

    // Check if business onboarding data exists in localStorage
    if (typeof window !== 'undefined') {
      const businessOnboardingData = localStorage.getItem('businessOnboardingData');
      if (!businessOnboardingData) {
        toast({ 
          title: 'No business information found', 
          description: 'Please complete the business onboarding form first.', 
          variant: 'destructive' 
        });
        router.push('/dashboard/get-started/onboarding/business');
      } else {
        try {
          const businessData = JSON.parse(businessOnboardingData);
          // Determine tier based on business type or default to tier2
          // For now, default to tier2 (standard KYB)
          setBusinessTier('tier2');
        } catch (e) {
          console.error('Error parsing business data:', e);
        }
      }
    }
  }, [user, authLoading, router, toast]);

  // Get document requirements based on tier and country
  const requirements = useMemo(() => {
    const businessOnboardingDataStr = localStorage.getItem('businessOnboardingData');
    let businessType: string | undefined;
    
    if (businessOnboardingDataStr) {
      try {
        const businessData = JSON.parse(businessOnboardingDataStr);
        businessType = businessData.type;
      } catch (e) {
        console.error('Error parsing business data:', e);
      }
    }

    return getBusinessDocumentRequirements(businessTier, countryCode, businessType);
  }, [businessTier, countryCode]);

  // Initialize files state based on requirements
  useEffect(() => {
    const initialFiles: Record<string, File | null> = {};
    requirements.forEach(req => {
      initialFiles[req.key] = null;
    });
    setFiles(initialFiles);
  }, [requirements]);

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'Authentication is required to submit.', variant: 'destructive' });
      return;
    }

    // Validate required files
    const missing = requirements.filter(r => r.required && !files[r.key]);
    if (missing.length) {
      toast({ title: 'Missing Documents', description: `Please upload: ${missing.map(m => m.label).join(', ')}`, variant: 'destructive' });
      return;
    }

    setSubmissionState('submitting');

    try {
      const submissionId = `${user.uid}_${Date.now()}`;
      const businessOnboardingId = localStorage.getItem('businessOnboardingId');
      const businessOnboardingDataStr = localStorage.getItem('businessOnboardingData');
      
      // Upload files
      const uploadedDocs: BusinessDocument[] = [];
      for (const req of requirements) {
        const f = files[req.key];
        if (!f) continue;
        const storageRef = ref(storage, `business_kyc/${user.uid}/${submissionId}/${req.key}/${f.name}`);
        await uploadBytes(storageRef, f);
        const url = await getDownloadURL(storageRef);
        uploadedDocs.push({ 
          key: req.key, 
          name: f.name, 
          url, 
          status: 'submitted', 
          contentType: f.type, 
          size: f.size 
        });
      }

      // Get user data for verification
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Call verification API (if available)
      try {
        const verificationResponse = await fetch('/api/kyc/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            submissionId,
            tier: businessTier,
            country: countryCode,
            email: userData?.email || user?.email,
            phone: userData?.phone,
            fullName: userData?.name || user?.displayName,
            documentUrls: uploadedDocs.reduce((acc, doc) => {
              acc[doc.key] = doc.url;
              return acc;
            }, {} as Record<string, string>),
            metadata: {
              businessOnboardingId,
              businessTier,
              ...(userData?.additionalFields || {}),
            },
          }),
        });

        if (verificationResponse.ok) {
          const result = await verificationResponse.json();
          setVerificationResult(result);

          // If auto-approved, set state to approved, otherwise pending_review
          if (result.autoApproved && result.verificationStatus === 'approved') {
            setSubmissionState('approved');
            toast({ 
              title: 'Verification Approved!', 
              description: `Your business verification was automatically approved with ${result.confidenceScore}% confidence.`,
            });
          } else {
            setSubmissionState('pending_review');
            toast({ 
              title: 'Submitted for Review', 
              description: 'Your documents have been submitted for manual review.',
            });
          }
        } else {
          throw new Error('Verification API call failed');
        }
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        // Still mark as submitted even if verification fails
        setSubmissionState('pending_review');
        toast({ 
          title: 'Submitted', 
          description: 'Your documents have been submitted. Verification will be processed shortly.',
        });
      }

      // If this is part of business onboarding, create the complete business onboarding record with all data
      if (businessOnboardingId && businessOnboardingDataStr) {
        try {
          const businessData = JSON.parse(businessOnboardingDataStr);
          
          // Determine status: if auto-approved, use 'approved', otherwise use 'submitted' for admin review
          const submissionStatus = verificationResult?.autoApproved && verificationResult?.verificationStatus === 'approved' 
            ? 'approved' 
            : 'submitted';
          
          // Create the complete business onboarding record with business info + documents
          await setDoc(doc(db, 'business_onboarding', businessOnboardingId), {
            userId: user.uid,
            ...businessData,
            countryCode,
            businessTier,
            documents: uploadedDocs,
            kycSubmissionId: submissionId,
            status: submissionStatus,
            submittedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (parseError) {
          console.error('Error parsing business onboarding data:', parseError);
          // Still save KYC submission even if business data is missing
        }
      }

      // Clear localStorage after successful save
      localStorage.removeItem('businessOnboardingData');
      localStorage.removeItem('businessOnboardingId');
    } catch (error) {
      console.error('KYC submission error:', error);
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
                                ? `Your business verification was automatically approved with ${verificationResult?.confidenceScore || 0}% confidence.`
                                : 'Your business verification has been approved.'}
                            </span>
                          ) : (
                            'We have received your documents and are reviewing your business information. We will notify you within 4 business hours.'
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
                        <Button className="w-full" onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </DashboardLayout>
    )
  }

  if (loadingUser) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6">
         <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/dashboard/get-started/onboarding/business">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="text-lg font-semibold md:text-2xl">Verify Your Business</h1>
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
                                <CardTitle>Business Verification</CardTitle>
                                <CardDescription>
                                  Please upload the required documents for {businessTier === 'tier2' ? 'Standard KYB' : businessTier === 'tier3' ? 'Enhanced Due Diligence' : 'Basic Registration'} verification.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">Country</label>
                          <select 
                            className="w-full border rounded-md h-10 px-3 bg-background" 
                            value={countryCode} 
                            onChange={e => {
                              setCountryCode(e.target.value);
                              // Clear files when country changes
                              const clearedFiles: Record<string, File | null> = {};
                              requirements.forEach(req => {
                                clearedFiles[req.key] = null;
                              });
                              setFiles(clearedFiles);
                            }}
                          >
                            <option value="NG">Nigeria</option>
                            <option value="GH">Ghana</option>
                            <option value="KE">Kenya</option>
                            <option value="ZA">South Africa</option>
                            <option value="US">United States</option>
                            <option value="GB">United Kingdom</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="IT">Italy</option>
                            <option value="ES">Spain</option>
                            <option value="NL">Netherlands</option>
                            <option value="BE">Belgium</option>
                            <option value="PT">Portugal</option>
                            <option value="IE">Ireland</option>
                            <option value="AT">Austria</option>
                            <option value="CH">Switzerland</option>
                            <option value="SE">Sweden</option>
                            <option value="NO">Norway</option>
                            <option value="DK">Denmark</option>
                            <option value="FI">Finland</option>
                            <option value="PL">Poland</option>
                            <option value="CZ">Czech Republic</option>
                            <option value="GR">Greece</option>
                            <option value="RO">Romania</option>
                            <option value="HU">Hungary</option>
                            <option value="BG">Bulgaria</option>
                            <option value="HR">Croatia</option>
                            <option value="SK">Slovakia</option>
                            <option value="SI">Slovenia</option>
                            <option value="LT">Lithuania</option>
                            <option value="LV">Latvia</option>
                            <option value="EE">Estonia</option>
                            <option value="LU">Luxembourg</option>
                            <option value="MT">Malta</option>
                            <option value="CY">Cyprus</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">Verification Tier</label>
                          <select 
                            className="w-full border rounded-md h-10 px-3 bg-background" 
                            value={businessTier} 
                            onChange={e => {
                              setBusinessTier(e.target.value as BusinessTierKey);
                              // Clear files when tier changes
                              const clearedFiles: Record<string, File | null> = {};
                              requirements.forEach(req => {
                                clearedFiles[req.key] = null;
                              });
                              setFiles(clearedFiles);
                            }}
                          >
                            <option value="tier1">Tier 1 - Basic Registration</option>
                            <option value="tier2">Tier 2 - Standard KYB</option>
                            <option value="tier3">Tier 3 - Enhanced Due Diligence</option>
                          </select>
                        </div>
                      </div>

                      {requirements.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No documents required for this tier.</p>
                        </div>
                      ) : (
                        requirements.map(req => (
                          <div key={req.key} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {req.label}
                                  {req.required && <span className="text-destructive ml-1">*</span>}
                                </h4>
                                {req.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                                )}
                              </div>
                            </div>
                            <label 
                              htmlFor={`doc-${req.key}`} 
                              className={cn(
                                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer border mt-2",
                                files[req.key] ? "bg-green-500/10 text-green-700 border-green-500" : "bg-transparent border-input"
                              )}
                            >
                              {files[req.key] ? (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4"/>
                                  Uploaded: {files[req.key]?.name}
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="mr-2 h-4 w-4"/>
                                  Upload Document
                                </>
                              )}
                            </label>
                            <input 
                              id={`doc-${req.key}`} 
                              type="file" 
                              className="hidden" 
                              accept={req.acceptedFormats?.join(',')} 
                              onChange={(e) => handleFileChange(req.key, e)} 
                            />
                            {req.acceptedFormats && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Allowed: {req.acceptedFormats.join(', ')}
                                {req.maxSizeMB && ` • Max size: ${req.maxSizeMB}MB`}
                              </p>
                            )}
                          </div>
                        ))
                      )}
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
