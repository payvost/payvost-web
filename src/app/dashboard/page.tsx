'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { LanguagePreference } from '@/types/language';
import { DashboardLayout } from '@/components/dashboard-layout';
import { RecentTransactions } from '@/components/recent-transactions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, ArrowUpRight, ArrowDownRight, ShieldCheck, Sparkles } from 'lucide-react';
import { AccountCompletion } from '@/components/account-completion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { KycNotification } from '@/components/kyc-notification';
import { DashboardLoadingSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { TransactionPinSetupDialog } from '@/components/transaction-pin-setup-dialog';
import { ErrorBoundary } from '@/components/error-boundary';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

import { useDashboardData } from '@/hooks/use-dashboard-data';
import { WalletOverview } from '@/components/dashboard/WalletOverview';
import { SpendingBreakdown } from '@/components/dashboard/SpendingBreakdown';
import { InvoiceOverview } from '@/components/dashboard/InvoiceOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DisputeOverview } from '@/components/dashboard/DisputeOverview';

const TransactionChart = dynamic(() => import('@/components/transaction-chart').then(mod => mod.TransactionChart), {
    ssr: false,
    loading: () => <Skeleton className="h-[250px]" />,
});

interface GreetingState {
    text: string;
    icon: React.ReactNode;
}

type FilterLabel = 'Last 30 Days' | 'Last 60 Days' | 'Last 90 Days';

const filterToMonths: Record<FilterLabel, number> = {
    'Last 30 Days': 1,
    'Last 60 Days': 2,
    'Last 90 Days': 3,
};

export default function DashboardPage() {
    const [language, setLanguage] = useState<LanguagePreference>('en');
    const [filter, setFilter] = useState<FilterLabel>('Last 30 Days');
    const [greeting, setGreeting] = useState<GreetingState | null>(null);

    const {
        user,
        authLoading,
        wallets,
        loadingWallets,
        isKycVerified,
        homeCurrency,
        defaultWalletCurrency,
        chartData,
        spendingData,
        hasTransactionData,
        invoices,
        loadingInvoices,
        disputes,
        loadingDisputes,
        pinDialogOpen,
        setPinDialogOpen,
        refreshWallets,
        firstName
    } = useDashboardData();

    const LayoutComponent = DashboardLayout;

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting({ text: "Good Morning", icon: <Sun className="h-6 w-6 text-yellow-500" /> });
        } else if (hour < 18) {
            setGreeting({ text: "Good Afternoon", icon: <Sun className="h-6 w-6 text-orange-500" /> });
        } else {
            setGreeting({ text: "Good Evening", icon: <Moon className="h-6 w-6 text-blue-400" /> });
        }
    }, []);

    const isLoading = authLoading || loadingWallets;

    const primaryCurrency = defaultWalletCurrency || homeCurrency || null;

    const primaryWallet = useMemo(() => {
        if (!wallets || wallets.length === 0) return null;
        if (primaryCurrency) {
            const match = wallets.find((w) => w.currency === primaryCurrency);
            if (match) return match;
        }
        // Stable fallback: first wallet by currency code (avoid "random" changes when balances are equal).
        return [...wallets].sort((a, b) => a.currency.localeCompare(b.currency))[0];
    }, [wallets, primaryCurrency]);

    const formatMoney = (value: number, currency?: string) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || primaryWallet?.currency || primaryCurrency || 'USD',
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2
        }).format(Number.isFinite(value) ? value : 0);

    const pendingInvoices = useMemo(
        () => invoices.filter((invoice) => (invoice.status || '').toLowerCase() === 'pending').length,
        [invoices]
    );

    const filteredChartData = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];
        const months = filterToMonths[filter] ?? chartData.length;
        return chartData.slice(Math.max(chartData.length - months, 0));
    }, [chartData, filter]);

    const openDisputesCount = useMemo(() => {
        let openCount = 0;
        for (const d of disputes) {
            const raw = (d?.status ?? d?.state ?? d?.resolution ?? '').toString().toLowerCase();
            const isResolved =
                raw.includes('resolved') ||
                raw.includes('closed') ||
                raw.includes('won') ||
                raw.includes('lost');
            if (!isResolved) openCount += 1;
        }
        return openCount;
    }, [disputes]);

    const incomeTotal = filteredChartData.reduce((sum, item) => sum + item.income, 0);
    const expenseTotal = filteredChartData.reduce((sum, item) => sum + item.expense, 0);
    const netFlow = incomeTotal - expenseTotal;

    if (isLoading) {
        return (
            <LayoutComponent language={language} setLanguage={setLanguage}>
                <DashboardLoadingSkeleton />
            </LayoutComponent>
        );
    }

    return (
        <LayoutComponent language={language} setLanguage={setLanguage}>
            <ErrorBoundary>
                <div className="flex-1 space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
                    <Breadcrumb className="hidden sm:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Overview</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <section className="rounded-lg border bg-card text-foreground shadow-sm">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {greeting?.icon}
                                        <span>{greeting?.text}, {firstName}</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold">Your money at a glance</h1>
                                    <p className="text-sm text-muted-foreground">Real activity pulled from your wallets, invoices, and transfers.</p>
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 w-full sm:w-auto">
                                        <Button asChild size="sm" className="w-full sm:w-auto">
                                            <Link href="/dashboard/payments" className="flex items-center gap-2">
                                                Send money
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                                            <Link href="/dashboard/request-payment" className="text-center">Request payment</Link>
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-4 min-w-[260px] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary wallet</p>
                                        <Badge variant="secondary" className="text-xs">
                                            {wallets.length} wallets
                                        </Badge>
                                    </div>
                                    <div className="text-3xl font-semibold">
                                        {primaryWallet ? formatMoney(Number(primaryWallet.balance || 0), primaryWallet.currency) : '--'}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {primaryWallet ? `${primaryWallet.currency} - refreshed live` : 'Create your first wallet to start'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            {isKycVerified ? <ShieldCheck className="h-3.5 w-3.5 mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                                            {isKycVerified ? 'KYC verified' : 'Finish KYC to unlock limits'}
                                        </Badge>
                                        {pendingInvoices > 0 && (
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-800 border border-amber-200">
                                                {pendingInvoices} invoice{pendingInvoices > 1 ? 's' : ''} pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Removed wallet chips from hero card to keep it cleaner (wallets live in the Wallet section). */}

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <StatTile
                                    label="Net flow"
                                    value={formatMoney(netFlow)}
                                    hint={`${formatMoney(incomeTotal)} in / ${formatMoney(expenseTotal)} out`}
                                    tone={netFlow >= 0 ? 'positive' : 'negative'}
                                />
                                <StatTile
                                    label="Inflow (selected window)"
                                    value={formatMoney(incomeTotal)}
                                    hint={filter}
                                />
                                <StatTile
                                    label="Outflow (selected window)"
                                    value={formatMoney(expenseTotal)}
                                    hint={filter}
                                    tone="neutral"
                                    icon={<ArrowDownRight className="h-4 w-4" />}
                                />
                                <StatTile
                                    label="Disputes open"
                                    value={`${openDisputesCount}`}
                                    hint={openDisputesCount > 0 ? "Needs attention" : "All clear"}
                                />
                            </div>
                        </div>
                    </section>

                    {!isKycVerified && <KycNotification onDismiss={() => { }} />}

                    {user && (
                        <TransactionPinSetupDialog
                            userId={user.uid}
                            open={pinDialogOpen}
                            onOpenChange={setPinDialogOpen}
                            onCompleted={() => setPinDialogOpen(false)}
                            force={false}
                        />
                    )}

                    <WalletOverview
                        wallets={wallets}
                        loading={loadingWallets}
                        isKycVerified={isKycVerified}
                        onWalletCreated={refreshWallets}
                        requiredCurrencyFirst={homeCurrency}
                    />

                    <div className="grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="border border-muted-foreground/10 shadow-sm">
                                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Cash flow</CardTitle>
                                        <CardDescription>Income vs expense based on your real transactions.</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9">
                                                {filter}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setFilter('Last 30 Days')}>Last 30 Days</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setFilter('Last 60 Days')}>Last 60 Days</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setFilter('Last 90 Days')}>Last 90 Days</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    {hasTransactionData && filteredChartData.length > 0 ? (
                                        <TransactionChart data={filteredChartData} />
                                    ) : (
                                        <div className="h-[250px] flex flex-col items-center justify-center text-center">
                                            <p className="text-muted-foreground">We are still propagating your data.</p>
                                            <p className="text-sm text-muted-foreground">Your transaction chart will appear here once you have enough activity.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <RecentTransactions />
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <QuickActions isKycVerified={isKycVerified} />
                            <AccountCompletion />
                            <InvoiceOverview invoices={invoices} loading={loadingInvoices} isKycVerified={isKycVerified} />
                            <SpendingBreakdown spendingData={spendingData} hasTransactionData={hasTransactionData} />
                            <DisputeOverview disputes={disputes} loading={loadingDisputes} />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </LayoutComponent>
    );
}

function StatTile({
    label,
    value,
    hint,
    icon,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    hint?: string;
    icon?: React.ReactNode;
    tone?: 'positive' | 'negative' | 'neutral';
}) {
    const toneClasses = {
        positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        negative: 'bg-rose-50 text-rose-700 border-rose-200',
        neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    };

    return (
        <div className="rounded-lg border bg-background px-4 py-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                {icon && <span className="h-6 w-6 text-muted-foreground">{icon}</span>}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            <div className={`mt-2 inline-flex items-center rounded-full border px-2 py-1 text-[11px] ${toneClasses[tone]}`}>
                {tone === 'positive' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                {tone === 'negative' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                {tone === 'neutral' && <Sparkles className="h-3 w-3 mr-1" />}
                <span className="font-medium capitalize">{tone === 'neutral' ? 'insight' : tone}</span>
            </div>
        </div>
    );
}
