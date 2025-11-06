
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, Sparkles, ShieldCheck, Code2, BarChart3, Zap, Lock, Globe, Twitter, Facebook, Linkedin, MoreHorizontal, Star, ArrowUpRight } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { SiteHeader } from "@/components/site-header";
import { LiveRateChecker } from "@/components/live-rate-checker";
import Image from "next/image";
import placeholderImageData from '@/app/lib/placeholder-images.json';


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

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose Payvost?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We offer a secure, fast, and affordable way to send money internationally.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 text-center">
                <Zap className="h-8 w-8 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Fast FX rates</h3>
                <p className="text-sm text-muted-foreground">
                  Get competitive exchange rates and send money in minutes.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Lock className="h-8 w-8 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Secure Transfers</h3>
                <p className="text-sm text-muted-foreground">
                  Your transactions are protected with industry-leading security.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Globe className="h-8 w-8 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Global Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Send money to over 150 countries and territories worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section id="countries" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Send Money Across the Globe</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                A few of the popular destinations our customers send to.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-10 max-w-4xl mx-auto">
                {popularCountries.map((country) => (
                    <div key={country.name} className="flex flex-col items-center gap-2 text-center">
                        <img src={`/flag/${country.flag}`} alt={country.name} className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-2 border-border" />
                        <p className="text-sm font-medium">{country.name}</p>
                    </div>
                ))}
                <Link href="#" className="flex flex-col items-center gap-2 text-center">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border hover:bg-muted/80 transition-colors">
                        <MoreHorizontal className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">See All</p>
                </Link>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Customers Say</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from real people who trust Payvost for their global payments.
                </p>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-4 h-full">
                      <Card className="flex flex-col h-full">
                         <CardContent className="pt-6 flex-grow">
                          <div className="flex mb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-base">"{testimonial.quote}"</p>
                        </CardContent>
                        <CardFooter>
                           <div className="flex flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src={testimonial.image.src} data-ai-hint={testimonial.image.hint} alt={testimonial.name} />
                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-semibold">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                            </div>
                           </div>
                        </CardFooter>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
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
