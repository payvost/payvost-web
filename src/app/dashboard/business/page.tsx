'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBusinessProfile(data?.businessProfile || null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If no business profile, redirect to onboarding
  if (!businessProfile) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Business Dashboard</h1>
              <p className="text-muted-foreground">Manage your business account</p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Get Started with Business Account
              </CardTitle>
              <CardDescription>
                Set up your business profile to access advanced features and tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Business Account Benefits:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Accept payments from customers globally</li>
                  <li>Create and manage invoices</li>
                  <li>Track expenses and generate reports</li>
                  <li>Manage team members and permissions</li>
                  <li>Access to business analytics</li>
                </ul>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard/get-started/onboarding/business">
                  Start Business Onboarding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // If business profile exists but not approved, show pending status
  if (businessProfile.status !== 'Approved') {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Business Dashboard</h1>
              <p className="text-muted-foreground">Your business account is under review</p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Business Profile Pending Approval
              </CardTitle>
              <CardDescription>
                Your business profile "{businessProfile.name}" is currently being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Status: {businessProfile.status || 'Pending'}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll notify you once your business account has been approved. This usually takes 1-2 business days.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Business profile approved - redirect to main business dashboard
  useEffect(() => {
    if (businessProfile?.status === 'Approved') {
      router.push('/business');
    }
  }, [businessProfile, router]);

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting to business dashboard...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

