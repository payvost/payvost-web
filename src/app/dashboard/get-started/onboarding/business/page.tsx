'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'You must be logged in to submit business details.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const businessData = {
        name: formData.get('business-name'),
        type: businessType,
        industry,
        registrationNumber: formData.get('registration-number'),
        taxId: formData.get('tax-id'),
        address: formData.get('business-address'),
        email: formData.get('contact-email'),
        website: formData.get('website'),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      // ✅ Save locally for verification page
      if (typeof window !== 'undefined') {
        localStorage.setItem('businessOnboardingData', JSON.stringify(businessData));
      }

      // ✅ Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        { businessProfile: businessData },
        { merge: true } // merge ensures we don't overwrite existing user data
      );

      toast({
        title: 'Business profile submitted',
        description: 'Your business information has been saved successfully.',
      });

      router.push('/dashboard/get-started/verify');
    } catch (error: any) {
      console.error('Error submitting business info:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <Input name="business-name" placeholder="e.g. Payvost Technologies Ltd" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Type</label>
              <Select onValueChange={setBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <Select onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Registration Number</label>
              <Input name="registration-number" placeholder="e.g. RC1234567" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tax Identification Number (TIN)</label>
              <Input name="tax-id" placeholder="e.g. TIN00112233" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Address</label>
              <Input name="business-address" placeholder="e.g. 24B, Allen Avenue, Ikeja, Lagos" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <Input name="contact-email" placeholder="e.g. hello@payvost.com" type="email" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input name="website" placeholder="e.g. https://payvost.com" />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Business Information'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
