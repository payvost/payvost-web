'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { ArrowRight, Sparkles, ShieldCheck, Code2, BarChart3, Zap, Lock, Globe, Twitter, Facebook, Linkedin, MoreHorizontal, Star, ArrowUpRight, FileCheck, Server, Clock, CheckCircle2, MessageCircle, PhoneCall, QrCode, Layers } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
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

const heroPartnerLogos = [
  { name: "Google", src: "/Partners/Google_2015_logo.svg.png", priority: true },
  { name: "Visa", src: "/Partners/Visa_Inc._logo.svg.png" },
  { name: "Mastercard", src: "/Partners/Mastercard-logo.png" },
  { name: "Microsoft", src: "/Partners/Microsoft_logo_(2012).svg.png" },
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
  {
    title: "Comprehensive docs",
    description: "Get started quickly with step-by-step guides, API references, and code samples for every integration.",
    icon: FileCheck,
  },
];

const faqs = [
  {
    value: "pricing",
    question: "How much does Payvost charge per transfer?",
    answer:
      "Fees vary by corridor and payment rail. We display fees and FX spreads per quote and offer volume discounts for enterprise partners.",
  },
  {
    value: "settlement",
    question: "How long does settlement take?",
    answer:
      "Instant for many wallet routes; local bank payouts usually settle in 1–3 business days. Every state change emits a webhook/event.",
  },
  {
    value: "kyc",
    question: "What KYC/KYB do you require?",
    answer:
      "Document + biometric checks for individuals; corporate docs, UBO, and sanction screening for businesses. Requirements vary by corridor.",
  },
  {
    value: "integration",
    question: "How can I integrate Payvost into my platform?",
    answer:
      "Use our TypeScript, Python, or mobile SDKs, or call the REST/GraphQL APIs directly. Sandbox mirrors production risk and ledger logic.",
  },
  {
    value: "limits",
    question: "What are the sending limits?",
    answer:
      "Default daily and monthly limits apply post-KYC. Higher programmatic limits can be requested based on volume, risk profile, and jurisdiction.",
  },
  {
    value: "currencies",
    question: "Which currencies do you support?",
    answer:
      "70+ payout currencies across bank, wallet, and cash pickup routes. A live matrix and corridor map is available in the dashboard.",
  },
  {
    value: "security",
    question: "How do you keep funds and data secure?",
    answer:
      "Encryption in transit/at rest, segregated client balances, real-time fraud heuristics, and continuous monitoring with audit trails.",
  },
  {
    value: "support",
    question: "Do you offer 24/7 support?",
    answer:
      "Yes. Live chat and critical incident escalation are available 24/7; dedicated success managers for qualified enterprise accounts.",
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
  const rateCardRef = useRef<HTMLDivElement | null>(null);
  // Testimonials carousel state
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const handleScrollToLiveRate = () => {
    if (rateCardRef.current) {
      rateCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (!carouselApi) return;
    setSnapCount(carouselApi.scrollSnapList().length);
    setSelectedIndex(carouselApi.selectedScrollSnap());

    const onSelect = () => setSelectedIndex(carouselApi.selectedScrollSnap());
    const onReInit = () => {
      setSnapCount(carouselApi.scrollSnapList().length);
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onReInit);
    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('reInit', onReInit);
    };
  }, [carouselApi]);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
    {/* Hero Section */}
  <section className="relative overflow-hidden -mt-12 md:-mt-8 lg:-mt-10 pt-6 sm:pt-8">
          <div className="container mx-auto max-w-screen-xl px-4 md:px-6 pt-8 pb-12 sm:pt-12 sm:pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
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
                  <Button size="lg" className="px-6 sm:px-8 h-12 text-base" onClick={handleScrollToLiveRate}>
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
                <div className="hidden md:block">
                  <div className="absolute -top-10 left-14 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
                  <div className="absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
                </div>
                <div ref={rateCardRef} className="relative w-full max-w-xl mx-auto lg:mx-0">
                  <div className="animate-in fade-in-50 slide-in-from-right-6 duration-500">
                    <LiveRateChecker autoFetch sendMoneyHref="/register" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Workflow Section */}
        <section className="w-full py-10 sm:py-12 md:py-24 lg:py-32 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 md:px-6">
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
                      className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 p-5 sm:p-6 shadow-[0_18px_60px_-48px_rgba(15,46,85,0.65)] transition hover:border-primary hover:shadow-[0_20px_70px_-40px_rgba(15,46,85,0.45)]"
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
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Developer Section */}
        <section className="w-full py-10 sm:py-12 md:py-24 lg:py-32 bg-slate-950 text-slate-100">
          <div className="container mx-auto px-2 sm:px-4 md:px-6">
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
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-[0_24px_90px_-50px_rgba(0,0,0,0.75)] text-left w-full h-auto">
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

        {/* Countries Section */}
        <section id="countries" className="relative w-full py-12 sm:py-16 md:py-28 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6">
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
                  className="group h-full overflow-hidden border-border/30 bg-background/70 backdrop-blur-md shadow-[0_20px_70px_-45px_rgba(10,70,95,0.35)] transition hover:border-primary/40 hover:shadow-[0_30px_90px_-40px_rgba(10,70,95,0.45)]"
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
        
        {/* Testimonials Section */}
  <section id="testimonials" className="relative w-full py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background" />
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
        <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[10px] sm:text-xs">
          Customer stories
        </Badge>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          What our customers say
        </h2>
        <p className="max-w-3xl text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
          Payvost powers remittance, payroll, and treasury teams around the world. Hear how builders ship faster and move capital with confidence.
        </p>
      </div>

      <div className="mt-10 sm:mt-12 grid gap-6 grid-cols-1 lg:grid-cols-2 items-stretch">
        {/* Featured Testimonial Card */}
        <div className="relative w-full max-w-full mx-auto lg:mx-0 flex flex-col">
          {/* Decorative background only on large screens */}
          <div className="hidden md:block">
            <div className="absolute -top-8 -left-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
            <div className="absolute -bottom-10 -right-4 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          </div>
          <Card className="relative w-full rounded-3xl border-border/40 bg-background/90 backdrop-blur-md shadow-[0_24px_90px_-45px_rgba(10,70,95,0.45)]">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left justify-center sm:justify-start">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.32em] sm:tracking-[0.4em] text-primary/80">
                  Featured customer
                </span>
              </div>
              <blockquote className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed text-foreground">
                “Payvost let us launch local payouts in three new markets in under a quarter. Our finance team finally has real-time visibility across every transfer.”
              </blockquote>
              <div className="flex flex-col xs:flex-row xs:items-center gap-4 xs:gap-5 text-center xs:text-left w-full">
                <Avatar className="mx-auto xs:mx-0 h-16 w-16 flex-shrink-0" >
                  <AvatarImage src={testimonials[0].image.src} alt={testimonials[0].name} />
                  <AvatarFallback>{testimonials[0].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center xs:items-start gap-1">
                  <p className="text-base sm:text-lg font-semibold text-foreground break-words">{testimonials[0].name}</p>
                  <p className="text-sm text-muted-foreground break-words">{testimonials[0].role}, {testimonials[0].company}</p>
                </div>
              </div>
              <div className="flex justify-center xs:justify-start items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carousel Testimonials */}
        <div className="relative w-full max-w-full mx-0 lg:mx-0 flex flex-col">
          <div className="relative w-full rounded-3xl border border-border/30 bg-background/85 backdrop-blur-md p-4 sm:p-6 md:p-8 shadow-[0_20px_80px_-40px_rgba(10,70,95,0.45)]">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
              setApi={setCarouselApi}
            >
              <CarouselContent className="ml-0 sm:-ml-3">
                {testimonials.slice(1).map((testimonial, index) => (
                  <CarouselItem key={testimonial.name} className="pl-1.5 sm:pl-3 basis-full lg:basis-1/2">
                    <div className="flex flex-col rounded-2xl border border-border/30 bg-muted/40 p-4 sm:p-6 transition duration-300 hover:border-primary/40 hover:bg-muted/60 min-h-[180px]">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 w-full">
                        <Avatar className="h-12 w-12 flex-shrink-0 mx-auto sm:mx-0">
                          <AvatarImage src={testimonial.image.src} alt={testimonial.name} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-center sm:items-start gap-1 w-full">
                          <p className="text-sm font-semibold text-foreground break-words">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground break-words">{testimonial.role}, {testimonial.company}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground break-words">
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
              <CarouselPrevious className="-left-3 hidden sm:flex" />
              <CarouselNext className="-right-3 hidden sm:flex" />
            </Carousel>
            {snapCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {Array.from({ length: snapCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={selectedIndex === i}
                    className={
                      selectedIndex === i
                        ? 'h-2.5 w-6 rounded-full bg-primary transition-all'
                        : 'h-2.5 w-2.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors'
                    }
                  >
                    <span className="sr-only">Slide {i + 1}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left text-xs sm:text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Customer satisfaction rating: 4.9 / 5</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left text-xs sm:text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Net promoter score above 70</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left text-xs sm:text-sm text-muted-foreground">
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
        <section id="faq" className="relative w-full py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6">
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
                  <Card className="border border-primary/30 bg-background/80 backdrop-blur-md shadow-[0_24px_80px_-50px_rgba(10,70,95,0.45)]">
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
                    <Card className="border border-border/40 bg-background/70 p-4 sm:p-5">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">Avg. response time</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">Under 8 minutes during business hours</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="border border-border/40 bg-background/70 p-4 sm:p-5">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                          <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">Dedicated onboarding</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">Enterprise teams receive a success manager from day one</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
              <Card className="border border-border/40 bg-background/90 backdrop-blur-md shadow-[0_24px_90px_-50px_rgba(15,46,85,0.45)]">
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
        <section className="relative w-full py-12 sm:py-16 md:py-28 lg:py-32 overflow-hidden">
          <div className="w-full bg-accent px-5 sm:px-8 md:px-12 lg:px-20 py-12 sm:py-16 md:py-28 lg:py-32 rounded-3xl ml-5 sm:ml-8 md:ml-12 lg:ml-20 mr-5 sm:mr-8 md:mr-12 lg:mr-20 transition-all duration-300">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid items-center gap-8 sm:gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6 sm:space-y-8 text-center md:text-left order-2 md:order-1">
                  <div className="lg:pl-4 xl:pl-8">
                    <Badge variant="outline" className="mx-auto md:mx-0 w-fit border-muted/40 bg-muted/10 text-foreground uppercase tracking-[0.25em] sm:tracking-[0.4em] text-xs sm:text-sm px-3 py-1">
                    Mobile banking in motion
                  </Badge>
                  <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight text-foreground">Download the Payvost app</h2>
                    <p className="max-w-xl text-sm sm:text-base md:text-lg text-muted-foreground mx-auto md:mx-0 leading-relaxed">
                      Send money locally, pay bills globally, receive payouts, and grow balances in multi-currency wallets — all from one secure super app.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <Card className="border-muted/10 bg-muted/10">
                      <CardContent className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5">
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-muted/20 flex-shrink-0">
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="space-y-0.5 sm:space-y-1 text-left">
                          <p className="text-xs sm:text-sm font-semibold text-foreground">Instant wallet funding</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">Move money in seconds with real-time notifications and smart retries.</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-muted/10 bg-muted/10">
                      <CardContent className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5">
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-muted/20 flex-shrink-0">
                          <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="space-y-0.5 sm:space-y-1 text-left">
                          <p className="text-xs sm:text-sm font-semibold text-foreground">Enterprise-grade security</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">Biometric login, device attestation, and real-time fraud monitoring.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start sm:gap-6">
                    <div className="flex flex-row flex-wrap gap-2 sm:gap-4 w-full sm:w-auto justify-center items-center">
                      <Link href="#" className="transform transition hover:scale-105 mx-auto sm:mx-0">
                        <Image src="/App Store.png" alt="Download on the App Store" width={160} height={48} className="sm:w-[180px] sm:h-[54px]" />
                      </Link>
                      <Link href="#" className="transform transition hover:scale-105 mx-auto sm:mx-0">
                        <Image src="/Google Play (2).png" alt="Get it on Google Play" width={160} height={48} className="sm:w-[180px] sm:h-[54px]" />
                      </Link>
                    </div>
                  </div>
                  </div>
                </div>
                <div className="relative flex justify-center md:justify-end order-1 md:order-2">
                  <div className="relative mx-auto w-full max-w-sm sm:max-w-md md:mx-0">
                    <Image
                      src="/optimized/Dashboard.jpg"
                      alt="Payvost dashboard preview"
                      width={480}
                      height={360}
                      className="h-auto w-full rounded-3xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted text-muted-foreground py-10 sm:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-[30%] space-y-4">
              <Link href="#" className="flex items-center space-x-2">
                <Icons.logo className="h-7 sm:h-8" />
              </Link>
              <p className="text-xs sm:text-sm leading-relaxed">Stay up to date with the latest news, announcements, and articles.</p>
              <form className="flex w-full max-w-sm space-x-2">
                <Input type="email" placeholder="Enter your email" className="text-sm h-10" />
                <Button type="submit" className="h-10 text-sm px-4">Subscribe</Button>
              </form>
            </div>
            <div className="w-full md:w-[70%] grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-foreground">Product</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
                </ul>
                </div>
                <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-foreground">Company</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                    <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                    <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                </ul>
                </div>
                <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-foreground">Resources</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <li><Link href="#blog" className="hover:text-primary transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                    <li><Link href="/fx-rates" className="hover:text-primary transition-colors">Live FX Rates</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Developers</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
                </ul>
                </div>
                <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-semibold text-foreground">Policies</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
                </ul>
                </div>
            </div>
          </div>
          <div className="mt-8 pt-6 sm:pt-8 border-t border-muted-foreground/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs sm:text-sm text-center sm:text-left">
                <p>&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <Link href="https://x.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Twitter className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
              <Link href="https://facebook.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Facebook className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
              <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
