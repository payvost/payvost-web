
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, Settings, BookOpen, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// In a real app, you'd fetch this data based on the `slug` param
const integrationData = {
    woocommerce: {
        name: 'WooCommerce',
        logo: 'https://placehold.co/80x80.png',
        hint: 'woocommerce logo',
        description: 'Integrate Payvost directly into your WooCommerce store to accept payments from customers worldwide. Our plugin offers a seamless checkout experience, automatic currency conversion, and robust security features.',
        features: [
            'Accept payments in 100+ currencies.',
            'Automatic exchange rate calculations.',
            'Secure checkout process powered by Payvost.',
            'Easy refund processing from your WordPress dashboard.',
        ],
        setupSteps: [
            {
                title: 'Step 1: Download the Plugin',
                content: 'Download the latest version of the Payvost for WooCommerce plugin from the official WordPress plugin repository or from our website.'
            },
            {
                title: 'Step 2: Install and Activate',
                content: 'In your WordPress dashboard, navigate to Plugins > Add New > Upload Plugin. Select the downloaded ZIP file and click "Install Now". After installation, click "Activate Plugin".'
            },
            {
                title: 'Step 3: Configure API Keys',
                content: 'Go to WooCommerce > Settings > Payments > Payvost. Enter your Publishable and Secret Keys from your Payvost developer dashboard. Configure other settings as needed and save changes.'
            },
            {
                title: 'Step 4: Enable and Test',
                content: 'Ensure the Payvost payment gateway is enabled. You can use test mode to make a few test transactions to ensure everything is working correctly before going live.'
            },
        ],
    },
    // Add other integrations here
};

export default function IntegrationDetailPage({ params }: { params: { slug: string } }) {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  // For now, we'll hardcode to woocommerce. In a real app, you'd use the slug.
  const integration = integrationData.woocommerce;

  return (
    
      <main className="flex-1 p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/integrations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold md:text-2xl">Integration Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <img src={integration.logo} data-ai-hint={integration.hint} alt={integration.name} className="h-16 w-16 rounded-lg" />
                  <div>
                    <CardTitle className="text-3xl">{integration.name}</CardTitle>
                    <CardDescription className="mt-1">By Payvost Team</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{integration.description}</p>
                
                <Separator className="my-6" />

                <h3 className="font-semibold text-lg mb-4">Key Features</h3>
                <ul className="space-y-3">
                  {integration.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Separator className="my-6" />

                <h3 className="font-semibold text-lg mb-4">Installation Guide</h3>
                <Accordion type="single" collapsible className="w-full">
                  {integration.setupSteps.map((step, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>{step.title}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{step.content}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Connect to WooCommerce</Button>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start"><BookOpen className="mr-2 h-4 w-4" />Read Documentation</Button>
                <Button variant="outline" className="w-full justify-start"><LifeBuoy className="mr-2 h-4 w-4" />Contact Support</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    
  );
}
