
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
import { ArrowRight, Zap, Lock, Globe, ArrowRightLeft, Twitter, Facebook, Linkedin } from "lucide-react";
import React from "react";
import { SiteHeader } from "@/components/site-header";


export default function LandingPage() {
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
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent>
                {Array.from({ length: 9 }).map((_, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                           <img src="https://placehold.co/300x200.png" data-ai-hint="international currency" alt="Country" className="rounded-lg object-cover aspect-[3/2]" />
                           <div className="text-center">
                            <p className="text-lg font-semibold">Country Name</p>
                            <p className="text-sm text-muted-foreground">Currency (CUR)</p>
                           </div>
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
                            <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person portrait" alt="User" />
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
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16">
              {[1, 2, 3].map((item) => (
                <Card key={item}>
                  <img
                    src="https://placehold.co/600x400.png"
                    data-ai-hint="finance technology"
                    alt="Blog Post"
                    className="aspect-video w-full overflow-hidden rounded-t-lg object-cover"
                  />
                  <CardHeader>
                    <CardTitle className="text-xl">Blog Post Title {item}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      A brief summary of the blog post goes here. Catch the reader's interest.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="p-0">Read More <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted text-muted-foreground py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-1 sm:col-span-2 space-y-4">
              <Link href="#" className="flex items-center space-x-2">
                <Icons.logo className="h-8" />
              </Link>
              <p className="text-sm">Stay up to date with the latest news, announcements, and articles.</p>
              <form className="flex w-full max-w-sm space-x-2">
                <Input type="email" placeholder="Enter your email" />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
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
                <li><Link href="#blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Developers</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
              </ul>
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

    