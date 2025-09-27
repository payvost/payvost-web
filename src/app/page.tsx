
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
import { ArrowRight, Zap, Lock, Globe, ArrowRightLeft, Twitter, Facebook, Linkedin, MoreHorizontal } from "lucide-react";
import React from "react";
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


export default function LandingPage() {
  const { blog: blogImages } = placeholderImageData;
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
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
                    <Link href="#">
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
                        <Input id="send-amount" defaultValue="1000.00" />
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient-gets">Recipient gets</Label>
                        <Input id="recipient-gets" readOnly placeholder="0.00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="send-currency">Currency</Label>
                        <Select defaultValue="USD">
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
                        <Select defaultValue="NGN">
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
                      <p>Exchange rate: 1 USD = 1,450.50 NGN</p>
                      <p>No hidden fees.</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Check Pricing</Button>
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
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-4xl mx-auto"
            >
              <CarouselContent>
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                          <Avatar>
                            <AvatarImage src="https://picsum.photos/seed/t1/100/100" data-ai-hint="person portrait" alt="User" />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">Customer Name</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">"Payvost is a game-changer. The speed and low fees are unmatched. Highly recommended for anyone sending money abroad."</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
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
                    <Image
                      src={blogImages.payvost_google_partnership.src}
                      width={blogImages.payvost_google_partnership.width}
                      height={blogImages.payvost_google_partnership.height}
                      data-ai-hint={blogImages.payvost_google_partnership.hint}
                      alt="Payvost partners with Google"
                      className="aspect-video w-full object-cover"
                    />
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
                  <Image
                    src={blogImages.ai_remittance.src}
                    width={blogImages.ai_remittance.width}
                    height={blogImages.ai_remittance.height}
                    data-ai-hint={blogImages.ai_remittance.hint}
                    alt="AI in Remittance"
                    className="aspect-video w-full overflow-hidden rounded-t-lg object-cover"
                  />
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
                  <Image
                    src={blogImages.secure_transfers.src}
                    width={blogImages.secure_transfers.width}
                    height={blogImages.secure_transfers.height}
                    data-ai-hint={blogImages.secure_transfers.hint}
                    alt="Secure Transfers"
                    className="aspect-video w-full overflow-hidden rounded-t-lg object-cover"
                  />
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
                    <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
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
            <p className="text-sm">&copy; 2024 Payvost. All rights reserved.</p>
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
