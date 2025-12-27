
'use client';

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workflowStages } from "@/data/landing-page";

export function WorkflowSection() {
    return (
        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="grid gap-8 sm:gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                        <Badge variant="outline" className="mx-auto lg:mx-0 w-fit border-primary/40 bg-primary/10 text-primary text-xs sm:text-sm px-3 py-1">
                            Enterprise-grade orchestration
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight">
                            How Payvost orchestrates every transfer
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground md:text-lg leading-relaxed">
                            From sign-up to settlement, Payvost provides automated workflows, visibility, and controls at every stage of the transfer lifecycle. Launch new corridors without rebuilding core infrastructure each time.
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 lg:justify-start pt-2">
                            <Button asChild size="lg" className="h-12 text-base">
                                <Link href="/register">
                                    Launch a demo workspace
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-12 text-base">
                                <Link href="/support">
                                    Talk to a payments expert
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                        {workflowStages.map((stage) => {
                            const Icon = stage.icon;
                            return (
                                <div
                                    key={stage.title}
                                    className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 p-5 sm:p-6 transition hover:border-primary"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground">
                                            {stage.step}
                                        </span>
                                    </div>
                                    <h3 className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-foreground">
                                        {stage.title}
                                    </h3>
                                    <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-muted-foreground">
                                        {stage.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
