
'use client';

import { useMemo, useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, UploadCloud, BadgeCheck, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KYC_CONFIG } from '@/config/kyc';
import type { KycDocKey, KycLevel, KycDocument, KycSubmission } from '@/types/kyc';

export default function VerifyBusinessPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [countryCode, setCountryCode] = useState<string>('NG');
  const [level, setLevel] = useState<KycLevel>('Full');
  const [files, setFiles] = useState<Record<KycDocKey, File | null>>({
    government_id: null,
    proof_of_address: null,
    selfie: null,
    business_registration: null,
    tax_id: null,
    director_id: null,
    bank_statement: null,
    other: null,
  });
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const requirements = useMemo(() => {
    const cfg = KYC_CONFIG.find(c => c.countryCode === countryCode);
    return cfg?.levels[level] || [];
  }, [countryCode, level]);

  const handleFileChange = (key: KycDocKey, e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Upload files
      const uploadedDocs: KycDocument[] = [];
      for (const req of requirements) {
        const f = files[req.key];
        if (!f) continue;
        const storageRef = ref(storage, `kyc_submissions/${user.uid}/${submissionId}/${req.key}/${f.name}`);
        await uploadBytes(storageRef, f);
        const url = await getDownloadURL(storageRef);
        uploadedDocs.push({ key: req.key, name: f.name, url, status: 'submitted', contentType: f.type, size: f.size });
      }

      const sub: KycSubmission = {
        id: submissionId,
        userId: user.uid,
        countryCode,
        level,
        documents: uploadedDocs,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };
      // Store submission for backend review (separate from user doc)
      await setDoc(doc(collection(db, 'kyc_submissions'), submissionId), {
        ...sub,
        createdAt: serverTimestamp(),
      });

      setSubmissionState('submitted');
      toast({ title: 'Submitted', description: 'Your documents have been submitted for review.' });
    } catch (error) {
      console.error('KYC submission error:', error);
      toast({ title: 'Submission Failed', description: 'An error occurred. Please try again.', variant: 'destructive' });
      setSubmissionState('idle');
    }
  };

  if (submissionState === 'submitted') {
    return (
       <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                            <Clock className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Review in Progress</CardTitle>
                        <CardDescription>
                            We have received your documents and are reviewing your business information. We will notify you within 4 business hours.
                        </CardDescription>
                    </CardHeader>
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
                                <CardDescription>Please select your country and KYC level, then upload the required documents.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Country</label>
                          <select className="mt-1 w-full border rounded-md h-10 px-3 bg-background" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                            {KYC_CONFIG.map(c => (<option key={c.countryCode} value={c.countryCode}>{c.countryName}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">KYC Level</label>
                          <select className="mt-1 w-full border rounded-md h-10 px-3 bg-background" value={level} onChange={e => setLevel(e.target.value as KycLevel)}>
                            <option value="Basic">Basic</option>
                            <option value="Full">Full</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                      </div>

                      {requirements.map(req => (
                        <div key={req.key} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">{req.label}</h4>
                          {req.description && <p className="text-sm text-muted-foreground mb-2">{req.description}</p>}
                          <label htmlFor={`doc-${req.key}`} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer border", files[req.key] ? "bg-green-500/10 text-green-700" : "bg-transparent border-input") }>
                            {files[req.key] ? <CheckCircle className="mr-2 h-4 w-4"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                            {files[req.key] ? `Uploaded: ${files[req.key]?.name}` : 'Upload Document'}
                          </label>
                          <input id={`doc-${req.key}`} type="file" className="hidden" accept={req.acceptedFormats?.join(',')} onChange={(e) => handleFileChange(req.key, e)} />
                          {req.acceptedFormats && <p className="text-xs text-muted-foreground mt-2">Allowed: {req.acceptedFormats.join(', ')}</p>}
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
