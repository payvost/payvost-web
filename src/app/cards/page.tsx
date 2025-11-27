'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, ShieldCheck, Zap, Globe } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PublicPageSkeleton } from '@/components/skeletons/public-page-skeleton';

export default function CardsPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return <PublicPageSkeleton />;
  }

  const cardTypes = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Virtual Cards',
      description: 'Create instant virtual cards for online purchases. Set spending limits and freeze anytime.',
      features: ['Instant issuance', 'Spending controls', 'Multi-currency', 'One-time use cards'],
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Physical Cards',
      description: 'Order physical debit cards delivered to your address. Use anywhere Mastercard is accepted.',
      features: ['Global acceptance', 'ATM withdrawals', 'Contactless payments', 'Card management'],
    },
  ];

  const features = [
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: 'Secure',
      description: 'Bank-level security with fraud protection and instant card freezing.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Instant',
      description: 'Virtual cards available immediately. No waiting, no delays.',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Global',
      description: 'Use your cards anywhere in the world with competitive FX rates.',
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
              Virtual & Physical Cards
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Create virtual cards instantly or order physical cards. 
              Full control over spending with real-time notifications and analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard/cards">
                    Manage Cards
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

        {/* Card Types Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Card Options</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {cardTypes.map((card, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {card.icon}
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {card.features.map((feature, idx) => (
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
          <h2 className="text-3xl font-bold text-center mb-12">Why Payvost Cards?</h2>
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
              <CardTitle className="text-3xl mb-4">Ready to Get Your Card?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Create a virtual card instantly or order a physical card delivered to your door.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {user ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/cards">
                    Create Card Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">
                    Sign Up Free
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

