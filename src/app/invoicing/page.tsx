'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Zap, BarChart, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PublicPageSkeleton } from '@/components/skeletons/public-page-skeleton';

export default function InvoicingPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return <PublicPageSkeleton />;
  }

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Instant Invoicing',
      description: 'Create and send professional invoices in seconds.',
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: 'Track Everything',
      description: 'Monitor invoice status, payments, and overdue amounts.',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Automated Reminders',
      description: 'Set up automatic payment reminders for your clients.',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Multiple Templates',
      description: 'Choose from professional invoice templates or create custom ones.',
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
              Professional Invoicing Made Easy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Create, send, and track invoices. Get paid faster with automated reminders 
              and multiple payment options for your clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard/request-payment?tab=invoice">
                    Create Invoice
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

        {/* Features Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-3xl mb-4">Start Invoicing Today</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Join businesses using Payvost to streamline their invoicing and get paid faster.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {user ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/request-payment?tab=invoice">
                    Go to Invoicing
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

