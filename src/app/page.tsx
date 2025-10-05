
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Zap, Lock, Globe, ArrowRightLeft, Twitter, Facebook, Linkedin, MoreHorizontal, Star } from "lucide-react";
import React, { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
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
    { name: 'Germany', currency: 'Euro (EUR)', flag: 'DE.png', hint: 'Berlin city' },
    { name: 'South Africa', currency: 'Rand (ZAR)', flag: 'ZA.png', hint: 'Cape Town' },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CEO",
    company: "Innovate Inc.",
    image: { src: "https://picsum.photos/seed/t1/100/100", hint: "woman portrait" },
    rating: 5,
    quote: "Payvost is a game-changer. The speed and low fees are unmatched. Highly recommended for anyone sending money abroad."
  },
  {
    name: "Michael Chen",
    role: "Freelancer",
    company: "Chen Designs",
    image: { src: "https://picsum.photos/seed/t2/100/100", hint: "man smiling" },
    rating: 5,
    quote: "As a freelancer working with international clients, Payvost has simplified my life. Getting paid is now fast and hassle-free."
  },
  {
    name: "David Rodriguez",
    role: "CTO",
    company: "Tech Solutions",
    image: { src: "https://picsum.photos/seed/t3/100/100", hint: "person portrait" },
    rating: 4,
    quote: "The API is well-documented and easy to integrate. We were able to get up and running in just a couple of days. Solid platform."
  },
  {
    name: "Emily White",
    role: "E-commerce Owner",
    company: "The Shop",
    image: { src: "https://picsum.photos/seed/t4/100/100", hint: "woman in cafe" },
    rating: 5,
    quote: "I love the multi-currency wallet feature. It makes managing payments from different countries so much easier."
  }
];


export default function LandingPage() {
  const { blog: blogImages } = placeholderImageData;
  const [sendAmount, setSendAmount] = useState('');
  const [recipientGets, setRecipientGets] = useState('');
  const [sendCurrency, setSendCurrency] = useState('USD');
  const [receiveCurrency, setReceiveCurrency] = useState('NGN');

  const exchangeRates: Record<string, Record<string, number>> = {
      USD: { NGN: 1450.50, GHS: 14.50, KES: 130.25 },
      GBP: { NGN: 1850.75, GHS: 18.50, KES: 165.80 },
      EUR: { NGN: 1600.20, GHS: 16.00, KES: 143.50 },
  };

  const handleCheckPricing = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const amount = parseFloat(sendAmount);
      if (!isNaN(amount) && amount > 0 && exchangeRates[sendCurrency] && exchangeRates[sendCurrency][receiveCurrency]) {
        const rate = exchangeRates[sendCurrency][receiveCurrency];
        const convertedAmount = amount * rate;
        setRecipientGets(convertedAmount.toFixed(2));
      } else {
        setRecipientGets('');
      }
  };
  
  const currentRate = exchangeRates[sendCurrency]?.[receiveCurrency] || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 rounded-b-[15px] bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:items-center">
              <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Send money instantly, securely — anywhere in the world
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                    Join thousands of satisfied customers who trust Payvost for their international money transfers.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                  <Button asChild size="lg">
                    <Link href="/register">
                      Create Account
                    </Link>
                  </Button>
                   <Button asChild size="lg" variant="outline">
                    <Link href="/track-transfer">
                      Track Transfer
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Check Live Rates</CardTitle>
                    <CardDescription>Get the best exchange rates in real-time.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="send-amount">You send</Label>
                        <Input id="send-amount" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00"/>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient-gets">Recipient gets</Label>
                        <Input id="recipient-gets" readOnly value={recipientGets} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="send-currency">Currency</Label>
                        <Select value={sendCurrency} onValueChange={setSendCurrency}>
                          <SelectTrigger id="send-currency">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div></div>
                      <div className="space-y-2">
                        <Label htmlFor="receive-currency">Currency</Label>
                        <Select value={receiveCurrency} onValueChange={setReceiveCurrency}>
                          <SelectTrigger id="receive-currency">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">NGN</SelectItem>
                            <SelectItem value="GHS">GHS</SelectItem>
                            <SelectItem value="KES">KES</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground pt-2">
                      <p>Exchange rate: 1 {sendCurrency} = {currentRate.toFixed(2)} {receiveCurrency}</p>
                      <p>No hidden fees.</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handleCheckPricing}>Check Pricing</Button>
                  </CardFooter>
                </Card>
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
            <div className="bg-primary text-primary-foreground rounded-[15px] p-8 md:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="text-center lg:text-left">
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
                   <div className="hidden lg:flex justify-center">
                      <div className="bg-primary-foreground/10 p-4 rounded-xl">
                          <Image src="/Dashboard.png" alt="Payvost App Dashboard" width={400} height={300} data-ai-hint="app dashboard" className="rounded-lg shadow-2xl" />
                      </div>
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
                    <li><Link href="#" className="hover:text-primary transition-colors">Press</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                </ul>
                </div>
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Resources</h4>
                <ul className="space-y-2">
                    <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Developers</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
                </ul>
                </div>
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Policies</h4>
                <ul className="space-y-2">
                    <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                </ul>
                </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-muted-foreground/20 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-center sm:text-left">
                <p>&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
                <p className="mt-1">Verification code: OS7K3L</p>
            </div>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
