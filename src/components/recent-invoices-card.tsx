'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Edit, ExternalLink, RefreshCw } from 'lucide-react';

type UiInvoice = {
  id: string;
  invoiceNumber?: string | null;
  toName?: string | null;
  currency?: string | null;
  grandTotal?: number | null;
  status?: string | null;
  createdAt?: string | null;
  dueDate?: string | null;
  publicUrl?: string | null;
};

function isRejectedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'rejected' || s === 'void' || s === 'cancelled' || s === 'canceled' || s === 'credited';
}

function isPaidStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'paid';
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toLowerCase();
  if (s === 'paid') return 'default';
  if (s === 'overdue') return 'destructive';
  if (isRejectedStatus(s)) return 'destructive';
  if (s === 'draft') return 'outline';
  return 'secondary';
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function safeDateLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function RecentInvoicesCard(props: {
  refreshKey?: number;
  limit?: number;
  onEditDraft?: (invoiceId: string) => void;
}) {
  const { refreshKey = 0, limit = 8, onEditDraft } = props;
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<UiInvoice[]>([]);

  const fetchInvoices = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/invoices?invoiceType=USER&limit=${encodeURIComponent(String(limit * 4))}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data?.invoices) ? (data.invoices as UiInvoice[]) : [];
      setInvoices(list);
    } catch (e: unknown) {
      console.error('RecentInvoicesCard: failed to fetch invoices', e);
      const msg = e instanceof Error ? e.message : 'Failed to load invoices';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    void fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  const groups = useMemo(() => {
    const all = [...invoices];
    const paid = all.filter(inv => isPaidStatus(String(inv.status || '')));
    const rejected = all.filter(inv => isRejectedStatus(String(inv.status || '')));
    const unpaid = all.filter(inv => {
      const status = String(inv.status || '');
      return !isPaidStatus(status) && !isRejectedStatus(status);
    });
    return { all, paid, unpaid, rejected };
  }, [invoices]);

  const renderTable = (list: UiInvoice[]) => {
    const rows = list.slice(0, limit);
    if (rows.length === 0) {
      return (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No invoices in this group yet.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right sr-only">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(inv => {
            const status = String(inv.status || 'Draft');
            const amount = typeof inv.grandTotal === 'number' ? inv.grandTotal : Number(inv.grandTotal || 0);
            const currency = String(inv.currency || 'USD');
            const invoiceLabel = inv.invoiceNumber ? `#${inv.invoiceNumber}` : 'Draft';
            const canEdit = status.toLowerCase() === 'draft' && typeof onEditDraft === 'function';

            return (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/request-payment/invoice/${inv.id}`} className="inline-flex items-center gap-2">
                    {invoiceLabel}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <div className="text-xs text-muted-foreground">{safeDateLabel(inv.createdAt)}</div>
                </TableCell>
                <TableCell className="max-w-[12rem] truncate">{inv.toName || 'Client'}</TableCell>
                <TableCell>{formatMoney(amount, currency)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditDraft?.(inv.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit draft</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const link = String(inv.publicUrl || '');
                        if (!link) {
                          toast({
                            title: 'No public link',
                            description: 'This invoice does not have a public link yet (drafts usually do not).',
                            variant: 'destructive',
                          });
                          return;
                        }
                        const url = link.startsWith('http') ? link : `${window.location.origin}${link}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: 'Link copied', description: 'Public invoice link copied to clipboard.' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy link</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Track invoices you have created recently.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => void fetchInvoices()} disabled={!user || loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!user && !loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Sign in to view your invoices.
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="w-fit justify-start flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderTable(groups.all)}</TabsContent>
            <TabsContent value="paid">{renderTable(groups.paid)}</TabsContent>
            <TabsContent value="unpaid">{renderTable(groups.unpaid)}</TabsContent>
            <TabsContent value="rejected">{renderTable(groups.rejected)}</TabsContent>
          </Tabs>
        )}
      </CardContent>
      {!loading && invoices.length > 0 && (
        <CardFooter className="text-xs text-muted-foreground">
          Showing {Math.min(limit, invoices.length)} of {invoices.length} invoices
        </CardFooter>
      )}
    </Card>
  );
}
