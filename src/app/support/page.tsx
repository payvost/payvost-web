
'use client';

import { useState } from 'react';
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  Rocket,
  Banknote,
  ShieldAlert,
  UserCog,
  Code2,
  MessageSquarePlus,
  ArrowRight,
  LifeBuoy,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center',
  description: 'Find answers to your questions in our Help Center. Browse articles, read FAQs, or contact our 24/7 support team to get help with your Payvost account.',
};


const supportCategories = [
  { title: 'Getting Started', description: 'Set up your account and make your first transfer.', icon: <Rocket className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Payments & Payouts', description: 'Learn about sending and receiving money.', icon: <Banknote className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Disputes & Fraud', description: 'Understand how to handle transaction issues.', icon: <ShieldAlert className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Account & Settings', description: 'Manage your profile and security settings.', icon: <UserCog className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Developer & API', description: 'Integrate our services with your applications.', icon: <Code2 className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Contact Us', description: 'Get in touch with our support team.', icon: <MessageSquarePlus className="h-8 w-8 text-primary" />, href: '/contact' },
];

const featuredArticles = [
    { title: 'How to track your transfer', href: '#' },
    { title: 'Understanding our fees', href: '#' },
    { title: 'Securing your Payvost account', href: '#' },
    { title: 'What to do if your transfer fails', href: '#' },
    { title: 'API documentation for developers', href: '#' },
];

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full bg-muted">
          <div className="py-20 md:py-28 lg:py-32">
            <div className="container px-4 md:px-6 text-center">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                    How can we help?
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                    Find answers, articles, and contact information to get the most out of Payvost.
                </p>
                <div className="mx-auto mt-6 max-w-2xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search for answers..."
                            className="w-full rounded-full bg-background py-6 pl-12 pr-4 text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="w-full py-12 md:py-20 lg:py-24">
            <div className="container px-4 md:px-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {supportCategories.map((category) => (
                        <Card key={category.title} className="hover:shadow-lg transition-shadow">
                             <Link href={category.href} className="flex flex-col h-full">
                                <CardHeader className="flex-row items-center gap-4">
                                    {category.icon}
                                    <CardTitle>{category.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <span className="text-sm font-semibold text-primary">Learn More <ArrowRight className="inline-block ml-1 h-4 w-4" /></span>
                                </CardFooter>
                             </Link>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        <div className="container px-4 md:px-6 mb-24">
            <div className="grid gap-12 lg:grid-cols-3">
                {/* Featured Articles */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
                     <div className="space-y-4">
                        {featuredArticles.map(article => (
                            <Link key={article.title} href={article.href} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
                                <span className="font-medium">{article.title}</span>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Contact Us Card */}
                <div>
                     <Card className="bg-muted/50 sticky top-24">
                        <CardHeader className="items-center text-center">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <LifeBuoy className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle>Can't find an answer?</CardTitle>
                            <CardDescription>Our support team is here to help.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button className="w-full" asChild>
                             <Link href="/contact">
                                <MessageSquarePlus className="mr-2 h-4 w-4" /> Contact Support
                            </Link>
                           </Button>
                        </CardContent>
                        <CardFooter className="text-center text-xs text-muted-foreground">
                            <p>Our team is available 24/7 to assist you with any questions or issues.</p>
                        </CardFooter>
                     </Card>
                </div>
            </div>
        </div>

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
                    <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                </ul>
                </div>
                <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Resources</h4>
                <ul className="space-y-2">
                    <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                    <li><Link href="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
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
              <Link href="https://x.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="https://facebook.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
