
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, ArrowRight, Building, HeartHandshake, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export default function GetStartedPage() {
  const profileTypes = [
    {
        title: 'Business Owner',
        description: 'Manage day-to-day operations, invoicing, and global payments for your established business.',
        icon: <Briefcase className="h-10 w-10 text-primary" />,
        href: '#',
        status: 'coming-soon',
        buttonText: 'Coming Soon',
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
    <>
      <main className="flex-1 p-4 lg:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">There is even more with Payvost</h1>
                <p className="text-muted-foreground mt-2 md:text-lg">Select the profile that best describes you to get a tailored experience.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileTypes.map(profile => (
                     <Card key={profile.title} className={cn(
                       "hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col hover:ring-1 hover:ring-primary/50",
                       profile.status === 'approved' ? '' : 'cursor-pointer'
                     )}>
                        <div className="flex flex-col flex-grow">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="p-4 bg-primary/10 rounded-lg">
                                    {profile.icon}
                                </div>
                                <div className="flex-1">
                                    <CardTitle>{profile.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                 <CardDescription>{profile.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="flex-col items-start">
                                {profile.status === 'coming-soon' && <Badge variant="secondary" className="mb-4">Coming Soon</Badge>}
                                <Link href={profile.href} className="w-full">
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={profile.status === 'coming-soon'}
                                  >
                                    {profile.buttonText}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                </Link>
                            </CardFooter>
                        </div>
                    </Card>
                ))}
            </div>
             <div className="text-center mt-12">
                <p className="text-muted-foreground">Need a different setup? <Link href="/dashboard/contact" className="underline text-primary">Contact our sales team</Link>.</p>
            </div>
        </div>
      </main>
    </>
  );
}
