
'use client';

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MessageCircle, CheckCircle2, PhoneCall } from "lucide-react";
import { faqs } from "@/data/landing-page";

export function FAQSection() {
    return (
        <section id="faq" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="grid gap-8 sm:gap-12 lg:grid-cols-[0.9fr_1.1fr] items-start">
                    <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                        <Badge variant="outline" className="mx-auto lg:mx-0 w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em] text-xs sm:text-sm px-3 py-1">
                            Support center
                        </Badge>
                        <div className="space-y-2 sm:space-y-3 max-w-xl mx-auto lg:mx-0">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight">Frequently asked questions</h2>
                            <p className="text-sm sm:text-base text-muted-foreground md:text-lg leading-relaxed">
                                Answers to the questions founders, finance teams, and developers ask before they launch with Payvost.
                            </p>
                        </div>
                        <div className="grid gap-4">
                            <Card className="border border-primary/30 bg-background/80">
                                <CardContent className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-start">
                                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary mx-auto sm:mx-0 flex-shrink-0">
                                        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="space-y-3 text-center sm:text-left">
                                        <div className="space-y-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-foreground">Chat with our specialists</h3>
                                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                Live customer engineers are available 24/7 for launch-critical questions and integration guidance.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                                            <Button asChild size="sm" className="h-10 text-sm">
                                                <Link href="/support">Start live chat</Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm" className="border-primary/40 text-primary h-10 text-sm">
                                                <Link href="/docs">Browse docs</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <Card className="border-2 border-border bg-background/70 p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="text-xs sm:text-sm font-semibold text-foreground">Avg. response time</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">Under 8 minutes during business hours</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="border-2 border-border bg-background/70 p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                                            <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="text-xs sm:text-sm font-semibold text-foreground">Dedicated onboarding</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">Enterprise teams receive a success manager from day one</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                    <Card className="border border-border/40 bg-background/90">
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            <Accordion type="single" collapsible className="grid gap-3 sm:gap-4">
                                {faqs.map((faq) => (
                                    <AccordionItem
                                        key={faq.value}
                                        value={faq.value}
                                        className="overflow-hidden rounded-2xl border border-border/40 bg-background/70 transition-all data-[state=open]:border-primary/50 data-[state=open]:bg-primary/5"
                                    >
                                        <AccordionTrigger className="px-4 sm:px-5 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold leading-snug text-foreground hover:text-primary data-[state=open]:text-primary">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
