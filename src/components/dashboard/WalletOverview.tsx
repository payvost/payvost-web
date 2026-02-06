
import React from 'react';
import { Card, CardContent, CardTitle, CardDescription, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Wallet, ArrowRight } from 'lucide-react';
import { CreateWalletDialog } from '@/components/create-wallet-dialog';
import { CurrencyCard } from '@/components/currency-card';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { getFlagCode } from '@/utils/currency-meta';
import type { Account } from '@/services';
import Link from 'next/link';

interface WalletOverviewProps {
    wallets: Account[];
    loading: boolean;
    isKycVerified: boolean;
    onWalletCreated: () => void;
    requiredCurrencyFirst?: string | null;
}

export function WalletOverview({ wallets, loading, isKycVerified, onWalletCreated, requiredCurrencyFirst }: WalletOverviewProps) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const hasWallets = wallets.length > 0;
    const showCreateWalletCTA = wallets.length < 4;

    const EmptyState = () => (
        <div className="w-full rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
            <div className="mx-auto max-w-xl space-y-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold">Create your first wallet</CardTitle>
                    <CardDescription className="text-sm">
                        Spin up a currency wallet to start sending, receiving, and holding funds securely.
                    </CardDescription>
                </div>
                <CreateWalletDialog
                    onWalletCreated={onWalletCreated}
                    disabled={!isKycVerified}
                    existingWallets={wallets}
                    requiredCurrencyFirst={requiredCurrencyFirst ?? undefined}
                    enforceRequiredCurrencyFirst={true}
                >
                    <Button size="default" disabled={!isKycVerified} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create wallet
                    </Button>
                </CreateWalletDialog>
                {!isKycVerified && <p className="text-xs text-muted-foreground">Complete KYC to unlock wallet creation.</p>}
                <div className="flex flex-wrap justify-center gap-1.5 text-xs text-muted-foreground">
                    {['USD', 'EUR', 'GBP', 'NGN'].map((currency) => (
                        <Badge key={currency} variant="secondary" className="py-0.5 px-2">{currency}</Badge>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <Card className="border-muted-foreground/15">
                <CardHeader>
                    <CardTitle>Wallets</CardTitle>
                    <CardDescription>Fetching your balances...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-32 animate-pulse rounded-lg bg-muted" />
                </CardContent>
            </Card>
        );
    }

    const renderCarouselContent = () => {
        const items = wallets.map(wallet => (
            <CarouselItem key={wallet.currency} className="md:basis-1/2 lg:basis-1/3">
                <CurrencyCard currency={wallet.currency} balance={wallet.balance} growth="+0.0%" flag={getFlagCode(wallet.currency)} />
            </CarouselItem>
        ));

        if (showCreateWalletCTA) {
            items.push(
                <CarouselItem key="create-wallet-cta" className="md:basis-1/2 lg:basis-1/3">
                    <Card className="flex flex-col justify-center items-center h-full min-h-[200px] border-dashed p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-full"><Wallet className="h-6 w-6 text-muted-foreground" /></div>
                            <div className="flex-1 text-left">
                                <CardTitle className="text-base mb-1">Add Wallet</CardTitle>
                                <CardDescription className="text-xs">Add more currencies to hold.</CardDescription>
                            </div>
                        </div>
                        <CreateWalletDialog
                            onWalletCreated={onWalletCreated}
                            disabled={!isKycVerified}
                            existingWallets={wallets}
                            requiredCurrencyFirst={requiredCurrencyFirst ?? undefined}
                            enforceRequiredCurrencyFirst={true}
                        >
                            <Button size="sm" variant="outline" className="w-full mt-4" disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
                        </CreateWalletDialog>
                    </Card>
                </CarouselItem>
            );
        }
        return items;
    }

    const renderDesktopGrid = () => {
        const cards = wallets.slice(0, 4).map(wallet => (
            <CurrencyCard key={wallet.currency} currency={wallet.currency} balance={wallet.balance} growth="+0.0%" flag={getFlagCode(wallet.currency)} />
        ));

        cards.push(
            <Card key="all-wallets" className="flex flex-col justify-between h-full">
                <CardHeader className="pb-2 pt-6 px-6 text-center">
                    <CardTitle className="text-sm font-medium">All Wallets</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-center items-center">
                    <p className="text-muted-foreground text-xs text-center">View all your currency balances in one place.</p>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                    <Button asChild className="w-full">
                        <Link href="/dashboard/wallets">View All Wallets <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        );

        if (showCreateWalletCTA) {
            cards.push(
                <Card key="create-wallet-cta" className="flex flex-col justify-center items-center h-full border-dashed">
                    <CardContent className="p-6 text-center">
                        <Wallet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <CardTitle className="text-base mb-1">Expand Your Reach</CardTitle>
                        <CardDescription className="text-xs mb-4">Add more currencies to transact globally.</CardDescription>
                        <CreateWalletDialog
                            onWalletCreated={onWalletCreated}
                            disabled={!isKycVerified}
                            existingWallets={wallets}
                            requiredCurrencyFirst={requiredCurrencyFirst ?? undefined}
                            enforceRequiredCurrencyFirst={true}
                        >
                            <Button size="sm" variant="outline" disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4" /> Add New Wallet</Button>
                        </CreateWalletDialog>
                    </CardContent>
                </Card>
            );
        }

        return <div className="hidden lg:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards}</div>;
    }


    return (
        <Card className="border-muted-foreground/15 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <CardTitle>Wallets</CardTitle>
                    <CardDescription>Multi-currency balances with instant actions.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {wallets.length} active
                    </Badge>
                    <CreateWalletDialog
                        onWalletCreated={onWalletCreated}
                        disabled={!isKycVerified}
                        existingWallets={wallets}
                        requiredCurrencyFirst={requiredCurrencyFirst ?? undefined}
                        enforceRequiredCurrencyFirst={true}
                    >
                        <Button size="sm" variant="outline" disabled={!isKycVerified}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add wallet
                        </Button>
                    </CreateWalletDialog>
                    <Button asChild size="sm" variant="ghost">
                        <Link href="/dashboard/wallets">View all</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasWallets && <EmptyState />}

                {hasWallets && (
                    <>
                        {/* Mobile Carousel */}
                        <div className="lg:hidden">
                            <Carousel setApi={setApi} className="w-full">
                                <CarouselContent>
                                    {renderCarouselContent()}
                                </CarouselContent>
                            </Carousel>
                            <div className="py-2 flex justify-center gap-2">
                                {Array.from({ length: count }).map((_, i) => (
                                    <Button key={i} variant="ghost" size="icon" className={cn("h-2 w-2 rounded-full p-0", i === current - 1 ? "bg-primary" : "bg-muted-foreground/50")} onClick={() => api?.scrollTo(i)} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop Grid */}
                        {renderDesktopGrid()}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
