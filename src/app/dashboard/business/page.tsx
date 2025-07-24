
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

const roles = [
    {
      icon: <Briefcase className="h-10 w-10 text-primary" />,
      title: 'Business Owner',
      description: 'Manage day-to-day operations, invoicing, and global payments for your established business.',
      link: '#',
    },
];

export default function BusinessOnboardingPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Activate Business Features</h1>
                <p className="text-muted-foreground mt-2 md:text-lg">Select the profile that best describes you to get a tailored experience.</p>
            </div>

            <div className="grid gap-6">
                 {roles.map((role) => (
                    <Card 
                        key={role.title} 
                        className={
                            `cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col
                             ${selectedRole === role.title ? 'ring-2 ring-primary shadow-xl' : 'hover:ring-1 hover:ring-primary/50'}`
                        }
                        onClick={() => setSelectedRole(role.title)}
                    >
                        <CardHeader className="items-center text-center">
                            {role.icon}
                            <CardTitle className="mt-4">{role.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-sm text-muted-foreground flex-grow">
                            <p>{role.description}</p>
                        </CardContent>
                        <CardFooter>
                           <Button 
                                className="w-full" 
                                variant={selectedRole === role.title ? 'default' : 'outline'}
                            >
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="text-center mt-12">
                <p className="text-sm text-muted-foreground">
                    Need a different setup? <Link href="/dashboard/support" className="underline hover:text-primary">Contact our sales team</Link>.
                </p>
            </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
