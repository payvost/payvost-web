
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
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { EnhancedLiveChat } from '@/components/enhanced-live-chat';

const supportCategories = [
  { title: 'Getting Started', description: 'Set up your account and make your first transfer.', icon: <Rocket className="h-8 w-8 text-primary" />, href: '/help?category=Getting Started' },
  { title: 'Payments & Payouts', description: 'Learn about sending and receiving money.', icon: <Banknote className="h-8 w-8 text-primary" />, href: '/help?category=Payments' },
  { title: 'Disputes & Fraud', description: 'Understand how to handle transaction issues.', icon: <ShieldAlert className="h-8 w-8 text-primary" />, href: '/help?category=Disputes' },
  { title: 'Account & Settings', description: 'Manage your profile and security settings.', icon: <UserCog className="h-8 w-8 text-primary" />, href: '/help?category=Account' },
  { title: 'Developer & API', description: 'Integrate our services with your applications.', icon: <Code2 className="h-8 w-8 text-primary" />, href: '/help?category=Developers' },
  { title: 'Contact Us', description: 'Get in touch with our support team.', icon: <MessageSquarePlus className="h-8 w-8 text-primary" />, href: '/contact' },
];

// Featured articles will be fetched from knowledge base
const featuredArticles = [
    { title: 'How to track your transfer', href: '/help/how-to-track-your-transfer' },
    { title: 'Understanding our fees', href: '/help/understanding-our-fees' },
    { title: 'Securing your Payvost account', href: '/help/securing-your-account' },
    { title: 'What to do if your transfer fails', href: '/help/transfer-failed' },
    { title: 'API documentation for developers', href: '/help/api-documentation' },
];

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchTerm.trim()) {
                                    router.push(`/help?search=${encodeURIComponent(searchTerm)}`);
                                }
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Press Enter to search or <Link href="/help" className="text-primary hover:underline">browse all articles</Link>
                    </p>
                </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="w-full py-12 md:py-20 lg:py-24">
            <div className="container px-4 md:px-6 mx-auto">
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

        <div className="container px-4 md:px-6 mx-auto mb-24">
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
                        <CardContent className="space-y-3">
                           <Button className="w-full" asChild>
                             <Link href="/contact">
                                <MessageSquarePlus className="mr-2 h-4 w-4" /> Contact Us
                            </Link>
                           </Button>
                           <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <MessageSquare className="mr-2 h-4 w-4" /> Start Live Chat
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full md:w-[450px] p-0 flex flex-col">
                                    <SheetHeader className="p-4 border-b">
                                        <SheetTitle>AI Support Chat</SheetTitle>
                                        <SheetDescription>
                                            Our AI assistant is here to help you 24/7.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="flex-1">
                                        <EnhancedLiveChat inline />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </CardContent>
                        <CardFooter className="text-center text-xs text-muted-foreground">
                            <p>Our team is available 24/7 to assist you with any questions or issues.</p>
                        </CardFooter>
                     </Card>
                </div>
            </div>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
