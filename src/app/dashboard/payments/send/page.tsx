'use client';

import { Payvost } from '@/components/Payvost';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default function PaymentsSendPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Send Money</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
        <div className="xl:col-span-8">
          <Payvost />
        </div>
        <div className="xl:col-span-4">
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
    </div>
  );
}
