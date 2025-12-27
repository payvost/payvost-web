
'use client';

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { popularCountries } from "@/data/landing-page";

export function CountriesSection() {
    return (
        <section id="countries" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="mx-auto flex flex-col items-center text-center space-y-3 sm:space-y-4 max-w-3xl">
                    <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em] text-xs sm:text-sm px-3 py-1">
                        Global corridors
                    </Badge>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight">Send money across the globe</h2>
                    <p className="text-sm sm:text-base text-muted-foreground md:text-lg leading-relaxed px-2">
                        We combine local settlement rails, mobile wallets, and cash pickup networks to move value into the markets your customers care about most.
                    </p>
                </div>

                <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {popularCountries.map((country) => (
                        <Card
                            key={country.name}
                            className="group h-full overflow-hidden border-border/30 bg-background/70 transition hover:border-primary/40"
                        >
                            <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
                                <div className="flex items-start justify-between gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-border/50 flex-shrink-0">
                                            <Image
                                                src={`/flag/${country.flag}`}
                                                alt={`${country.name} flag`}
                                                fill
                                                sizes="(max-width: 640px) 40px, 48px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base sm:text-lg font-semibold text-foreground truncate">{country.name}</p>
                                            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-muted-foreground">Popular route</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/20 text-xs whitespace-nowrap flex-shrink-0">
                                        {country.currency}
                                    </Badge>
                                </div>
                                <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-3 sm:p-4 text-left">
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {country.hint}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                    <span className="truncate">Instant wallet, bank transfer</span>
                                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition flex-shrink-0 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-8 sm:mt-10 flex flex-col gap-4 items-center text-center">
                    <div className="text-xs sm:text-sm text-muted-foreground px-4 leading-relaxed">
                        Coverage spans 180+ payout corridors across 70+ countries. More regions launch every quarter.
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                        <Button asChild variant="outline" size="lg" className="border-primary/60 text-primary hover:bg-primary/10 h-12 text-base">
                            <Link href="/support">Talk to corridor specialist</Link>
                        </Button>
                        <Button asChild size="lg" className="h-12 text-base">
                            <Link href="/fx-rates">View full corridor map</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
