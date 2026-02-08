'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CardSummary, CardTransaction } from '@/types/cards-v2';
import { fetchCardTransactions } from '@/services/cardsService';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Settings, Snowflake, Power } from 'lucide-react';
import { VirtualCard } from '@/components/virtual-card';
import { CardAuditDialog } from '@/components/card-audit-dialog';

function formatMoney(amount: string | number, currency: string) {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

function computeSpent(txs: CardTransaction[]) {
  return txs.reduce((sum, tx) => {
    const n = typeof tx.amount === 'string' ? Number(tx.amount) : tx.amount;
    if (!Number.isFinite(n)) return sum;
    // Use a conservative budget view: count completed clearing, refunds/reversals reduce spend.
    if (tx.status !== 'COMPLETED') return sum;
    return sum + n;
  }, 0);
}

function periodStart(interval: string, now = new Date()) {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  if (interval === 'DAILY') return new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
  if (interval === 'WEEKLY') {
    // Monday 00:00 UTC
    const dow = d.getUTCDay(); // 0=Sun
    const offset = (dow + 6) % 7;
    const start = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
    start.setUTCDate(start.getUTCDate() - offset);
    return start;
  }
  if (interval === 'MONTHLY') return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  if (interval === 'YEARLY') return new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
  return new Date(0); // ALL_TIME
}

export function CardDetails(props: {
  card: CardSummary;
  onFreezeToggle?: (card: CardSummary) => void;
  onTerminate?: (card: CardSummary) => void;
  onOpenControls?: (card: CardSummary) => void;
}) {
  const [loadingTx, setLoadingTx] = useState(true);
  const [txs, setTxs] = useState<CardTransaction[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTx(true);
      try {
        const resp = await fetchCardTransactions(props.card.id, { limit: 50 });
        if (!cancelled) setTxs(resp.transactions || []);
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [props.card.id]);

  const limit = props.card.controls?.spendLimitAmount ? Number(props.card.controls.spendLimitAmount) : 0;
  const spent = useMemo(() => {
    const interval = props.card.controls?.spendLimitInterval || 'MONTHLY';
    const start = periodStart(interval);
    const inPeriod = txs.filter((t) => new Date(t.happenedAt).getTime() >= start.getTime());
    return Math.max(0, computeSpent(inPeriod));
  }, [txs, props.card.controls?.spendLimitInterval]);
  const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-1 space-y-6">
        <VirtualCard card={props.card} onFreezeToggle={props.onFreezeToggle} onTerminate={props.onTerminate} onOpenControls={props.onOpenControls} />

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Card summary and status.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Card name</span>
              <span className="font-medium">{props.card.label}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{props.card.status.toLowerCase()}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{props.card.type.toLowerCase()}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{props.card.network}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Last 4</span>
              <span className="font-mono">{props.card.last4}</span>
            </div>
            {props.card.assignedToUserId && (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Assigned</span>
                <span className="font-mono text-xs">{props.card.assignedToUserId.slice(0, 10)}...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => props.onFreezeToggle?.(props.card)} disabled={props.card.status === 'TERMINATED'}>
              <Snowflake className="mr-2 h-4 w-4" /> {props.card.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
            </Button>
            <Button variant="outline" onClick={() => props.onOpenControls?.(props.card)}>
              <Settings className="mr-2 h-4 w-4" /> Controls
            </Button>
            <Button variant="outline" onClick={() => setAuditOpen(true)}>
              <Shield className="mr-2 h-4 w-4" /> Audit
            </Button>
            <Button variant="destructive" onClick={() => props.onTerminate?.(props.card)} disabled={props.card.status === 'TERMINATED'}>
              <Power className="mr-2 h-4 w-4" /> Terminate
            </Button>
          </CardContent>
        </Card>

        <CardAuditDialog open={auditOpen} onOpenChange={setAuditOpen} card={props.card} />

        <Card>
          <CardHeader>
            <CardTitle>Spending Limit</CardTitle>
            <CardDescription>
              {limit > 0 ? `${formatMoney(limit, props.card.currency)} / ${(props.card.controls?.spendLimitInterval || 'MONTHLY').toLowerCase().replace('_', ' ')}` : 'No limit set'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">{limit > 0 ? `${formatMoney(spent, props.card.currency)} spent` : 'Set a limit to track spending against a budget.'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Latest activity for this card.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.length > 0 ? (
                    txs.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.merchantName || tx.kind}</TableCell>
                        <TableCell>{new Date(tx.happenedAt).toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{tx.status.toLowerCase()}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(tx.amount, tx.currency || props.card.currency)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
