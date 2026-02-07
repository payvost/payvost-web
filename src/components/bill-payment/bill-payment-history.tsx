'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Calendar, Receipt } from 'lucide-react';
import { paymentsService, type PaymentOrder } from '@/services/paymentsService';
import { format } from 'date-fns';

export function BillPaymentHistory() {
  const [history, setHistory] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await paymentsService.activity({ type: 'BILL_PAYMENT', limit: 50 });
        if (!cancelled) setHistory(res.items || []);
      } catch (err: any) {
        console.error('Failed to load bill payment history:', err);
        if (!cancelled) setError(err?.message || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PROCESSING':
      case 'SUBMITTED':
      case 'QUOTED':
      case 'AUTHORIZED':
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      COMPLETED: 'default',
      FAILED: 'destructive',
      PROCESSING: 'secondary',
      SUBMITTED: 'secondary',
      AUTHORIZED: 'secondary',
      QUOTED: 'secondary',
      PENDING: 'secondary',
    };

    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading payment history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bill Payment History</CardTitle>
          <CardDescription>Your recent bill payments will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No bill payments yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Payment History</CardTitle>
        <CardDescription>View and manage your bill payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => {
            const billerId = item.metadata?.billerId ? String(item.metadata.billerId) : null;
            const billerName = item.metadata?.billerName ? String(item.metadata.billerName) : null;
            const acct = item.metadata?.subscriberAccountNumber ? String(item.metadata.subscriberAccountNumber) : null;
            const receipt = item.metadata?.receiptNumber ? String(item.metadata.receiptNumber) : null;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-muted rounded-lg">{getStatusIcon(item.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{billerName || (billerId ? `Biller ${billerId}` : 'Bill Payment')}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Account: {acct || 'N/A'}</div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {receipt ? (
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            Receipt: {receipt}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ref: <span className="font-mono">{item.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {Number(item.targetAmount).toFixed(2)} {item.targetCurrency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Paid: {Number(item.sourceAmount).toFixed(2)} {item.sourceCurrency}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
