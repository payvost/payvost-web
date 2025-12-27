
'use client';

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import { heroPartnerLogos } from "@/data/landing-page";

const LiveRateChecker = dynamic(() => import('@/components/live-rate-checker').then(mod => ({ default: mod.LiveRateChecker })), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />,
});

interface HeroSectionProps {
    onScrollToRate: () => void;
    rateCardRef: React.RefObject<HTMLDivElement>;
}

export function HeroSection({ onScrollToRate, rateCardRef }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden -mt-12 md:-mt-8 lg:-mt-10 pt-6 sm:pt-8">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6 pt-8 pb-12 sm:pt-12 sm:pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
                {/* Internal top padding for mobile */}
                <div className="block sm:hidden h-10" />
                <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                    <div className="relative z-10 flex flex-col justify-center space-y-5 sm:space-y-8 text-center lg:text-left">
                        <Badge variant="outline" className="mx-auto lg:mx-0 w-fit border-primary/40 bg-primary/10 text-primary text-xs sm:text-sm px-3 py-1">
                            Borderless payments, orchestrated
                        </Badge>
                        <div className="space-y-3 sm:space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl xl:text-6xl leading-tight">
                                Move money in minutes with enterprise-grade FX infrastructure
                            </h1>
                            <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-muted-foreground md:text-lg lg:text-xl leading-relaxed">
                                Payvost fuses global banking partners, instant wallet payouts, and developer-first tooling so your teams can onboard customers, price FX, and settle funds without friction.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                            <Button size="lg" className="px-6 sm:px-8 h-12 text-base" onClick={onScrollToRate}>
                                Get Live Rate
                            </Button>
                            <Button asChild size="lg" variant="outline" className="px-6 sm:px-8 h-12 text-base">
                                <Link href="/track-transfer">Track a Transfer</Link>
                            </Button>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-muted-foreground px-2">
                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="leading-relaxed">Built for treasury, fintech, and payroll teams shipping cross-border flows.</span>
                        </div>
                        <div className="flex flex-col gap-4 sm:gap-5 pt-6 sm:pt-10" id="partners">
                            <div className="flex items-center justify-center lg:justify-start gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-muted-foreground/80">
                                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Our partners</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6">
                                {heroPartnerLogos.map((logo) => (
                                    <div key={logo.name} className="relative h-8 w-20 sm:h-9 sm:w-24 md:h-12 md:w-32 opacity-80 transition hover:opacity-100">
                                        <Image
                                            src={logo.src}
                                            alt={logo.name}
                                            fill
                                            sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 128px"
                                            className="object-contain"
                                            priority={logo.priority}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="relative flex items-center justify-center order-2 mt-6 sm:mt-8 lg:order-none lg:justify-end lg:mt-0">
                        <div ref={rateCardRef} className="relative w-full max-w-xl mx-auto lg:mx-0">
                            <div className="animate-in fade-in-50 slide-in-from-right-6 duration-500">
                                <LiveRateChecker autoFetch sendMoneyHref="/register" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
