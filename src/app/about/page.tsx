
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Zap, Lock, Globe, Users } from "lucide-react";
import { Twitter, Facebook, Linkedin } from "lucide-react";
import React from "react";
import { SiteHeader } from "@/components/site-header";
import { Icons } from "@/components/icons";

const teamMembers = [
    { name: 'Alice Johnson', role: 'CEO & Founder', image: 'https://placehold.co/200x200.png', hint: 'woman portrait' },
    { name: 'Bob Williams', role: 'CTO', image: 'https://placehold.co/200x200.png', hint: 'man portrait' },
    { name: 'Charlie Brown', role: 'Head of Operations', image: 'https://placehold.co/200x200.png', hint: 'person portrait' },
    { name: 'Diana Miller', role: 'Lead Designer', image: 'https://placehold.co/200x200.png', hint: 'woman smiling' },
];

const companyValues = [
    { title: 'Customer First', description: 'We prioritize the needs and satisfaction of our customers above all else.', icon: <Users className="h-8 w-8 mx-auto text-primary" /> },
    { title: 'Integrity', description: 'We operate with transparency and honesty in all our interactions.', icon: <Lock className="h-8 w-8 mx-auto text-primary" /> },
    { title: 'Innovation', description: 'We continuously seek new and better ways to serve our users and improve our platform.', icon: <Zap className="h-8 w-8 mx-auto text-primary" /> },
];


export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">About Payvost</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
              Connecting lives, one transfer at a time. Discover the story behind our mission to make global finance accessible to everyone.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                    <img 
                        src="https://placehold.co/600x400.png"
                        data-ai-hint="team collaboration"
                        alt="Our Mission" 
                        className="rounded-lg object-cover aspect-video" 
                    />
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Mission</h2>
                        <p className="text-muted-foreground">
                            Our mission is to democratize financial services and empower individuals and businesses by providing a fast, secure, and low-cost way to send money across borders. We believe that financial access is a fundamental right, and we are dedicated to building a platform that breaks down barriers and fosters economic opportunity for all.
                        </p>
                        <p className="text-muted-foreground">
                           We are driven by the belief that sending money should be as easy as sending a text message. We are constantly innovating to simplify the process, reduce costs, and increase transparency for our users.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* Team Section */}
        <section id="team" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Meet Our Team</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        The passionate individuals driving the Payvost vision forward.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-16">
                    {teamMembers.map((member) => (
                        <div key={member.name} className="grid gap-2 text-center">
                            <Avatar className="mx-auto h-24 w-24">
                                <AvatarImage src={member.image} data-ai-hint={member.hint} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg font-bold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

         {/* Values Section */}
         <section id="values" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Core Values</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                       The principles that guide every decision we make.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16">
                   {companyValues.map((value) => (
                        <div key={value.title} className="grid gap-2 text-center p-4 rounded-lg hover:bg-muted transition-colors">
                            {value.icon}
                            <h3 className="text-lg font-bold">{value.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {value.description}
                            </p>
                        </div>
                   ))}
                </div>
            </div>
        </section>


        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Join Our Journey?</h2>
            <p className="max-w-[600px] mx-auto mt-4">
              Create an account today and experience the future of international money transfers.
            </p>
            <div className="mt-6">
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/register">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted text-muted-foreground py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-[30%] space-y-4">
              <Link href="/" className="flex items-center space-x-2">
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
                    <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
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
            <p className="text-sm">&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
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
