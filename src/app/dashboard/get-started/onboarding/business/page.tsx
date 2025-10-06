
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingFormPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoadingUser(false);
        return;
    };

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            setUserData(doc.data());
        }
        setLoadingUser(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        toast({ title: 'Not authenticated', description: 'You must be logged in.', variant: 'destructive'});
        return;
    }
    
    const formData = new FormData(e.currentTarget);
    const businessData = {
        name: formData.get('business-name'),
        type: formData.get('business-type'),
        industry: formData.get('industry'),
        registrationNumber: formData.get('registration-number'),
        taxId: formData.get('tax-id'),
        address: formData.get('business-address'),
        email: formData.get('contact-email'),
        website: formData.get('website'),
    };
    
    // Temporarily store data to pass to the next step
    localStorage.setItem('businessOnboardingData', JSON.stringify(businessData));
    
    router.push('/dashboard/get-started/verify');
  }

  const renderContent = () => {
    if (loadingUser) {
        return <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
    }

    if (userData?.businessProfile) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                            <Clock className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Review in Progress</CardTitle>
                        <CardDescription>
                            We have received your business information and our team is currently reviewing it. We will notify you once the review is complete, typically within 4 business hours.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Building className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Tell us about your business</CardTitle>
                            <CardDescription>This information helps us tailor your experience.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name</Label>
                        <Input id="business-name" name="business-name" placeholder="Your Company LLC" required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="business-type">Business Type</Label>
                            <Select name="business-type" required>
                                <SelectTrigger id="business-type">
                                    <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sole-prop">Sole Proprietorship</SelectItem>
                                    <SelectItem value="llc">LLC</SelectItem>
                                    <SelectItem value="corporation">Corporation</SelectItem>
                                    <SelectItem value="non-profit">Non-Profit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select name="industry" required>
                                <SelectTrigger id="industry">
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tech">Technology</SelectItem>
                                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                                    <SelectItem value="freelance">Freelance/Consulting</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registration-number">Registration Number (Optional)</Label>
                            <Input id="registration-number" name="registration-number" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax-id">Tax ID (Optional)</Label>
                            <Input id="tax-id" name="tax-id" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="business-address">Business Address</Label>
                        <Input id="business-address" name="business-address" placeholder="123 Main St, San Francisco, CA 94105" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact-email">Business Contact Email</Label>
                        <Input id="contact-email" name="contact-email" type="email" placeholder="contact@company.com" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="website">Website (Optional)</Label>
                        <Input id="website" name="website" placeholder="https://yourcompany.com" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit & Continue
                    </Button>
                </CardFooter>
            </Card>
        </form>
    </div>
    )
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
         <div className="flex items-center gap-4 mb-6 self-start max-w-2xl w-full mx-auto">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/dashboard/get-started">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="text-lg font-semibold md:text-2xl">Business Onboarding</h1>
        </div>
        {renderContent()}
      </main>
    </DashboardLayout>
  );
}
