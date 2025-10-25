'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, ArrowRight, BarChart, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';

export default function InvestmentLandingPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

    const featureCards = [
        {
            title: "Diverse Opportunities",
            description: "Explore a curated selection of investments across Real Estate, Bonds, Crypto, and more.",
            icon: <LineChart className="h-8 w-8 text-primary" />,
            href: "/dashboard/investment/browse"
        },
        {
            title: "Track Your Growth",
            description: "Monitor your complete portfolio, including savings and investments, all in one place.",
            icon: <BarChart className="h-8 w-8 text-primary" />,
            href: "/dashboard/investment/portfolio"
        },
        {
            title: "Smart & Secure",
            description: "Invest with confidence on a secure platform designed to protect your assets.",
            icon: <Shield className="h-8 w-8 text-primary" />,
            href: "#"
        }
    ];

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
             <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Invest with Payvost</h1>
                        <p className="text-muted-foreground text-sm">Grow your wealth with our curated investment opportunities.</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <Card className="h-full bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
                             <CardHeader>
                                <TrendingUp className="h-10 w-10 mb-4" />
                                <CardTitle className="text-3xl">Start Building Your Future</CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Whether you're a seasoned investor or just getting started, our platform makes it easy to put your money to work.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button size="lg" variant="secondary" asChild>
                                    <Link href="/dashboard/investment/browse">
                                        Explore Investment Opportunities <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        {featureCards.map(card => (
                             <Link href={card.href} key={card.title}>
                                <Card className="hover:bg-muted/50 transition-colors">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        {card.icon}
                                        <div>
                                            <h3 className="font-semibold">{card.title}</h3>
                                            <p className="text-xs text-muted-foreground">{card.description}</p>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </DashboardLayout>
    )
}
