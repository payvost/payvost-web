'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { externalTransactionService } from '@/services';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Receipt, Repeat, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface BillPaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  recipientDetails?: {
    billerName?: string;
    accountNumber?: string;
    receiptNumber?: string;
  };
  metadata?: {
    sourceCurrency?: string;
    exchangeRate?: number;
    conversionFee?: number;
  };
}

export function BillPaymentHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<BillPaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);
      try {
        const response = await externalTransactionService.getByUser(user.uid, {
          type: 'BILL_PAYMENT',
          limit: 50,
        });
        
        if (response && response.transactions) {
          setHistory(response.transactions);
        }
      } catch (err: any) {
        console.error('Failed to load bill payment history:', err);
        setError(err.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PROCESSING':
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
      PENDING: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
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
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-muted rounded-lg">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {item.recipientDetails?.billerName || 'Bill Payment'}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Account: {item.recipientDetails?.accountNumber || 'N/A'}</div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                      {item.recipientDetails?.receiptNumber && (
                        <span className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          Receipt: {item.recipientDetails.receiptNumber}
                        </span>
                      )}
                    </div>
                    {item.metadata?.needsConversion && (
                      <div className="text-xs text-muted-foreground">
                        Converted from {item.metadata.sourceCurrency} 
                        {item.metadata.exchangeRate && ` (Rate: ${item.metadata.exchangeRate.toFixed(4)})`}
                        {item.metadata.conversionFee && ` • Fee: ${item.metadata.conversionFee.toFixed(2)}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {item.amount.toFixed(2)} {item.currency}
                  </div>
                  {item.metadata?.sourceCurrency && item.metadata.sourceCurrency !== item.currency && (
                    <div className="text-sm text-muted-foreground">
                      Paid: {item.metadata.sourceAmount?.toFixed(2)} {item.metadata.sourceCurrency}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

