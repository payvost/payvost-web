'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Globe, Zap, CheckCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PublicPageSkeleton } from '@/components/skeletons/public-page-skeleton';

export default function BillPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return <PublicPageSkeleton />;
  }

  const billTypes = [
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Utility Bills',
      description: 'Pay electricity, water, gas, and internet bills from anywhere.',
      features: ['Multiple providers', 'Auto-pay options', 'Payment history'],
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Subscription Services',
      description: 'Manage recurring subscriptions and service payments.',
      features: ['Streaming services', 'Software subscriptions', 'Membership fees'],
    },
  ];

  const features = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Multi-Country Support',
      description: 'Pay bills across multiple countries from one place, no switching.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Instant Payments',
      description: 'Your bills are paid immediately with real-time confirmation.',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Auto-Pay Setup',
      description: 'Set up automatic payments and never miss a due date.',
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
              Pay Bills Across Multiple Countries
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Pay bills across multiple countries from one place, no switching. 
              Manage all your bill payments in one convenient platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard/request-payment">
                    Pay Bills Now
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

        {/* Bill Types Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Bill Payment Options</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {billTypes.map((bill, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {bill.icon}
                  </div>
                  <CardTitle>{bill.title}</CardTitle>
                  <CardDescription>{bill.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {bill.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Payvost Bill Payments?</h2>
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
              <CardTitle className="text-3xl mb-4">Start Paying Bills Easily</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Join thousands of users managing their bills from one convenient platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {user ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/request-payment">
                    Pay Bills Now
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

