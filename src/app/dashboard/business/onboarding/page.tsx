
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OnboardingFormPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Business Profile Saved!",
            description: "Next, please provide some documents to verify your business.",
        });
        setIsLoading(false);
        router.push('/dashboard/business/verify');
    }, 1500)
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6">
         <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/dashboard/business">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="text-lg font-semibold md:text-2xl">Business Onboarding</h1>
        </div>
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
                            <Input id="business-name" placeholder="Your Company LLC" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="business-type">Business Type</Label>
                            <Select required>
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
                            <Label htmlFor="contact-email">Business Contact Email</Label>
                            <Input id="contact-email" type="email" placeholder="contact@company.com" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="website">Website (Optional)</Label>
                            <Input id="website" placeholder="https://yourcompany.com" />
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
      </main>
    </DashboardLayout>
  );
}
