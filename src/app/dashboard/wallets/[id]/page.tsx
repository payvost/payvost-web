'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { walletService, type Account } from '@/services';
import { getCurrencyName, getFlagCode } from '@/utils/currency-meta';
import Image from 'next/image';
import { ArrowLeft, Copy } from 'lucide-react';

function formatMoney(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseNumber(v: any): number {
  if (typeof v === 'number') return v;
  const n = Number.parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

export default function WalletDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const walletId = params.id;

  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  const [ledger, setLedger] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  const [fundingSource, setFundingSource] = useState<any | null>(null);
  const [loadingFunding, setLoadingFunding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingAccount(true);
      try {
        const res = await walletService.getAccount(walletId);
        if (cancelled) return;
        const normalized = {
          ...res,
          balance: typeof (res as any).balance === 'string' ? parseFloat((res as any).balance) : (res as any).balance,
        } as Account;
        setAccount(normalized);
      } catch (e: any) {
        toast({ title: 'Unable to load wallet', description: e?.message || 'Please try again.', variant: 'destructive' });
        setAccount(null);
      } finally {
        if (!cancelled) setLoadingAccount(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [walletId, toast]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingLedger(true);
      try {
        const json = await walletService.getLedger(walletId, { limit: 50, offset: 0 });
        if (cancelled) return;
        setLedger(Array.isArray(json.entries) ? json.entries : []);
      } catch (e: any) {
        if (!cancelled) setLedger([]);
      } finally {
        if (!cancelled) setLoadingLedger(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [walletId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingFunding(true);
      try {
        const res = await walletService.getFundingInstructions(walletId);
        if (!cancelled) setFundingSource(res.fundingSource);
      } catch {
        if (!cancelled) setFundingSource(null);
      } finally {
        if (!cancelled) setLoadingFunding(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [walletId]);

  const flag = useMemo(() => (account ? getFlagCode(account.currency).toUpperCase() : 'US'), [account]);
  const name = useMemo(() => (account ? getCurrencyName(account.currency) : ''), [account]);

  const bank = fundingSource?.details?.bank_account || null;
  const reference = `PV-${walletId}`;

  const copyDepositDetails = async () => {
    if (!account || !bank) return;
    const lines = [
      `Currency: ${account.currency}`,
      `Beneficiary: ${bank.beneficiary_name || ''}`,
      `Bank: ${bank.bank_name || ''}`,
      `Account number: ${bank.account_number || ''}`,
      bank.routing_number ? `Routing: ${bank.routing_number}` : null,
      bank.iban ? `IBAN: ${bank.iban}` : null,
      bank.bic_swift ? `SWIFT/BIC: ${bank.bic_swift}` : null,
      `Reference/Memo: ${reference}`,
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(lines);
    toast({ title: 'Copied', description: 'Deposit details copied.' });
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/wallets">Wallets</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/wallets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {loadingAccount ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-56" />
            </CardContent>
          </Card>
        ) : account ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Image src={`/flag/${flag}.png`} alt={`${account.currency} flag`} width={28} height={28} className="rounded-full border object-cover" />
                <div>
                  <CardTitle>{account.currency} wallet</CardTitle>
                  <CardDescription>{name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{formatMoney(account.balance, account.currency)}</div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Deposit details</CardTitle>
              <CardDescription>Use these details for bank transfers into this wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFunding ? (
                <Skeleton className="h-24 w-full" />
              ) : bank ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Beneficiary</div>
                      <div className="font-semibold break-words">{bank.beneficiary_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Bank</div>
                      <div className="font-semibold break-words">{bank.bank_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Account number</div>
                      <div className="font-semibold break-words">{bank.account_number}</div>
                    </div>
                    {bank.routing_number ? (
                      <div>
                        <div className="text-xs text-muted-foreground">Routing</div>
                        <div className="font-semibold break-words">{bank.routing_number}</div>
                      </div>
                    ) : null}
                    {bank.iban ? (
                      <div>
                        <div className="text-xs text-muted-foreground">IBAN</div>
                        <div className="font-semibold break-words">{bank.iban}</div>
                      </div>
                    ) : null}
                    {bank.bic_swift ? (
                      <div>
                        <div className="text-xs text-muted-foreground">SWIFT/BIC</div>
                        <div className="font-semibold break-words">{bank.bic_swift}</div>
                      </div>
                    ) : null}
                    <div className="sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Reference / Memo</div>
                      <div className="font-semibold break-words">{reference}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={copyDepositDetails}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy deposit details
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No deposit details found for this wallet yet. Open the wallet funding flow to generate them.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ledger</CardTitle>
              <CardDescription>Most recent balance changes for this wallet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLedger ? (
                    [...Array(6)].map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={3}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : ledger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                        No ledger entries yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.slice(0, 25).map((e: any) => {
                      const amt = parseNumber(e.amount);
                      const currency = account?.currency || 'USD';
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="font-medium">{e.description || (amt >= 0 ? 'Credit' : 'Debit')}</div>
                            <div className="text-xs text-muted-foreground">{e.type}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={amt >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {amt < 0 ? '-' : ''}
                              {formatMoney(Math.abs(amt), currency)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
