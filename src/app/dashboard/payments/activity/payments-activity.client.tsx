'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentsService, type PaymentOrder, type PaymentOrderStatus, type PaymentOrderType } from '@/services/paymentsService';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS: Array<{ value: PaymentOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'AUTHORIZED', label: 'Authorized' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const TYPE_OPTIONS: Array<{ value: PaymentOrderType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All types' },
  { value: 'REMITTANCE', label: 'Remittance' },
  { value: 'BILL_PAYMENT', label: 'Bill payment' },
  { value: 'GIFT_CARD', label: 'Gift card' },
  { value: 'BULK_ITEM', label: 'Bulk item' },
];

function StatusBadge({ status }: { status: PaymentOrder['status'] }) {
  const variant =
    status === 'COMPLETED' ? 'default' : status === 'FAILED' ? 'destructive' : ('secondary' as const);
  return <Badge variant={variant}>{status}</Badge>;
}

type ActivityState = {
  loading: boolean;
  items: PaymentOrder[];
  error: string | null;
  limit: number;
  offset: number;
};

export default function PaymentsActivityPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const status = (searchParams.get('status') as PaymentOrderStatus | 'ALL' | null) || 'ALL';
  const type = (searchParams.get('type') as PaymentOrderType | 'ALL' | null) || 'ALL';
  const limit = Math.min(Number(searchParams.get('limit') || 25) || 25, 200);
  const offset = Math.max(Number(searchParams.get('offset') || 0) || 0, 0);

  const [state, setState] = useState<ActivityState>({
    loading: true,
    items: [],
    error: null,
    limit,
    offset,
  });

  const updateParams = useCallback(
    (next: Partial<{ status: string; type: string; limit: number; offset: number }>) => {
      const q = new URLSearchParams(searchParams.toString());
      if (typeof next.status === 'string') q.set('status', next.status);
      if (typeof next.type === 'string') q.set('type', next.type);
      if (typeof next.limit === 'number') q.set('limit', String(next.limit));
      if (typeof next.offset === 'number') q.set('offset', String(next.offset));
      router.replace(`/dashboard/payments/activity?${q.toString()}`);
    },
    [router, searchParams]
  );

  const fetchActivity = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await paymentsService.activity({
        limit,
        offset,
        status: status === 'ALL' ? undefined : status,
        type: type === 'ALL' ? undefined : type,
      });
      setState({ loading: false, items: res.items || [], error: null, limit, offset });
    } catch (error: any) {
      console.error('Failed to load payments activity:', error);
      const message = error?.message || 'Please try again';
      setState({ loading: false, items: [], error: message, limit, offset });
      toast({ title: 'Failed to load activity', description: message, variant: 'destructive' });
    }
  }, [limit, offset, status, toast, type]);

  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  const canPrev = offset > 0;
  const canNext = state.items.length >= limit;

  const titleSuffix = useMemo(() => {
    const s = status === 'ALL' ? '' : ` · ${status}`;
    const t = type === 'ALL' ? '' : ` · ${type.replaceAll('_', ' ')}`;
    return `${t}${s}`;
  }, [status, type]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Payment activity{titleSuffix}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Filter and review outbound payments.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/payments/send" data-tracking-id="payments.activity.back_to_hub">
            Back to payments
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Route parameters are the source of truth.</CardDescription>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Select
              value={status}
              onValueChange={(v) => updateParams({ status: v, offset: 0 })}
            >
              <SelectTrigger className="w-full sm:w-[200px]" data-tracking-id="payments.activity.filter_status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={(v) => updateParams({ type: v, offset: 0 })}>
              <SelectTrigger className="w-full sm:w-[200px]" data-tracking-id="payments.activity.filter_type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Showing {limit} per page. Offset {offset}.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => updateParams({ offset: Math.max(offset - limit, 0) })}
              data-tracking-id="payments.activity.prev"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => updateParams({ offset: offset + limit })}
              data-tracking-id="payments.activity.next"
            >
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => void fetchActivity()} data-tracking-id="payments.activity.refresh">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading activity...</div>
          ) : state.error ? (
            <div className="py-10 text-center text-muted-foreground">{state.error}</div>
          ) : state.items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No payments found.</div>
          ) : (
            state.items.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">{p.type.replaceAll('_', ' ')}</div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ref: <span className="font-mono">{p.id}</span> · {format(new Date(p.createdAt), 'MMM dd, yyyy HH:mm')}
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
            ))
          )}
        </CardContent>
      </Card>
    </main>
    </DashboardLayout >
  );
}
