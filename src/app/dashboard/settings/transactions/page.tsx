'use client';

import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, Bell, FileText, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransactionSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Transactions</h2>
        <p className="text-sm text-muted-foreground">Shortcuts for recipients, templates, and FX alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Shortcuts</CardTitle>
          <CardDescription>Jump to common tools that affect how you pay and transfer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/dashboard/recipients">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Saved recipients
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/dashboard/payments?tab=bill-payment">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Frequent bill templates
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/fx-rates">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                FX rates and currency pairs
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/fx-rates?open=rate-alert">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Create an exchange rate alert
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

