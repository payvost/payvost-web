
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import {
  Search,
  Rocket,
  Banknote,
  ShieldAlert,
  UserCog,
  Code2,
  MessageSquarePlus,
  ArrowRight,
  LifeBuoy
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LiveChat } from '@/components/live-chat';
import Link from 'next/link';

const supportCategories = [
  { title: 'Getting Started', description: 'Set up your account and make your first transfer.', icon: <Rocket className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Payments & Payouts', description: 'Learn about sending and receiving money.', icon: <Banknote className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Disputes & Fraud', description: 'Understand how to handle transaction issues.', icon: <ShieldAlert className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Account & Settings', description: 'Manage your profile and security settings.', icon: <UserCog className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Developer & API', description: 'Integrate our services with your applications.', icon: <Code2 className="h-8 w-8 text-primary" />, href: '#' },
  { title: 'Contact Us', description: 'Get in touch with our support team.', icon: <MessageSquarePlus className="h-8 w-8 text-primary" />, href: '/dashboard/contact' },
];

const featuredArticles = [
    { title: 'How to track your transfer', href: '#' },
    { title: 'Understanding our fees', href: '#' },
    { title: 'Securing your Payvost account', href: '#' },
    { title: 'What to do if your transfer fails', href: '#' },
    { title: 'API documentation for developers', href: '#' },
];

export default function SupportPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const { toast } = useToast();
  const userName = user?.displayName?.split(' ')[0] || 'there';
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  
  const handleTicketSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
        title: "Ticket Submitted!",
        description: "Our support team will get back to you shortly.",
    });
    setOpenTicketDialog(false);
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="w-full bg-primary/10 rounded-lg">
          <div className="py-12 md:py-20 lg:py-24">
            <div className="container px-4 md:px-6 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Hi {userName}, how can we help?
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
                            <CardHeader className="flex-row items-center gap-4">
                                {category.icon}
                                <CardTitle>{category.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="link" className="p-0" asChild>
                                    <Link href={category.href}>
                                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
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
                            <a key={article.title} href={article.href} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
                                <span className="font-medium">{article.title}</span>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Contact Us Card */}
                <div>
                     <Card className="bg-muted/50">
                        <CardHeader className="items-center text-center">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <LifeBuoy className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle>Can't find an answer?</CardTitle>
                            <CardDescription>Our support team is here to help.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Dialog open={openTicketDialog} onOpenChange={setOpenTicketDialog}>
                            <DialogTrigger asChild>
                                <Button className="w-full">
                                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Submit a Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleTicketSubmit}>
                                    <DialogHeader>
                                    <DialogTitle>Submit a Support Ticket</DialogTitle>
                                    <DialogDescription>
                                        Describe your issue below and our team will get back to you as soon as possible.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="category" className="text-right">Category</Label>
                                            <Select>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="payments">Payments & Payouts</SelectItem>
                                                    <SelectItem value="account">Account & Settings</SelectItem>
                                                    <SelectItem value="technical">Technical Issue</SelectItem>
                                                    <SelectItem value="general">General Inquiry</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="subject" className="text-right">Subject</Label>
                                            <Input id="subject" className="col-span-3" placeholder="e.g. Issue with my last transfer" />
                                        </div>
                                        <div className="grid grid-cols-4 items-start gap-4">
                                            <Label htmlFor="description" className="text-right pt-2">Description</Label>
                                            <Textarea id="description" className="col-span-3" placeholder="Please describe your issue in detail." rows={5} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                    <Button type="submit">Submit Ticket</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                           </Dialog>
                           <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        Start Live Chat
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full md:w-[450px] p-0 flex flex-col">
                                    <SheetHeader className="p-4 border-b">
                                        <SheetTitle>AI Support Chat</SheetTitle>
                                        <SheetDescription>
                                            Our AI assistant is here to help you 24/7.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <LiveChat />
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
    </DashboardLayout>
  );
}
