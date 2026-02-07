'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PaymentMethodsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        <p className="text-sm text-muted-foreground">Manage ways you pay and get paid.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Virtual cards
            </CardTitle>
            <CardDescription>Create and manage virtual cards.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-between">
              <Link href="/dashboard/cards">
                <span>Open cards</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet funding
            </CardTitle>
            <CardDescription>Fund wallets and view funding instructions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/dashboard/wallets">
                <span>Open wallets</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>Bank accounts</span>
            <Badge variant="secondary">Coming soon</Badge>
          </CardTitle>
          <CardDescription>Add bank accounts for payouts and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bank account linking is not available yet. For now, manage funds via wallets and cards.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

