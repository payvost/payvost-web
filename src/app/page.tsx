
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, Sparkles, ShieldCheck, Code2, BarChart3, Zap, Lock, Globe, Twitter, Facebook, Linkedin, MoreHorizontal, Star, ArrowUpRight, Wallet2, Layers, Users, FileCheck, Server, Clock, CheckCircle2, MessageCircle, PhoneCall } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { SiteHeader } from "@/components/site-header";
import { LiveRateChecker } from "@/components/live-rate-checker";
import Image from "next/image";
import placeholderImageData from '@/app/lib/placeholder-images.json';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';


const popularCountries = [
    { name: 'Nigeria', currency: 'Naira (NGN)', flag: 'NG.png', hint: 'Lagos skyline' },
    { name: 'United States', currency: 'Dollar (USD)', flag: 'US.png', hint: 'New York city' },
    { name: 'United Kingdom', currency: 'Pounds (GBP)', flag: 'GB.png', hint: 'London city' },
    { name: 'Ghana', currency: 'Cedi (GHS)', flag: 'GH.png', hint: 'Accra landscape' },
    { name: 'Kenya', currency: 'Shilling (KES)', flag: 'KE.png', hint: 'Nairobi park' },
    { name: 'Canada', currency: 'Dollar (CAD)', flag: 'CA.png', hint: 'Toronto city' },
    { name: 'Australia', currency: 'Dollar (AUD)', flag: 'AU.png', hint: 'Sydney opera' },
  { name: 'Germany', currency: 'Euro (EUR)', flag: 'GE.png', hint: 'Berlin city' },
  { name: 'South Africa', currency: 'Rand (ZAR)', flag: 'SA.png', hint: 'Cape Town' },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CEO",
    company: "Innovate Inc.",
    image: { src: "https://picsum.photos/seed/t1/100/100", hint: "woman portrait" },
    rating: 5,
    quote: "Payvost is a game-changer. The speed and low fees are unmatched. Highly recommended for anyone sending money abroad.",
  },
  {
    name: "Michael Chen",
    role: "Freelancer",
    company: "Chen Designs",
    image: { src: "https://picsum.photos/seed/t2/100/100", hint: "man smiling" },
    rating: 5,
    quote: "As a freelancer working with international clients, Payvost has simplified my life. Getting paid is now fast and hassle-free.",
  },
  {
    name: "David Rodriguez",
    role: "CTO",
    company: "Tech Solutions",
    image: { src: "https://picsum.photos/seed/t3/100/100", hint: "person portrait" },
    rating: 4,
    quote: "The API is well-documented and easy to integrate. We were able to get up and running in just a couple of days. Solid platform.",
  },
  {
    name: "Emily White",
    role: "E-commerce Owner",
    company: "The Shop",
    image: { src: "https://picsum.photos/seed/t4/100/100", hint: "woman in cafe" },
    rating: 5,
    quote: "I love the multi-currency wallet feature. It makes managing payments from different countries so much easier.",
  },
];

const heroMetrics = [
  { value: "120K+", label: "Verified customers", helper: "Serving scale-ups, platforms, and global payroll teams" },
  { value: "$5.2B", label: "Processed volume", helper: "Settled across 12 clearing partners in the past 12 months" },
  { value: "180+", label: "Payout corridors", helper: "Real-time payments, mobile wallets, and cash pickup coverage" },
];

const heroStacks = [
  "Node.js SDK",
  "Python SDK",
  "React Native Kit",
  "Webhook Sandbox",
  "GraphQL (beta)",
];

const heroFeatureTiles = [
  {
    icon: Code2,
    title: "SDKs & client libraries",
    description: "Ship global payouts with maintained packages for TypeScript, Python, and mobile stacks.",
  },
  {
    icon: ShieldCheck,
    title: "Regulated everywhere",
    description: "Licensed MSB coverage, bank-grade compliance, and layered fraud controls ready out of the box.",
  },
  {
    icon: BarChart3,
    title: "Treasury analytics",
    description: "Monitor FX spreads, settlement windows, and liquidity in real-time dashboards.",
  },
];

const heroPartnerLogos = [
  { name: "Google", src: "/Partners/Google_2015_logo.svg.png", priority: true },
  { name: "Visa", src: "/Partners/Visa_Inc._logo.svg.png" },
  { name: "Mastercard", src: "/Partners/Mastercard-logo.png" },
];

const platformPillars = [
  {
    title: "Unified treasury workspace",
    description: "Monitor liquidity, automate reconciliations, and manage counterparties from a single control plane.",
    icon: Wallet2,
    bullets: [
      "Real-time balances across nostro, mobile wallet, and card endpoints",
      "Configurable approval chains for treasury and compliance teams",
      "Dynamic markups with smart FX hedging windows",
    ],
  },
  {
    title: "Programmable payouts & FX",
    description: "Price, split, and settle money movement with flexible routing rules and smart retries.",
    icon: Layers,
    bullets: [
      "Route via local settlement rails or instant wallets automatically",
      "Guarantee idempotent payouts with contextual error handling",
      "Expose customer-ready rate quotes in less than 200 ms",
    ],
  },
  {
    title: "Customer lifecycle automation",
    description: "Onboard, verify, and retain global users with guided KYC and proactive communications.",
    icon: Users,
    bullets: [
      "KYC/KYB orchestration with rules per corridor",
      "Risk scoring blended with machine learning fraud signals",
      "Lifecycle messaging and webhook triggers for every status change",
    ],
  },
];

const workflowStages = [
  {
    step: "01",
    title: "Collect & verify",
    description: "Capture applications, run KYC/KYB, and issue digital wallets in minutes.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Quote & commit",
    description: "Generate guaranteed FX quotes, set expiries, and lock liquidity atomically.",
    icon: Server,
  },
  {
    step: "03",
    title: "Disburse & track",
    description: "Execute payouts through Payvost’s global network with smart retries and instant notifications.",
    icon: Clock,
  },
  {
    step: "04",
    title: "Reconcile & report",
    description: "Stream ledger updates, automate reconciliations, and surface finance-ready reports.",
    icon: BarChart3,
  },
];

const developerHighlights = [
  {
    title: "SDKs & client libraries",
    description: "TypeScript, Python, and mobile SDKs stay in lockstep with the API and include baked-in auth flows.",
    icon: Code2,
  },
  {
    title: "Webhook observability",
    description: "Replay payloads, inspect headers, and confirm deliveries from a dedicated developer console.",
    icon: Server,
  },
  {
    title: "Sandbox parity",
    description: "Test against the same FX engine, risk rules, and ledger primitives that run in production.",
    icon: Layers,
  },
];

const faqs = [
  {
    value: "pricing",
    question: "How much does Payvost charge per transfer?",
    answer:
      "Fees vary by corridor and payment rail. We provide transparent pricing per quote and offer volume discounts for enterprise partners. Contact sales for custom pricing.",
  },
  {
    value: "settlement",
    question: "How long does settlement take?",
    answer:
      "Settlement time depends on the payout method and corridor. Many instant wallet routes are immediate; local bank payouts typically settle within 1-3 business days. We provide status events for every transfer.",
  },
  {
    value: "kyc",
    question: "What KYC/KYB do you require?",
    answer:
      "We support both individual and business KYC/KYB flows. Requirements depend on customer type and corridor. Our onboarding guides show exact document requirements for each country.",
  },
  {
    value: "integration",
    question: "How can I integrate Payvost into my platform?",
    answer:
      "Use our SDKs (TypeScript, Python, mobile) or hit the REST/GraphQL APIs. Sandbox accounts, developer docs, and SDK samples are available to speed up integration.",
  },
];

const developerCodeSample = `import { Payvost } from \'@payvost/sdk\';

const client = new Payvost({
  apiKey: process.env.PAYVOST_API_KEY!,
  environment: 'sandbox',
});

const quote = await client.fx.createQuote({
  sourceCurrency: 'USD',
  targetCurrency: 'NGN',
  amount: '5000',
  customerReference: 'INV-59210',
  expiresInSeconds: 120,
});

await client.payouts.create({
  quoteId: quote.id,
  beneficiaryId: 'bene_48f0a9',
  idempotencyKey: crypto.randomUUID(),
});

console.log('Transfer committed:', quote.lockedRate);`;


export default function LandingPage() {
  const { blog: blogImages } = placeholderImageData;
  const [showLiveRate, setShowLiveRate] = useState(false);
  const rateCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showLiveRate && rateCardRef.current) {
      rateCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showLiveRate]);

  const handleRevealLiveRate = () => {
    if (!showLiveRate) {
      setShowLiveRate(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
    {/* Hero Section */}
    <section className="relative overflow-hidden -mt-6 md:-mt-8 lg:-mt-10">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-18rem] right-[-14rem] h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute bottom-[-16rem] left-[-12rem] h-[24rem] w-[24rem] rounded-full bg-secondary/25 blur-3xl" />
            <div className="absolute inset-x-0 top-10 h-32 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          </div>
          <div className="container mx-auto max-w-screen-xl px-4 md:px-6 pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
              <div className="relative z-10 flex flex-col justify-center space-y-8 text-center lg:text-left">
                <Badge variant="outline" className="mx-auto lg:mx-0 w-fit border-primary/40 bg-primary/10 text-primary">
                  Borderless payments, orchestrated
                </Badge>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                    Move money in minutes with enterprise-grade FX infrastructure
                  </h1>
                  <p className="max-w-2xl text-muted-foreground md:text-lg lg:text-xl">
                    Payvost fuses global banking partners, instant wallet payouts, and developer-first tooling so your teams can onboard customers, price FX, and settle funds without friction.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  {!showLiveRate ? (
                    <Button size="lg" className="px-8" onClick={handleRevealLiveRate}>
                      Get Live Rate
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="px-8">
                      <Link href="/register">{"> Send Money"}</Link>
                    </Button>
                  )}
                  <Button asChild size="lg" variant="outline" className="px-8">
                    <Link href="/track-transfer">Track a Transfer</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Built for treasury, fintech, and payroll teams shipping cross-border flows.</span>
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-6">
                  {heroStacks.map((stack) => (
                    <Badge
                      key={stack}
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {stack}
                    </Badge>
                  ))}
                </div>
                <div className="grid gap-4 pt-8 sm:grid-cols-3">
                  {heroMetrics.map((metric) => (
                    <Card key={metric.label} className="border-border/40 bg-background/70 backdrop-blur-md shadow-[0_20px_70px_-35px_rgba(11,81,255,0.7)]">
                      <CardContent className="px-6 py-5">
                        <p className="text-2xl font-semibold text-foreground sm:text-3xl">{metric.value}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground/90">
                          {metric.label}
                        </p>
                        {metric.helper ? (
                          <p className="mt-2 text-xs text-muted-foreground/80">
                            {metric.helper}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex flex-col gap-5 pt-10" id="partners">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground/80">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Our partners</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                    {heroPartnerLogos.map((logo) => (
                      <div key={logo.name} className="relative h-10 w-28 sm:h-12 sm:w-32 opacity-80 transition hover:opacity-100">
                        <Image
                          src={logo.src}
                          alt={logo.name}
                          fill
                          sizes="128px"
                          className="object-contain"
                          priority={logo.priority}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-center lg:justify-end">
                <div className="absolute -top-24 left-14 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
                <div ref={rateCardRef} className="relative w-full max-w-xl">
                  {showLiveRate ? (
                    <div className="animate-in fade-in-50 slide-in-from-right-6 duration-500">
                      <LiveRateChecker autoFetch sendMoneyHref="/register" />
                    </div>
                  ) : (
                    <Card className="border-border/40 bg-background/85 backdrop-blur-2xl shadow-[0_32px_120px_-60px_rgba(0,0,0,0.65)]">
                      <CardContent className="space-y-6 p-8">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-primary/80">
                              Live FX sandbox
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              Activate live rates to reveal market depth and real spreads
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-4">
                          {heroFeatureTiles.map((feature) => {
                            const Icon = feature.icon;
                            return (
                              <li key={feature.title} className="flex items-start gap-3">
                                <Icon className="mt-1 h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
                          {heroMetrics.slice(0, 2).map((metric) => (
                            <div key={`preview-${metric.label}`} className="rounded-xl border border-border/40 bg-muted/30 p-4">
                              <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Overview Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <Badge variant="outline" className="mx-auto w-fit border-primary/40 bg-primary/10 text-primary">
                Built for treasury, fintech & platforms
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                An operating system for cross-border money movement
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Payvost brings global banking partners, programmatic FX, and compliance automation under one roof so you can launch new corridors, products, and revenue lines faster than ever.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {platformPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <Card
                    key={pillar.title}
                    className="relative h-full border-border/40 bg-background/80 backdrop-blur-md shadow-[0_20px_70px_-45px_rgba(10,70,95,0.35)]"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {pillar.title}
                        </CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pillar.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-3">
                        {pillar.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="space-y-6 max-w-2xl">
                <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary">
                  Enterprise-grade orchestration
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  How Payvost orchestrates every transfer
                </h2>
                <p className="text-muted-foreground md:text-lg">
                  From sign-up to settlement, Payvost provides automated workflows, visibility, and controls at every stage of the transfer lifecycle. Launch new corridors without rebuilding core infrastructure each time.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/register">
                      Launch a demo workspace
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/support">
                      Talk to a payments expert
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {workflowStages.map((stage) => {
                  const Icon = stage.icon;
                  return (
                    <div
                      key={stage.title}
                      className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 p-6 shadow-[0_18px_60px_-48px_rgba(15,46,85,0.65)] transition hover:border-primary hover:shadow-[0_20px_70px_-40px_rgba(15,46,85,0.45)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                          {stage.step}
                        </span>
                      </div>
                      <h3 className="mt-6 text-lg font-semibold text-foreground">
                        {stage.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {stage.description}
                      </p>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Developer Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-950 text-slate-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="space-y-6">
                <Badge variant="outline" className="w-fit border-white/20 bg-white/5 text-white/90">
                  Developer-first infrastructure
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  Ship cross-border experiences with clean, modern APIs
                </h2>
                <p className="text-slate-300 md:text-lg">
                  Build production-grade remittance flows, wallets, and compliance automations with Payvost SDKs, comprehensive documentation, and tooling that surfaces everything your engineers need.
                </p>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_90px_-50px_rgba(0,0,0,0.75)]">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    <span>TypeScript SDK</span>
                    <span>payments.ts</span>
                  </div>
                  <pre className="mt-4 overflow-x-auto text-sm leading-relaxed text-slate-100">
                    <code>{developerCodeSample}</code>
                  </pre>
                </div>
              </div>
              <div className="grid gap-4">
                {developerHighlights.map((highlight) => {
                  const Icon = highlight.icon;
                  return (
                    <div key={highlight.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-white">
                            {highlight.title}
                          </h3>
                          <p className="text-sm text-slate-300">
                            {highlight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section id="countries" className="relative w-full py-16 md:py-28 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto flex flex-col items-center text-center space-y-4 max-w-3xl">
              <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.4em]">
                Global corridors
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Send money across the globe</h2>
              <p className="text-muted-foreground md:text-lg">
                We combine local settlement rails, mobile wallets, and cash pickup networks to move value into the markets your customers care about most.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {popularCountries.map((country) => (
                <Card
                  key={country.name}
                  className="group h-full overflow-hidden border-border/30 bg-background/70 backdrop-blur-md shadow-[0_20px_70px_-45px_rgba(10,70,95,0.35)] transition hover:border-primary/40 hover:shadow-[0_30px_90px_-40px_rgba(10,70,95,0.45)]"
                >
                  <CardContent className="p-6 flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border/50">
                          <Image
                            src={`/flag/${country.flag}`}
                            alt={`${country.name} flag`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{country.name}</p>
                          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Popular route</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/20">
                        {country.currency}
                      </Badge>
                    </div>
                    <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4 text-left">
                      <p className="text-sm text-muted-foreground">
                        {country.hint}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Instant wallet, bank transfer</span>
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Coverage spans 180+ payout corridors across 70+ countries. More regions launch every quarter.
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="lg" className="border-primary/60 text-primary hover:bg-primary/10">
                  <Link href="/support">Talk to corridor specialist</Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/fx-rates">View full corridor map</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="relative w-full py-16 md:py-28 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.35em]">
                Customer stories
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">What our customers say</h2>
              <p className="max-w-3xl text-muted-foreground md:text-lg">
                Payvost powers remittance, payroll, and treasury teams around the world. Hear how builders ship faster and move capital with confidence.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[0.55fr_0.45fr] xl:grid-cols-[0.5fr_0.5fr] items-center">
              <div className="relative">
                <div className="absolute -top-8 -left-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
                <div className="absolute -bottom-10 -right-4 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
                <Card className="relative rounded-3xl border-border/40 bg-background/80 backdrop-blur-md shadow-[0_24px_90px_-45px_rgba(10,70,95,0.45)]">
                  <CardContent className="space-y-6 p-10">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
                        Featured customer
                      </span>
                    </div>
                    <blockquote className="text-2xl font-semibold leading-relaxed text-foreground">
                      “Payvost let us launch local payouts in three new markets in under a quarter. Our finance team finally has real-time visibility across every transfer.”
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={testimonials[0].image.src} alt={testimonials[0].name} />
                        <AvatarFallback>{testimonials[0].name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold text-foreground">{testimonials[0].name}</p>
                        <p className="text-sm text-muted-foreground">{testimonials[0].role}, {testimonials[0].company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl border border-border/30 bg-background/80 backdrop-blur-md p-6 shadow-[0_20px_80px_-40px_rgba(10,70,95,0.45)]">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-3">
                      {testimonials.slice(1).map((testimonial, index) => (
                        <CarouselItem key={testimonial.name} className="pl-3 sm:basis-1 lg:basis-1/2">
                          <div className="h-full rounded-2xl border border-border/30 bg-muted/40 p-6 transition duration-300 hover:border-primary/40 hover:bg-muted/60">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={testimonial.image.src} alt={testimonial.name} />
                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                                <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                              </div>
                            </div>
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                              “{testimonial.quote}”
                            </p>
                            <div className="mt-4 flex items-center gap-1 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < testimonial.rating ? 'fill-current' : 'text-muted-foreground/40'}`} />
                              ))}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4 hidden sm:flex" />
                    <CarouselNext className="-right-4 hidden sm:flex" />
                  </Carousel>
                  <div className="mt-6 grid gap-2 text-left text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Customer satisfaction rating: 4.9 / 5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Net promoter score above 70</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Dedicated success managers for enterprise accounts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section id="faq" className="relative w-full py-16 md:py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] items-start">
              <div className="space-y-8">
                <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.4em]">
                  Support center
                </Badge>
                <div className="space-y-3 max-w-xl">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Frequently asked questions</h2>
                  <p className="text-muted-foreground md:text-lg">
                    Answers to the questions founders, finance teams, and developers ask before they launch with Payvost.
                  </p>
                </div>
                <div className="grid gap-4">
                  <Card className="border border-primary/30 bg-background/80 backdrop-blur-md shadow-[0_24px_80px_-50px_rgba(10,70,95,0.45)]">
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-foreground">Chat with our specialists</h3>
                          <p className="text-sm text-muted-foreground">
                            Live customer engineers are available 24/7 for launch-critical questions and integration guidance.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button asChild size="sm">
                            <Link href="/support">Start live chat</Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="border-primary/40 text-primary">
                            <Link href="/docs">Browse docs</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="border border-border/40 bg-background/70 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Avg. response time</p>
                          <p className="text-xs text-muted-foreground">Under 8 minutes during business hours</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border border-border/40 bg-background/70 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Dedicated onboarding</p>
                          <p className="text-xs text-muted-foreground">Enterprise teams receive a success manager from day one</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
              <Card className="border border-border/40 bg-background/90 backdrop-blur-md shadow-[0_24px_90px_-50px_rgba(15,46,85,0.45)]">
                <CardContent className="p-4 sm:p-6">
                  <Accordion type="single" collapsible className="grid gap-4">
                    {faqs.map((faq) => (
                      <AccordionItem
                        key={faq.value}
                        value={faq.value}
                        className="overflow-hidden rounded-2xl border border-border/40 bg-background/70 transition-all data-[state=open]:border-primary/50 data-[state=open]:bg-primary/5"
                      >
                        <AccordionTrigger className="px-5 py-4 text-left text-base font-semibold leading-snug text-foreground hover:text-primary data-[state=open]:text-primary">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
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
        {/* Blog Section */}
        <section id="blog" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">From the Blog</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Stay updated with the latest news and insights from the world of finance.
              </p>
            </div>
            <div className="mx-auto grid max-w-7xl items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <Link href="/blog/payvost-partners-with-google" className="group">
                <Card className="flex flex-col h-full overflow-hidden transition-all group-hover:border-primary/50 group-hover:shadow-lg">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={blogImages.payvost_google_partnership.src}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        data-ai-hint={blogImages.payvost_google_partnership.hint}
                        alt="Payvost partners with Google"
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl md:text-2xl group-hover:text-primary">Payvost Partners with Google’s Anti-Money Laundering AI for Risk and Fraud Management</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground">
                        A brief summary of the blog post goes here. Catch the reader's interest and give them a reason to click and read more about this exciting topic.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="link" className="p-0 -ml-1 group-hover:underline">Read More <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                  </Card>
              </Link>
                 <Card className="flex flex-col h-full">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={blogImages.ai_remittance.src}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      data-ai-hint={blogImages.ai_remittance.hint}
                      alt="AI in Remittance"
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">The Future of Remittances: How AI is Changing the Game</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">
                      Discover the revolutionary impact of artificial intelligence on cross-border payments.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="p-0">Read More <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </CardFooter>
                </Card>
                 <Card className="flex flex-col h-full">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={blogImages.secure_transfers.src}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      data-ai-hint={blogImages.secure_transfers.hint}
                      alt="Secure Transfers"
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">5 Tips for Secure International Money Transfers</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">
                      Protect your money and personal information with these essential security tips.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="p-0">Read More <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </CardFooter>
                </Card>
            </div>
             <div className="flex justify-center mt-12">
                <Button asChild size="lg">
                    <Link href="/blog">View All Posts <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </div>
          </div>
        </section>

        {/* App Download CTA */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative bg-[#002f70] text-primary-foreground rounded-[15px] p-8 md:p-12 overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="text-center lg:text-left z-10">
                      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Download the mobile app</h2>
                      <p className="mt-4 max-w-xl text-lg text-primary-foreground/80 mx-auto lg:mx-0">
                          Send money locally, pay bills globally, receive money, save, pay bills and do more with the Payvost app.
                      </p>
                      <div className="mt-8 flex justify-center lg:justify-start gap-4">
                          <Link href="#">
                              <Image src="/App Store.png" alt="Download on the App Store" width={180} height={54} />
                          </Link>
                           <Link href="#">
                              <Image src="/Google Play (2).png" alt="Get it on Google Play" width={180} height={54} />
                          </Link>
                      </div>
                  </div>
                  <div className="absolute -right-24 -bottom-24 opacity-20 lg:opacity-100 lg:static flex justify-center items-end">
                    <Image
                      src="/Payvost mockup.png"
                      alt="Payvost App Dashboard"
                      width={400}
                      height={300}
                      data-ai-hint="app dashboard"
                      className="rounded-lg shadow-2xl"
                    />
                  </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted text-muted-foreground py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-[30%] space-y-4">
              <Link href="#" className="flex items-center space-x-2">
                <Icons.logo className="h-8" />
              </Link>
              <p className="text-sm">Stay up to date with the latest news, announcements, and articles.</p>
              <form className="flex w-full max-w-sm space-x-2">
                <Input type="email" placeholder="Enter your email" />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
            <div className="w-full md:w-[70%] grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Product</h4>
                <ul className="space-y-2">
                    <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
                </ul>
                </div>
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Company</h4>
                <ul className="space-y-2">
                    <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                    <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                    <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                </ul>
                </div>
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Resources</h4>
                <ul className="space-y-2">
                    <li><Link href="#blog" className="hover:text-primary transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                    <li><Link href="/fx-rates" className="hover:text-primary transition-colors">Live FX Rates</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Developers</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
                </ul>
                </div>
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Policies</h4>
                <ul className="space-y-2">
                    <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
                </ul>
                </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-muted-foreground/20 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-center sm:text-left">
                <p>&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
            </div>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link href="https://x.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="https://facebook.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
