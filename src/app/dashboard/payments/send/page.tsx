'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Payvost } from '@/components/Payvost';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default function PaymentsSendPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Send Money</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="lg:col-span-2">
            <Payvost />
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address book</CardTitle>
                <CardDescription>
                  Manage saved beneficiaries for bank payouts. Internal Payvost transfers stay in the Payment ID tab.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link href="/dashboard/recipients">
                    <Users className="h-4 w-4" />
                    Manage beneficiaries
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
