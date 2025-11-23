
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  MessageSquarePlus,
  ArrowRight,
  LifeBuoy,
  FileText,
  DollarSign,
  Users,
  ShieldAlert,
  Bot,
  BookOpen,
  CheckCircle,
  BarChart,
  Repeat
} from 'lucide-react';
import { EnhancedLiveChat } from '@/components/enhanced-live-chat';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const supportCategories = [
  { title: 'Payouts & Settlements', description: 'Learn about sending funds to vendors and employees.', icon: <DollarSign className="h-6 w-6 text-primary" />, href: '#' },
  { title: 'Invoicing & Billing', description: 'Create and manage invoices for your clients.', icon: <FileText className="h-6 w-6 text-primary" />, href: '#' },
  { title: 'Team Management', description: 'Manage roles, permissions, and team members.', icon: <Users className="h-6 w-6 text-primary" />, href: '#' },
  { title: 'Fraud & Disputes', description: 'Understand how to handle chargebacks and fraudulent activity.', icon: <ShieldAlert className="h-6 w-6 text-primary" />, href: '#' },
  { title: 'Analytics & Reporting', description: 'Analyze your revenue and business health.', icon: <BarChart className="h-6 w-6 text-primary" />, href: '#' },
  { title: 'Account Settings', description: 'Configure your business profile and security.', icon: <Users className="h-6 w-6 text-primary" />, href: '#' },
];

const featuredGuides = [
    { title: "Guide to Your First Payout", href: "#" },
    { title: "Understanding Your Revenue Analytics", href: "#" },
    { title: "Best Practices for Invoice Management", href: "#" },
];

const quickActions = [
    { label: "Check a transaction status", action: () => {} },
    { label: "Initiate a payout", action: () => {} },
    { label: "Find an invoice", action: () => {} },
];

const faqTopics = [
    "How do payouts work?",
    "What are the fees for international payments?",
    "How do I add a team member?",
    "How can I resolve a payment dispute?",
];

type ViewMode = 'docs' | 'ai';

export default function BusinessSupportPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('docs');

    return (
        <>
            <div className="space-y-6">
                {/* Hero Section */}
                <Card className="overflow-hidden">
                    <div className="bg-muted/50 p-8 md:p-12">
                        <div className="max-w-3xl mx-auto text-center">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Payvost Business Support</h1>
                            <p className="mt-2 text-muted-foreground md:text-lg">
                                Your central hub for help, documentation, and AI-powered assistance.
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto">
                                <div className="relative flex-grow w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Search articles and documentation..." className="pl-10 h-12 text-base"/>
                                </div>
                                <div className="flex items-center gap-1 rounded-full bg-background p-1 border w-full sm:w-auto">
                                    <Button variant={viewMode === 'docs' ? 'secondary' : 'ghost'} onClick={() => setViewMode('docs')} className="rounded-full flex-1 sm:flex-initial">Docs</Button>
                                    <Button variant={viewMode === 'ai' ? 'secondary' : 'ghost'} onClick={() => setViewMode('ai')} className="rounded-full flex-1 sm:flex-initial"><Bot className="mr-2 h-4 w-4"/>AI Live Mode</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {viewMode === 'docs' ? (
                             <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {supportCategories.map((category) => (
                                        <Link href={category.href} key={category.title} className="group">
                                            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                                                <CardHeader className="flex-row items-center gap-4">
                                                    {category.icon}
                                                    <CardTitle>{category.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="lg:col-span-2">
                                        <CardHeader><CardTitle>Featured Guides</CardTitle></CardHeader>
                                        <CardContent className="space-y-2">
                                            {featuredGuides.map(guide => (
                                                 <Link href={guide.href} key={guide.title} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                                                    <span className="font-medium text-sm">{guide.title}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                </Link>
                                            ))}
                                        </CardContent>
                                    </Card>
                                     <div className="space-y-6">
                                        <Card>
                                            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5"/>Developer Docs</CardTitle></CardHeader>
                                            <CardContent><p className="text-sm text-muted-foreground">Explore our API and build powerful integrations.</p></CardContent>
                                            <CardFooter><Button variant="outline" className="w-full">Go to Docs</Button></CardFooter>
                                        </Card>
                                         <Card>
                                            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5"/>System Status</CardTitle></CardHeader>
                                            <CardContent><p className="text-sm text-muted-foreground">Check the real-time status of all our services.</p></CardContent>
                                            <CardFooter><Button variant="outline" className="w-full">View Status Page</Button></CardFooter>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                <Card className="lg:col-span-2 h-[600px] flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6"/> AI Support Assistant</CardTitle>
                                        <CardDescription>Get instant answers to your questions about our business tools and services.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0">
                                        <EnhancedLiveChat inline />
                                    </CardContent>
                                </Card>
                                <div className="space-y-6">
                                     <Card>
                                        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                                        <CardContent className="space-y-2">
                                            {quickActions.map(action => (
                                                <Button key={action.label} variant="outline" className="w-full justify-start">{action.label}</Button>
                                            ))}
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle>Frequently Asked</CardTitle></CardHeader>
                                        <CardContent className="space-y-2">
                                            {faqTopics.map(topic => (
                                                <button key={topic} className="text-sm font-medium text-left text-primary hover:underline w-full">{topic}</button>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}
