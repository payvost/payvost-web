'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, CheckCircle, DollarSign, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PublicPageSkeleton } from '@/components/skeletons/public-page-skeleton';

export default function SplitPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return <PublicPageSkeleton />;
  }

  const useCases = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Split with Friends',
      description: 'Split restaurant bills, travel expenses, and group purchases easily.',
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Family Expenses',
      description: 'Share household expenses, rent, and bills with family members.',
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: 'Group Payments',
      description: 'Collect money from multiple people for events, gifts, or shared costs.',
    },
  ];

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Instant Splits',
      description: 'Split payments between friends and family at a go.',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Automatic Reminders',
      description: 'Send automatic reminders to participants who haven\'t paid.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Multiple Participants',
      description: 'Split bills with as many people as you need, with custom amounts.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Split Payments Made Easy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Split payments between friends and family at a go. 
              Share expenses, split bills, and collect money from multiple people effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard/request-payment">
                    Split a Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map((useCase, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {useCase.icon}
                  </div>
                  <CardTitle>{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Start Splitting Payments</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Make splitting bills and expenses with friends and family effortless.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {user ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/request-payment">
                    Split a Payment Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

