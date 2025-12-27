
'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { developerHighlights, developerCodeSample } from "@/data/landing-page";

export function DeveloperSection() {
    return (
        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-slate-950 text-slate-100">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:items-start">
                    <div className="flex-1 space-y-4 sm:space-y-6 text-center lg:text-left">
                        <Badge variant="outline" className="mx-auto lg:mx-0 w-fit border-white/20 bg-white/5 text-white/90 text-xs sm:text-sm px-3 py-1">
                            Developer-first infrastructure
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight">
                            Ship cross-border experiences with clean, modern APIs
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Build production-grade remittance flows, wallets, and compliance automations with Payvost SDKs, comprehensive documentation, and tooling that surfaces everything your engineers need.
                        </p>
                        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 text-left w-full h-auto">
                            <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-slate-400">
                                <span>TypeScript SDK</span>
                                <span className="hidden sm:inline">payments.ts</span>
                            </div>
                            <pre className="mt-3 sm:mt-4 overflow-x-auto text-xs sm:text-sm leading-relaxed text-slate-100 break-words whitespace-pre-wrap max-w-full">
                                <code>{developerCodeSample}</code>
                            </pre>
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                        {developerHighlights.map((highlight) => {
                            const Icon = highlight.icon;
                            return (
                                <div key={highlight.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 flex flex-col h-auto">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary flex-shrink-0">
                                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <h3 className="text-base sm:text-lg font-semibold text-white">
                                            {highlight.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        {highlight.description}
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
