
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, ArrowRight, Building, HeartHandshake, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';


export default function BusinessOnboardingPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const [isBusinessApproved, setIsBusinessApproved] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists() && doc.data().businessProfile?.status === 'Approved') {
            setIsBusinessApproved(true);
        } else {
            setIsBusinessApproved(false);
        }
    });

    return () => unsub();
  }, [user]);

  const profileTypes = [
    {
        title: 'Business Owner',
        description: 'Manage day-to-day operations, invoicing, and global payments for your established business.',
        icon: <Briefcase className="h-10 w-10 text-primary" />,
        href: isBusinessApproved ? '/business' : '/dashboard/get-started/onboarding/business',
        status: isBusinessApproved ? 'approved' : 'default',
        buttonText: isBusinessApproved ? 'Visit Dashboard' : 'Get Started',
    },
    {
        title: 'Startup Founder',
        description: 'Tools tailored for early-stage companies to manage runway, investor relations, and growth.',
        icon: <Rocket className="h-10 w-10 text-primary" />,
        href: '#',
        status: 'coming-soon',
        buttonText: 'Get Started'
    },
    {
        title: 'Creators',
        description: 'Monetize your content and receive support from your fans worldwide.',
        icon: <Sparkles className="h-10 w-10 text-primary" />,
        href: '#',
        status: 'coming-soon',
        buttonText: 'Get Started'
    },
    {
        title: 'Venture Capitalist',
        description: 'Oversee and manage finances for your entire portfolio of companies from a single dashboard.',
        icon: <Briefcase className="h-10 w-10 text-primary" />,
        href: '#',
        status: 'coming-soon',
        buttonText: 'Get Started'
    },
    {
        title: 'NGO / Non-Profit',
        description: 'Collect donations, manage grants, and track spending with specialized, low-fee tools.',
        icon: <HeartHandshake className="h-10 w-10 text-primary" />,
        href: '#',
        status: 'coming-soon',
        buttonText: 'Get Started'
    },
    {
        title: 'Government',
        description: 'Manage disbursements, grants, and public funds with full transparency and security.',
        icon: <Building className="h-10 w-10 text-primary" />,
        href: '#',
        status: 'coming-soon',
        buttonText: 'Get Started'
    },
  ]

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">There is even more with Payvost</h1>
                <p className="text-muted-foreground mt-2 md:text-lg">Select the profile that best describes you to get a tailored experience.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileTypes.map(profile => (
                     <Card key={profile.title} className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col
                             hover:ring-1 hover:ring-primary/50">
                        <Link href={profile.href} className="flex flex-col flex-grow">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="p-4 bg-primary/10 rounded-lg">
                                    {profile.icon}
                                </div>
                                <div>
                                    <CardTitle>{profile.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                 <CardDescription>{profile.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="flex-col items-start">
                                {profile.status === 'coming-soon' && <Badge variant="secondary" className="mb-4">Coming Soon</Badge>}
                                {profile.status === 'approved' && <Badge variant="default" className="mb-4 bg-green-500/20 text-green-700">Approved</Badge>}
                                <Button variant={profile.status === 'approved' ? 'default' : 'outline'} className="w-full">
                                    {profile.buttonText}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Link>
                    </Card>
                ))}
            </div>
             <div className="text-center mt-12">
                <p className="text-muted-foreground">Need a different setup? <Link href="/dashboard/contact" className="underline text-primary">Contact our sales team</Link>.</p>
            </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
