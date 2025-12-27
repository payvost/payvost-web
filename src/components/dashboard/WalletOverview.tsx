
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
}

export function WalletOverview({ wallets, loading, isKycVerified, onWalletCreated }: WalletOverviewProps) {
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
        <div className="w-full">
            <Card className="border-2 border-dashed">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Start Your Global Journey</CardTitle>
                            <CardDescription className="text-sm">
                                Create your first currency wallet to send, receive, and manage money across borders instantly.
                            </CardDescription>
                        </div>
                        <div className="pt-2">
                            <CreateWalletDialog onWalletCreated={onWalletCreated} disabled={!isKycVerified} existingWallets={wallets}>
                                <Button size="default" disabled={!isKycVerified} className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Wallet
                                </Button>
                            </CreateWalletDialog>
                            {!isKycVerified && <p className="text-xs text-muted-foreground mt-2">Complete KYC verification to create a wallet</p>}
                        </div>
                        <div className="pt-1">
                            <p className="text-xs text-muted-foreground mb-1.5">Popular: </p>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {['USD', 'EUR', 'GBP', 'NGN'].map((currency) => (
                                    <Badge key={currency} variant="secondary" className="text-xs py-0.5 px-2">{currency}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (loading) {
        return <div className="text-center p-4">Loading wallets...</div>; // Ideally skeleton here
    }

    if (!hasWallets) {
        return <EmptyState />;
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
                        <CreateWalletDialog onWalletCreated={onWalletCreated} disabled={!isKycVerified} existingWallets={wallets}>
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
                        <CreateWalletDialog onWalletCreated={onWalletCreated} disabled={!isKycVerified} existingWallets={wallets}>
                            <Button size="sm" variant="outline" disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4" /> Add New Wallet</Button>
                        </CreateWalletDialog>
                    </CardContent>
                </Card>
            );
        }

        return <div className="hidden lg:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards}</div>;
    }


    return (
        <div>
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
        </div>
    );
}
