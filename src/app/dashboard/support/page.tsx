
'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  LifeBuoy,
  Loader2,
  Paperclip,
  X,
  File,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Settings,
  Bug,
  Ticket,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LiveChat } from '@/components/live-chat';
import Link from 'next/link';
import { supportService, type TicketPriority, type SupportTicket, type TicketStatus } from '@/services/supportService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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

// File upload constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const MAX_FILES = 5;

// Flexible validation schema that accommodates all categories
const supportTicketSchema = z.object({
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters'),
  description: z.string()
    .min(20, 'Please provide a detailed description (at least 20 characters)')
    .max(5000, 'Description must be less than 5000 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  // Payment fields
  transactionId: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  issueType: z.string().optional(),
  // Account fields
  affectedFeature: z.string().optional(),
  // Technical fields
  errorMessage: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  browser: z.string().optional(),
  device: z.string().optional(),
  // General fields
  inquiryType: z.string().optional(),
});

type TicketFormValues = z.infer<typeof supportTicketSchema>;

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  OPEN: { label: 'Open', variant: 'default', icon: AlertCircle },
  PENDING: { label: 'Pending', variant: 'secondary', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: Clock },
  RESOLVED: { label: 'Resolved', variant: 'default', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', variant: 'secondary', icon: XCircle },
};

const priorityConfig: Record<TicketPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: 'Low', variant: 'secondary' },
  MEDIUM: { label: 'Medium', variant: 'default' },
  HIGH: { label: 'High', variant: 'default' },
  URGENT: { label: 'Urgent', variant: 'destructive' },
};

function SupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const { toast } = useToast();
  const userName = user?.displayName?.split(' ')[0] || 'there';
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tab state for main tabs (Help Center vs My Tickets)
  const [mainTab, setMainTab] = useState<'help-center' | 'my-tickets'>('help-center');
  
  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [recentTicketsLoading, setRecentTicketsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab') as 'help-center' | 'my-tickets';
    if (tab === 'help-center' || tab === 'my-tickets') {
      setMainTab(tab);
    }
  }, [searchParams]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  const fetchRecentTickets = useCallback(async () => {
    if (!user?.uid) return;
    
    setRecentTicketsLoading(true);
    try {
      const result = await supportService.listTickets({
        customerId: user.uid,
        limit: 5,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setRecentTickets(result.tickets);
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
    } finally {
      setRecentTicketsLoading(false);
    }
  }, [user?.uid]);

  const fetchTickets = useCallback(async () => {
    if (!user?.uid) return;
    
    setTicketsLoading(true);
    try {
      const filters: any = {
        customerId: user.uid,
        page,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter;
      }

      if (search) {
        filters.search = search;
      }

      const result = await supportService.listTickets(filters);
      setTickets(result.tickets);
      setTotalPages(result.pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load your tickets',
        variant: 'destructive',
      });
    } finally {
      setTicketsLoading(false);
    }
  }, [user?.uid, page, statusFilter, priorityFilter, search, toast]);

  // Fetch recent tickets for widget
  useEffect(() => {
    if (user?.uid && mainTab === 'help-center') {
      fetchRecentTickets();
    }
  }, [user?.uid, mainTab, fetchRecentTickets]);

  // Fetch full tickets list
  useEffect(() => {
    if (user?.uid && mainTab === 'my-tickets') {
      fetchTickets();
    }
  }, [user?.uid, mainTab, fetchTickets]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getStatusBadge = (status: TicketStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const config = priorityConfig[priority];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleMainTabChange = (value: string) => {
    const newTab = value as 'help-center' | 'my-tickets';
    setMainTab(newTab);
    // Update URL without navigation
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newTab === 'help-center') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', newTab);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = attachments.length + newFiles.length;

    if (totalFiles > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${MAX_FILES} files.`,
        variant: "destructive"
      });
      return;
    }

    const totalSize = [...attachments, ...newFiles].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      toast({
        title: "Total size exceeded",
        description: `Total file size cannot exceed ${MAX_TOTAL_SIZE / (1024 * 1024)}MB.`,
        variant: "destructive"
      });
      return;
    }

    const invalidFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      toast({
        title: "File too large",
        description: `${invalidFiles[0].name} exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
        variant: "destructive"
      });
      return;
    }

    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const onSubmit: SubmitHandler<TicketFormValues> = async (data) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to submit a support ticket.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload attachments if any
      const attachmentUrls: string[] = [];
      if (attachments.length > 0 && user.uid) {
        for (const file of attachments) {
          const storageRef = ref(storage, `support_attachments/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          attachmentUrls.push(url);
        }
      }

      // Build metadata from form data
      const metadata: any = {
        category: activeTab,
        attachments: attachmentUrls.length,
      };

      // Add category-specific fields to metadata
      if (activeTab === 'payments' && 'transactionId' in data) {
        metadata.transactionId = data.transactionId;
        metadata.amount = data.amount;
        metadata.currency = data.currency;
        metadata.issueType = data.issueType;
      } else if (activeTab === 'account' && 'issueType' in data) {
        metadata.issueType = data.issueType;
        metadata.affectedFeature = data.affectedFeature;
      } else if (activeTab === 'technical' && 'issueType' in data) {
        metadata.issueType = data.issueType;
        metadata.errorMessage = data.errorMessage;
        metadata.stepsToReproduce = data.stepsToReproduce;
        metadata.browser = data.browser;
        metadata.device = data.device;
      } else if (activeTab === 'general' && 'inquiryType' in data) {
        metadata.inquiryType = data.inquiryType;
      }

      // Create ticket via API with metadata
      const ticket = await supportService.createTicket({
        subject: data.subject,
        description: data.description,
        category: activeTab,
        priority: data.priority || 'MEDIUM',
        customerId: user.uid,
        tags: attachmentUrls.length > 0 ? ['has-attachments'] : [],
        metadata: Object.keys(metadata).length > 2 ? metadata : undefined, // Only send if we have meaningful data
      });

      toast({
        title: "Ticket Submitted Successfully!",
        description: `Your ticket #${ticket.ticketNumber} has been created. Our team will get back to you shortly.`,
      });

      // Reset form
      reset();
      setAttachments([]);
      setOpenTicketDialog(false);
      setActiveTab('payments');
      
      // Refresh tickets if on my-tickets tab
      if (mainTab === 'my-tickets') {
        fetchTickets();
      } else {
        fetchRecentTickets();
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Failed to Submit Ticket",
        description: error.message || "An error occurred while submitting your ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col w-full">
        {/* Hero Section */}
        <section className="w-full bg-primary/10 rounded-lg">
          <div className="py-12 md:py-20 lg:py-24">
            <div className="container mx-auto px-4 md:px-6 text-center max-w-7xl">
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

        {/* Main Tabs */}
        <div className="container mx-auto px-4 md:px-6 max-w-7xl mt-6">
          <Tabs value={mainTab} onValueChange={handleMainTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="help-center" className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" />
                Help Center
              </TabsTrigger>
              <TabsTrigger value="my-tickets" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                My Tickets
                {recentTickets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {recentTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'PENDING').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Help Center Tab */}
            <TabsContent value="help-center" className="space-y-6">

        {/* Categories Section */}
        <section className="w-full py-12 md:py-20 lg:py-24">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
                    {supportCategories.map((category) => (
                        <Card key={category.title} className="hover:shadow-lg transition-shadow w-full max-w-sm">
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

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Recent Tickets Widget */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">My Recent Tickets</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMainTab('my-tickets')}
                        className="h-auto p-0 text-xs"
                      >
                        View All
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {recentTicketsLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : recentTickets.length === 0 ? (
                        <div className="text-center py-6">
                          <Ticket className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No tickets yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentTickets.slice(0, 3).map((ticket) => (
                            <div
                              key={ticket.id}
                              onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                                {getStatusBadge(ticket.status)}
                              </div>
                              <p className="text-sm font-medium line-clamp-1">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Us Card */}
                  <Card className="bg-muted/50">
                    <CardHeader className="items-center text-center">
                      <div className="p-3 bg-primary/10 rounded-full mx-auto">
                        <LifeBuoy className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Can't find an answer?</CardTitle>
                      <CardDescription>Our support team is here to help.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                           <Dialog open={openTicketDialog} onOpenChange={(open) => {
                             setOpenTicketDialog(open);
                             if (!open) {
                               reset();
                               setAttachments([]);
                               setActiveTab('payments');
                             }
                           }}>
                            <DialogTrigger asChild>
                                <Button className="w-full">
                                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Submit a Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl">Submit a Support Ticket</DialogTitle>
                                        <DialogDescription>
                                            Select the category that best describes your issue and fill out the form below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
                                        {/* Left Column - Category Tabs */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-base font-semibold mb-3 block">Issue Category</Label>
                                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                                    <TabsList className="grid w-full grid-cols-2">
                                                        <TabsTrigger value="payments" className="flex items-center gap-2">
                                                            <CreditCard className="h-4 w-4" />
                                                            Payments
                                                        </TabsTrigger>
                                                        <TabsTrigger value="account" className="flex items-center gap-2">
                                                            <UserCog className="h-4 w-4" />
                                                            Account
                                                        </TabsTrigger>
                                                        <TabsTrigger value="technical" className="flex items-center gap-2">
                                                            <Bug className="h-4 w-4" />
                                                            Technical
                                                        </TabsTrigger>
                                                        <TabsTrigger value="general" className="flex items-center gap-2">
                                                            <HelpCircle className="h-4 w-4" />
                                                            General
                                                        </TabsTrigger>
                                                    </TabsList>
                                                </Tabs>
                                            </div>

                                            {/* Dynamic Form Fields Based on Category */}
                                            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                                                {/* Payments Tab Fields */}
                                                {activeTab === 'payments' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="issueType">Issue Type</Label>
                                                            <Controller
                                                                name="issueType"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                        <SelectTrigger aria-label="Select payment issue type">
                                                                            <SelectValue placeholder="Select issue type" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="failed">Failed Transaction</SelectItem>
                                                                            <SelectItem value="pending">Pending Transaction</SelectItem>
                                                                            <SelectItem value="refund">Refund Request</SelectItem>
                                                                            <SelectItem value="dispute">Dispute</SelectItem>
                                                                            <SelectItem value="other">Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                                                                <Input
                                                                    id="transactionId"
                                                                    placeholder="e.g. tx_123456"
                                                                    {...register('transactionId')}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="amount">Amount (Optional)</Label>
                                                                <Input
                                                                    id="amount"
                                                                    type="text"
                                                                    placeholder="0.00"
                                                                    {...register('amount')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="currency">Currency (Optional)</Label>
                                                            <Controller
                                                                name="currency"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                        <SelectTrigger aria-label="Select currency">
                                                                            <SelectValue placeholder="Select currency" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="USD">USD</SelectItem>
                                                                            <SelectItem value="EUR">EUR</SelectItem>
                                                                            <SelectItem value="GBP">GBP</SelectItem>
                                                                            <SelectItem value="NGN">NGN</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Account Tab Fields */}
                                                {activeTab === 'account' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="accountIssueType">Issue Type</Label>
                                                            <Controller
                                                                name="issueType"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                        <SelectTrigger aria-label="Select account issue type">
                                                                            <SelectValue placeholder="Select issue type" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="login">Login Issues</SelectItem>
                                                                            <SelectItem value="security">Security Concerns</SelectItem>
                                                                            <SelectItem value="verification">Verification Problems</SelectItem>
                                                                            <SelectItem value="settings">Settings/Preferences</SelectItem>
                                                                            <SelectItem value="other">Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="affectedFeature">Affected Feature (Optional)</Label>
                                                            <Input
                                                                id="affectedFeature"
                                                                placeholder="e.g. Two-factor authentication"
                                                                {...register('affectedFeature')}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Technical Tab Fields */}
                                                {activeTab === 'technical' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="techIssueType">Issue Type</Label>
                                                            <Controller
                                                                name="issueType"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                        <SelectTrigger aria-label="Select technical issue type">
                                                                            <SelectValue placeholder="Select issue type" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="bug">Bug Report</SelectItem>
                                                                            <SelectItem value="performance">Performance Issue</SelectItem>
                                                                            <SelectItem value="integration">Integration Problem</SelectItem>
                                                                            <SelectItem value="api">API Issue</SelectItem>
                                                                            <SelectItem value="other">Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="errorMessage">Error Message (Optional)</Label>
                                                            <Input
                                                                id="errorMessage"
                                                                placeholder="Paste error message here"
                                                                {...register('errorMessage')}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="browser">Browser (Optional)</Label>
                                                                <Input
                                                                    id="browser"
                                                                    placeholder="e.g. Chrome 120"
                                                                    {...register('browser')}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="device">Device (Optional)</Label>
                                                                <Input
                                                                    id="device"
                                                                    placeholder="e.g. Windows 11"
                                                                    {...register('device')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="stepsToReproduce">Steps to Reproduce (Optional)</Label>
                                                            <Textarea
                                                                id="stepsToReproduce"
                                                                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                                                                rows={3}
                                                                {...register('stepsToReproduce')}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* General Tab Fields */}
                                                {activeTab === 'general' && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="inquiryType">Inquiry Type</Label>
                                                        <Controller
                                                            name="inquiryType"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                    <SelectTrigger aria-label="Select inquiry type">
                                                                        <SelectValue placeholder="Select inquiry type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="question">General Question</SelectItem>
                                                                        <SelectItem value="feature">Feature Request</SelectItem>
                                                                        <SelectItem value="feedback">Feedback</SelectItem>
                                                                        <SelectItem value="other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column - Common Fields */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="subject"
                                                    placeholder="Brief summary of your issue"
                                                    {...register('subject')}
                                                    className={errors.subject ? 'border-destructive' : ''}
                                                />
                                                {errors.subject && (
                                                    <p className="text-sm text-destructive">{errors.subject.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="priority">Priority</Label>
                                                <Controller
                                                    name="priority"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value || 'MEDIUM'}>
                                                            <SelectTrigger aria-label="Select priority level">
                                                                <SelectValue placeholder="Select priority" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="LOW" textValue="Low - General inquiry">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                                                        Low - General inquiry
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="MEDIUM" textValue="Medium - Standard issue">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                                        Medium - Standard issue
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="HIGH" textValue="High - Urgent issue">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                                        High - Urgent issue
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="URGENT" textValue="Urgent - Critical issue">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                                                        Urgent - Critical issue
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Please describe your issue in detail. Include any relevant information that will help us assist you better."
                                                    rows={8}
                                                    {...register('description')}
                                                    className={errors.description ? 'border-destructive' : ''}
                                                />
                                                {errors.description && (
                                                    <p className="text-sm text-destructive">{errors.description.message}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Minimum 20 characters. Be as detailed as possible.
                                                </p>
                                            </div>

                                            {/* File Attachments */}
                                            <div className="space-y-2">
                                                <Label htmlFor="attachments">Attachments (Optional)</Label>
                                                <div className="space-y-2">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        id="attachments"
                                                        multiple
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.csv,.xlsx,.zip"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full"
                                                        disabled={attachments.length >= MAX_FILES}
                                                    >
                                                        <Paperclip className="mr-2 h-4 w-4" />
                                                        {attachments.length >= MAX_FILES 
                                                            ? `Maximum ${MAX_FILES} files reached`
                                                            : `Add Files (${attachments.length}/${MAX_FILES})`
                                                        }
                                                    </Button>
                                                    {attachments.length > 0 && (
                                                        <div className="space-y-2 mt-2">
                                                            {attachments.map((file, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between p-2 border rounded-md bg-background"
                                                                >
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                        <span className="text-sm truncate">{file.name}</span>
                                                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                                                            ({formatFileSize(file.size)})
                                                                        </span>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => removeFile(index)}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Max {MAX_FILES} files, {MAX_FILE_SIZE / (1024 * 1024)}MB per file, {MAX_TOTAL_SIZE / (1024 * 1024)}MB total
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                reset();
                                                setAttachments([]);
                                                setOpenTicketDialog(false);
                                                setActiveTab('payments');
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                                                    Submit Ticket
                                                </>
                                            )}
                                        </Button>
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
            </TabsContent>

            {/* My Tickets Tab */}
            <TabsContent value="my-tickets" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">My Support Tickets</h2>
                  <p className="text-muted-foreground mt-1">
                    View and track all your support requests
                  </p>
                </div>
                <Button onClick={() => setOpenTicketDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tickets.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open</CardTitle>
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'RESOLVED').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'PENDING').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v as any); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Tickets</CardTitle>
                  <CardDescription>
                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ticketsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
                      <p className="text-muted-foreground mb-4">
                        {search || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : "You haven't created any support tickets yet"}
                      </p>
                      {!search && statusFilter === 'all' && priorityFilter === 'all' && (
                        <Button onClick={() => setOpenTicketDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Ticket
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticket #</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Messages</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Last Updated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tickets.map((ticket) => (
                              <TableRow 
                                key={ticket.id} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                              >
                                <TableCell className="font-mono text-sm">
                                  {ticket.ticketNumber}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {ticket.subject}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {ticket.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(ticket.status)}
                                </TableCell>
                                <TableCell>
                                  {getPriorityBadge(ticket.priority)}
                                </TableCell>
                                <TableCell>
                                  {ticket._count && ticket._count.messages > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{ticket._count.messages}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </main>
    </DashboardLayout>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <DashboardLayout language="en" setLanguage={() => {}}>
        <main className="flex flex-1 flex-col w-full">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl py-12">
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </DashboardLayout>
    }>
      <SupportPageContent />
    </Suspense>
  );
}
