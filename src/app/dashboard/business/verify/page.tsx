
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, UploadCloud, FileText, BadgeCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerifyBusinessPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionState('submitting');
    // Simulate API call for document verification
    setTimeout(() => {
        setSubmissionState('submitted');
    }, 2000)
  }

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
                            We are reviewing your business information. We will get back to you within 4 business hours.
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
                <Link href="/dashboard/business/onboarding">
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
                                <CardDescription>Please upload the required documents to verify your business.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Certificate of Incorporation</h4>
                             <p className="text-sm text-muted-foreground mb-4">Upload a clear, color copy of your official business registration document.</p>
                             <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/>Upload Document</Button>
                        </div>
                         <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Proof of Address</h4>
                             <p className="text-sm text-muted-foreground mb-4">A utility bill or bank statement from the last 3 months showing your business address.</p>
                             <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/>Upload Document</Button>
                        </div>
                         <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">ID of Business Owner(s)</h4>
                             <p className="text-sm text-muted-foreground mb-4">A government-issued ID for all beneficial owners with more than 25% ownership.</p>
                             <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/>Upload Document</Button>
                        </div>
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
