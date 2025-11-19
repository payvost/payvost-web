
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Zap, Lock, Globe, Users } from "lucide-react";
import React from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const teamMembers = [
    { name: 'Pamilerin Coker', role: 'CEO & Founder', image: '/founder.jpg', hint: 'woman portrait' },
    { name: 'Tyler Grant', role: 'CTO', image: '/optimized/CTO - Tyler Grant.jpg', hint: 'man portrait' },
    { name: 'Erica Johnson', role: 'COO', image: '/optimized/COO- Erica Johnson.jpg', hint: 'person portrait' },
    { name: 'Kendra Allen', role: 'Global CFO', image: '/optimized/Global CFO - Kendra Allen.jpg', hint: 'woman smiling' },
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
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">About Payvost</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
              Connecting lives, one transfer at a time. Discover the story behind our mission to make global finance accessible to everyone.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-8">
                    <img 
                        src="https://placehold.co/600x400.png"
                        data-ai-hint="team collaboration"
                        alt="Our Mission" 
                        className="rounded-lg object-cover aspect-video w-full" 
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
            <div className="container mx-auto px-4 md:px-6 text-center">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col items-center justify-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Meet Our Team</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            The passionate individuals driving the Payvost vision forward.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member) => (
                            <Card key={member.name} className="overflow-hidden text-center hover:shadow-xl transition-shadow">
                                <div className="relative aspect-square">
                                    <img src={member.image} alt={member.name} data-ai-hint={member.hint} className="object-cover h-full w-full" />
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="text-lg font-bold">{member.name}</h3>
                                    <p className="text-sm text-primary">{member.role}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>

         {/* Values Section */}
         <section id="values" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col items-center justify-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Core Values</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           The principles that guide every decision we make.
                        </p>
                    </div>
                    <div className="grid items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16">
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
            </div>
        </section>


        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
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
      <SiteFooter />
    </div>
  )
}
