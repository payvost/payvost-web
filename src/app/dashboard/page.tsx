'use client';

import React, { useState, useEffect } from 'react';
import type { LanguagePreference } from '@/types/language';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Payvost } from '@/components/Payvost';
import { RecentTransactions } from '@/components/recent-transactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { AccountCompletion } from '@/components/account-completion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { KycNotification } from '@/components/kyc-notification';
import { DashboardLoadingSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { TransactionPinSetupDialog } from '@/components/transaction-pin-setup-dialog';
import { ErrorBoundary } from '@/components/error-boundary';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// New Imports
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { WalletOverview } from '@/components/dashboard/WalletOverview';
import { SpendingBreakdown } from '@/components/dashboard/SpendingBreakdown';
import { PartnerTransactions } from '@/components/dashboard/PartnerTransactions';
import { InvoiceOverview } from '@/components/dashboard/InvoiceOverview';

const TransactionChart = dynamic(() => import('@/components/transaction-chart').then(mod => mod.TransactionChart), {
    ssr: false,
    loading: () => <Skeleton className="h-[250px]" />,
});

interface GreetingState {
    text: string;
    icon: React.ReactNode;
}

export default function DashboardPage() {
    const [language, setLanguage] = useState<LanguagePreference>('en');
    const [filter, setFilter] = useState('Last 30 Days');
    const [greeting, setGreeting] = useState<GreetingState | null>(null);

    const {
        user,
        authLoading,
        wallets,
        loadingWallets,
        isKycVerified,
        chartData,
        spendingData,
        hasTransactionData,
        invoices,
        loadingInvoices,
        externalTxStats,
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
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Breadcrumb>
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
                    <div className="flex items-center gap-2">
                        {greeting?.icon}
                        <h1 className="text-lg font-semibold md:text-2xl">
                            {greeting?.text}, {firstName}!
                        </h1>
                    </div>

                    {!isKycVerified && !isLoading && <KycNotification onDismiss={() => { }} />}

                    {user && (
                        <TransactionPinSetupDialog
                            userId={user.uid}
                            open={pinDialogOpen}
                            onOpenChange={setPinDialogOpen}
                            onCompleted={() => setPinDialogOpen(false)}
                            force={false}
                        />
                    )}

                    {/* Wallet Overview */}
                    <WalletOverview
                        wallets={wallets}
                        loading={loadingWallets}
                        isKycVerified={isKycVerified}
                        onWalletCreated={refreshWallets}
                    />

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
                        <div className="lg:col-span-4 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Overview</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8">
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
                                    {hasTransactionData ? (
                                        <TransactionChart data={chartData} />
                                    ) : (
                                        <div className="h-[250px] flex flex-col items-center justify-center text-center">
                                            <p className="text-muted-foreground">We are still propagating your data.</p>
                                            <p className="text-sm text-muted-foreground">Your transaction chart will appear here once you have enough activity.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <RecentTransactions />

                            <SpendingBreakdown spendingData={spendingData} hasTransactionData={hasTransactionData} />

                            <PartnerTransactions stats={externalTxStats} />
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            <Payvost />
                            <AccountCompletion />
                            <InvoiceOverview invoices={invoices} loading={loadingInvoices} isKycVerified={isKycVerified} />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </LayoutComponent>
    );
}
