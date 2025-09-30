
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, Store } from 'lucide-react';
import Link from 'next/link';

export default function TerminalComingSoonPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6 text-center">
        <div className="p-6 bg-primary/10 rounded-full">
            <Store className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-4 sm:text-4xl md:text-5xl">
            Terminal is Coming Soon
        </h1>
        <p className="max-w-2xl text-muted-foreground md:text-xl">
            Accept in-person payments with our powerful and easy-to-use virtual POS terminal. Perfect for retail, pop-up shops, and service professionals.
        </p>
        
        <Card className="w-full max-w-lg mt-8">
            <CardHeader>
                <CardTitle>Get Notified on Launch</CardTitle>
                <CardDescription>Be the first to know when our Terminal feature is available.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="flex w-full space-x-2">
                    <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="email" placeholder="Enter your email" className="pl-10" />
                    </div>
                    <Button type="submit">Notify Me</Button>
                </form>
            </CardContent>
        </Card>

        <Button asChild variant="outline" className="mt-8">
            <Link href="/dashboard">
                Back to Dashboard
            </Link>
        </Button>
      </main>
    </DashboardLayout>
  );
}
