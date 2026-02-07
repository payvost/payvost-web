'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { paymentsService, type PaymentOrder } from '@/services/paymentsService';
import { useToast } from '@/hooks/use-toast';
import { Calendar, FileText, Gift, Send, Upload } from 'lucide-react';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: PaymentOrder['status'] }) {
  const variant =
    status === 'COMPLETED' ? 'default' : status === 'FAILED' ? 'destructive' : ('secondary' as const);
  return <Badge variant={variant}>{status}</Badge>;
}

function PaymentsActivity() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PaymentOrder[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await paymentsService.activity({ limit: 25 });
        if (!cancelled) setItems(res.items || []);
      } catch (error: any) {
        console.error('Failed to load payments activity:', error);
        toast({
          title: 'Failed to load activity',
          description: error?.message || 'Please try again',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading activity...</CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Your outbound payments will appear here</CardDescription>
        </CardHeader>
        <CardContent className="py-10 text-center text-muted-foreground">No payments yet.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Track status, receipts, and references</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">{p.type.replaceAll('_', ' ')}</div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-sm text-muted-foreground">
                Ref: <span className="font-mono">{p.id}</span> • {format(new Date(p.createdAt), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {Number(p.targetAmount).toFixed(2)} {p.targetCurrency}
              </div>
              <div className="text-sm text-muted-foreground">
                Paid: {Number(p.sourceAmount).toFixed(2)} {p.sourceCurrency}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function PaymentsHubPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Backward-compat: old tab-based navigation.
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    const mapping: Record<string, string> = {
      remittances: '/dashboard/payments/send',
      'bill-payment': '/dashboard/payments/bills',
      'gift-cards': '/dashboard/payments/gift-cards',
      scheduled: '/dashboard/payments/scheduled',
      'bulk-transfer': '/dashboard/payments/bulk',
      'split-payment': '/dashboard/request-payment?tab=split-payment',
    };
    const target = mapping[tab];
    if (target) {
      router.replace(target);
    }
  }, [router, searchParams]);

  const actions = useMemo(
    () => [
      {
        title: 'Send Money',
        description: 'International transfers and remittances',
        href: '/dashboard/payments/send',
        icon: <Send className="h-5 w-5" />,
      },
      {
        title: 'Pay a Bill',
        description: 'Utilities, airtime, and services',
        href: '/dashboard/payments/bills',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: 'Gift Cards',
        description: 'Buy and manage gift cards',
        href: '/dashboard/payments/gift-cards',
        icon: <Gift className="h-5 w-5" />,
      },
      {
        title: 'Bulk Payments',
        description: 'Upload and pay many recipients',
        href: '/dashboard/payments/bulk',
        icon: <Upload className="h-5 w-5" />,
      },
      {
        title: 'Scheduled',
        description: 'Recurring and future payments',
        href: '/dashboard/payments/scheduled',
        icon: <Calendar className="h-5 w-5" />,
      },
    ],
    []
  );

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Payments</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard/wallets">Top up wallet</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => (
            <Card key={a.href} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {a.icon}
                  {a.title}
                </CardTitle>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={a.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <PaymentsActivity />
      </main>
    </DashboardLayout>
  );
}

