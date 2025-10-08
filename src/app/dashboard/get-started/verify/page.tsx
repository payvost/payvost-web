
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, UploadCloud, FileText, BadgeCheck, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export default function VerifyBusinessPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [ownerIdFile, setOwnerIdFile] = useState<File | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFile(file);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile || !addressFile || !ownerIdFile) {
        toast({ title: 'Missing Documents', description: 'Please upload all required documents.', variant: 'destructive'});
        return;
    }
    if (!user) {
        toast({ title: 'Not Authenticated', description: 'Authentication is required to submit.', variant: 'destructive'});
        return;
    }

    setSubmissionState('submitting');
    
    try {
        const storedData = localStorage.getItem('businessOnboardingData');
        if (!storedData) {
            throw new Error("Business data not found. Please start over.");
        }
        const businessData = JSON.parse(storedData);

        // Upload files to storage
        const uploadFile = async (file: File, path: string) => {
            const storageRef = ref(storage, `business_verification/${user.uid}/${path}/${file.name}`);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
        }

        const [certUrl, addressUrl, ownerIdUrl] = await Promise.all([
            uploadFile(certFile, 'incorporation'),
            uploadFile(addressFile, 'address_proof'),
            uploadFile(ownerIdFile, 'owner_id'),
        ]);

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            userType: 'Business Pending',
            businessProfile: {
                name: businessData.name,
                type: businessData.type,
                industry: businessData.industry,
                registrationNumber: businessData.registrationNumber,
                taxId: businessData.taxId,
                address: businessData.address,
                email: businessData.email,
                website: businessData.website,
                status: 'Pending',
                createdAt: serverTimestamp(),
            },
            kycDocuments: arrayUnion(
                { type: 'incorporation', url: certUrl, name: certFile.name, status: 'submitted' },
                { type: 'address_proof', url: addressUrl, name: addressFile.name, status: 'submitted' },
                { type: 'owner_id', url: ownerIdUrl, name: ownerIdFile.name, status: 'submitted' }
            )
        });
        
        localStorage.removeItem('businessOnboardingData');
        setSubmissionState('submitted');

    } catch (error) {
        console.error("Verification submission error:", error);
        toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: 'destructive'});
        setSubmissionState('idle');
    }
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

  const allFilesUploaded = certFile && addressFile && ownerIdFile;

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
                                <CardDescription>Please upload the required documents to verify your business.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Certificate of Incorporation</h4>
                             <p className="text-sm text-muted-foreground mb-4">Upload a clear, color copy of your official business registration document.</p>
                             <label htmlFor="cert-upload" className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer", certFile ? "bg-green-500/10 text-green-700" : "bg-transparent border border-input")}>
                                {certFile ? <CheckCircle className="mr-2 h-4 w-4"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                                {certFile ? 'Uploaded: ' + certFile.name : 'Upload Document'}
                             </label>
                             <input id="cert-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, setCertFile)} />
                        </div>
                         <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Proof of Address</h4>
                             <p className="text-sm text-muted-foreground mb-4">A utility bill or bank statement from the last 3 months showing your business address.</p>
                             <label htmlFor="address-upload" className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer", addressFile ? "bg-green-500/10 text-green-700" : "bg-transparent border border-input")}>
                                {addressFile ? <CheckCircle className="mr-2 h-4 w-4"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                                {addressFile ? 'Uploaded: ' + addressFile.name : 'Upload Document'}
                             </label>
                             <input id="address-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, setAddressFile)} />
                        </div>
                         <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">ID of Business Owner(s)</h4>
                             <p className="text-sm text-muted-foreground mb-4">A government-issued ID for all beneficial owners with more than 25% ownership.</p>
                             <label htmlFor="owner-id-upload" className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer", ownerIdFile ? "bg-green-500/10 text-green-700" : "bg-transparent border border-input")}>
                                {ownerIdFile ? <CheckCircle className="mr-2 h-4 w-4"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                                {ownerIdFile ? 'Uploaded: ' + ownerIdFile.name : 'Upload Document'}
                             </label>
                             <input id="owner-id-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, setOwnerIdFile)} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={submissionState === 'submitting' || !allFilesUploaded}>
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
