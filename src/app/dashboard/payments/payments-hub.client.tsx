'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { paymentsService, type PaymentOrder } from '@/services/paymentsService';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Calendar, FileText, Gift, HandCoins, Send, Settings2, Upload, Wallet } from 'lucide-react';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: PaymentOrder['status'] }) {
  const variant =
    status === 'COMPLETED' ? 'default' : status === 'FAILED' ? 'destructive' : ('secondary' as const);
  return <Badge variant={variant}>{status}</Badge>;
}

type ActivityState = {
  loading: boolean;
  items: PaymentOrder[];
  error: string | null;
};

function PaymentsActivityPreview() {
  const { toast } = useToast();
  const [state, setState] = useState<ActivityState>({ loading: true, items: [], error: null });
  const lastToastedError = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const load = async () => {
    if (!mountedRef.current) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await paymentsService.activity({ limit: 25 });
      if (!mountedRef.current) return;
      setState({ loading: false, items: res.items || [], error: null });
    } catch (error: any) {
      const message = error?.message || 'Please try again';
      console.error('Failed to load payments activity:', error);
      if (!mountedRef.current) return;
      setState({ loading: false, items: [], error: message });

      if (lastToastedError.current !== message) {
        lastToastedError.current = message;
        toast({
          title: 'Failed to load activity',
          description: message,
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        await load();
      } finally {
        // no-op; load() already sets state
      }
    })();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const previewItems = useMemo(() => state.items.slice(0, 5), [state.items]);

  const statusCounts = useMemo(() => {
    const pendingStatuses: Array<PaymentOrder['status']> = ['QUOTED', 'AUTHORIZED', 'SUBMITTED', 'PROCESSING'];
    const pending = state.items.filter((p) => pendingStatuses.includes(p.status)).length;
    const failed = state.items.filter((p) => p.status === 'FAILED').length;
    const refunded = state.items.filter((p) => p.status === 'REFUNDED').length;
    return { pending, failed, refunded };
  }, [state.items]);

  if (state.loading) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Last 5 outbound payments</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="py-10 text-center text-muted-foreground">Loading activity...</CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>We could not load your payments right now.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="text-sm text-muted-foreground">{state.error}</div>
          <Button variant="outline" onClick={() => void load()} data-tracking-id="payments.activity.retry">
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!state.items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Your outbound payments will appear here</CardDescription>
        </CardHeader>
        <CardContent className="py-10 text-center text-muted-foreground">No payments yet.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Last 5 outbound payments</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {statusCounts.pending > 0 ? <Badge variant="secondary">Pending {statusCounts.pending}</Badge> : null}
          {statusCounts.failed > 0 ? <Badge variant="destructive">Failed {statusCounts.failed}</Badge> : null}
          {statusCounts.refunded > 0 ? <Badge variant="secondary">Refunded {statusCounts.refunded}</Badge> : null}
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/payments/activity" data-tracking-id="payments.activity.view_all">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {previewItems.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">{p.type.replaceAll('_', ' ')}</div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-sm text-muted-foreground">
                Ref: <span className="font-mono">{p.id}</span> - {format(new Date(p.createdAt), 'MMM dd, yyyy HH:mm')}
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

export default function PaymentsHubClient() {
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

  const explore = useMemo(
    () => [
      {
        title: 'Pay bills / Airtime',
        description: 'Utilities, airtime, and services.',
        href: '/dashboard/payments/bills',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: 'Gift Cards',
        description: 'Buy and manage gift cards.',
        href: '/dashboard/payments/gift-cards',
        icon: <Gift className="h-5 w-5" />,
      },
      {
        title: 'Bulk Payments',
        description: 'Upload and pay many recipients.',
        href: '/dashboard/payments/bulk',
        icon: <Upload className="h-5 w-5" />,
      },
      {
        title: 'Scheduled / Recurring',
        description: 'Recurring and future payments.',
        href: '/dashboard/payments/scheduled',
        icon: <Calendar className="h-5 w-5" />,
      },
    ],
    []
  );

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Send, request, and manage your payments.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/payment-methods" data-tracking-id="payments.methods.manage_header">
              Manage methods
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Start a payment in seconds.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild data-tracking-id="payments.cta.send">
                <Link href="/dashboard/payments/send">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Link>
              </Button>
              <Button asChild variant="secondary" data-tracking-id="payments.cta.request">
                <Link href="/dashboard/request-payment">
                  <HandCoins className="mr-2 h-4 w-4" />
                  Request
                </Link>
              </Button>
              <Button asChild variant="outline" data-tracking-id="payments.cta.add_money">
                <Link href="/dashboard/wallets">
                  <Wallet className="mr-2 h-4 w-4" />
                  Add money
                </Link>
              </Button>
              <Button asChild variant="outline" data-tracking-id="payments.cta.withdraw">
                <Link href="/dashboard/wallets">
                  <Wallet className="mr-2 h-4 w-4" />
                  Withdraw
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Payment methods
              </CardTitle>
              <CardDescription>Cards, wallets, and payout options.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">No default payment method set.</div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/settings/payment-methods" data-tracking-id="payments.methods.manage_card">
                  Manage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <PaymentsActivityPreview />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {explore.map((a) => (
            <Card key={a.href} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {a.icon}
                  {a.title}
                </CardTitle>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href={a.href} data-tracking-id={`payments.explore.${a.href.replaceAll('/', '_')}`}>
                    Open
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}
