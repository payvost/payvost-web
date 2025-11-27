'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, BookOpen, Zap, ShieldCheck, Terminal } from 'lucide-react';
import Link from 'next/link';
import { PublicPageSkeleton } from '@/components/skeletons/public-page-skeleton';

export default function DevelopersPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <PublicPageSkeleton />;
  }
  const resources = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'API Documentation',
      description: 'Comprehensive API reference with code examples.',
      href: '/docs',
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: 'SDKs & Libraries',
      description: 'Official SDKs for TypeScript, Python, and more.',
      href: '/docs/sdks',
    },
    {
      icon: <Terminal className="h-6 w-6" />,
      title: 'Sandbox Environment',
      description: 'Test your integration in a safe sandbox environment.',
      href: '/docs/webhooks',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Webhooks',
      description: 'Real-time event notifications for your application.',
      href: '/docs/webhooks',
    },
  ];

  const features = [
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: 'Secure API',
      description: 'OAuth 2.0 and API key authentication with rate limiting.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Fast Integration',
      description: 'Get up and running in minutes with our well-documented APIs.',
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: 'Developer Support',
      description: 'Dedicated support team and active developer community.',
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
              Developer Tools & APIs
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Integrate Payvost's payment infrastructure into your application. 
              Powerful APIs, comprehensive documentation, and developer-friendly tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/docs">
                  View Documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Get API Keys</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Developer Resources</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {resource.icon}
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{resource.description}</CardDescription>
                  <Button asChild variant="outline" size="sm">
                    <Link href={resource.href}>
                      Learn More
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Developers Love Payvost</h2>
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

        {/* Code Example Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Quick Start Example</CardTitle>
              <CardDescription>Get started with our API in minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`import { Payvost } from '@payvost/sdk';

const client = new Payvost({
  apiKey: process.env.PAYVOST_API_KEY,
  environment: 'sandbox',
});

// Create a payment
const payment = await client.payments.create({
  amount: '100.00',
  currency: 'USD',
  description: 'Payment for services',
});`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Ready to Build?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Start integrating Payvost into your application today.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/docs">
                  Read Documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/register">Get API Keys</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

