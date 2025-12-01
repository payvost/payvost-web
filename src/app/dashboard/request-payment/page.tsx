
'use client';

import { useState, useEffect, Suspense } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Link as LinkIcon, FileText, Repeat, Users, Ticket, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTabs } from '@/components/enhanced-tabs';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, arrayUnion, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { sendPaymentRequestEmail } from '@/services/emailService';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QRCodeDialog } from '@/components/qr-code-dialog';

const InvoiceTab = dynamic(() => import('@/components/invoice-tab').then(mod => mod.InvoiceTab), { 
    loading: () => <Skeleton className="h-96 w-full" />,
});
const CreateInvoicePage = dynamic(() => import('@/components/create-invoice-page').then(mod => mod.CreateInvoicePage), { 
    loading: () => <Skeleton className="h-96 w-full" />,
});
const RecurringTab = dynamic(() => import('@/components/recurring-tab').then(mod => mod.RecurringTab), { 
    loading: () => <Skeleton className="h-96 w-full" />,
});
const SplitPaymentTab = dynamic(() => import('@/components/split-payment-tab').then(mod => mod.SplitPaymentTab), { 
    loading: () => <Skeleton className="h-96 w-full" />,
});
const EventTicketsTab = dynamic(() => import('@/components/event-tickets-tab').then(mod => mod.EventTicketsTab), { 
    loading: () => <Skeleton className="h-96 w-full" />,
});
const DonationsTab = dynamic(() => import('@/components/donations-tab').then(mod => mod.DonationsTab), { 
    loading: () => <Skeleton className="h-96 w-full" />,
});


function PaymentLinkTab() {
  const { user, loading: authLoading } = useAuth();
  const [generatedLink, setGeneratedLink] = useState('');
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [currency, setCurrency] = useState('USD');
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [linkType, setLinkType] = useState<'one-time' | 'reusable'>('one-time');
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (!user) {
        if (!authLoading) setLoadingRequests(false);
        return;
    }
    const userUnsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if(doc.exists()) {
            const status = doc.data().kycStatus;
            setIsKycVerified(typeof status === 'string' && status.toLowerCase() === 'verified');
        }
    });

    const q = query(
        collection(db, "paymentRequests"), 
        where("userId", "==", user.uid),
        limit(5)
    );
    const requestsUnsub = onSnapshot(q, (querySnapshot) => {
        const requests: any[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setRecentRequests(requests);
        setLoadingRequests(false);
    });

    return () => {
        userUnsub();
        requestsUnsub();
    };
  }, [user, authLoading]);
  

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        toast({ title: 'Not authenticated', description: 'You must be logged in to create a payment link.', variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);

    const form = e.currentTarget;
    const amount = (form as any).amount.value;
    const description = (form as any).description.value;
    const payerEmail = (form as any)['payer-email'].value;

    const newRequestData = {
        to: payerEmail || 'No email (Link)',
        amount: `${currency} ${amount}`,
        description,
        status: 'Active',
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        userId: user.uid,
        numericAmount: parseFloat(amount),
        currency: currency,
        linkType: linkType, // 'one-time' or 'reusable'
    };

    try {
      const docRef = await addDoc(collection(db, 'paymentRequests'), newRequestData);
      const paymentId = docRef.id;
      const link = `${window.location.origin}/pay/${paymentId}`;
      await updateDoc(docRef, { link: link });
      
      if (payerEmail) {
        console.log("Sending email to:", payerEmail);
        try {
            await sendPaymentRequestEmail({
                to: payerEmail,
                amount: parseFloat(amount),
                currency,
                description,
                paymentLink: link,
                requesterName: user.displayName || 'A Payvost User'
            });
            toast({
                title: 'Payment Request Sent!',
                description: `An email has been sent to ${payerEmail}.`,
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
             toast({
                title: 'Link Generated, Email Failed',
                description: 'The payment link was created, but the email could not be sent.',
                variant: 'destructive'
            });
        }

      } else {
         toast({
            title: 'Payment Link Generated!',
            description: 'You can now share the link with your payer.',
        });
      }

      form.reset();
      setCurrency('USD');
      setLinkType('one-time');
      setGeneratedLink(link);
    } catch (err) {
      console.error('Error saving request:', err);
      toast({
        title: 'Error',
        description: 'Failed to save request. Please try again.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The payment link has been copied.',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div>
        <form onSubmit={handleCreateRequest}>
          <Card>
            <CardHeader>
              <CardTitle>Create Payment Link</CardTitle>
              <CardDescription>
                Generate a secure link to get paid by anyone, for anything.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" placeholder="0.00" required disabled={!isKycVerified}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" value={currency} onValueChange={setCurrency} disabled={!isKycVerified}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">What is this for?</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g., Invoice #123, Graphic Design Services"
                  required
                  disabled={!isKycVerified}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-email">Payer's Email (Optional)</Label>
                <Input
                  id="payer-email"
                  name="payer-email"
                  type="email"
                  placeholder="Send an invoice directly to their email"
                  disabled={!isKycVerified}
                />
              </div>
              <div className="space-y-3">
                <Label>Link Type</Label>
                <RadioGroup 
                  value={linkType} 
                  onValueChange={(value) => setLinkType(value as 'one-time' | 'reusable')} 
                  className="grid grid-cols-2 gap-4"
                  disabled={!isKycVerified}
                >
                  <div>
                    <RadioGroupItem value="one-time" id="one-time" className="peer sr-only" />
                    <Label 
                      htmlFor="one-time" 
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-medium">One-Time</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center">Link expires after first payment</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="reusable" id="reusable" className="peer sr-only" />
                    <Label 
                      htmlFor="reusable" 
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-medium">Reusable</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center">Link can be used multiple times</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">Fees may apply.</p>
              <Button type="submit" disabled={isSubmitting || !isKycVerified}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <LinkIcon className="mr-2 h-4 w-4" />
                Create Payment Link
              </Button>
            </CardFooter>
          </Card>
        </form>

        {generatedLink && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Payment Link is Ready!</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Input value={generatedLink} readOnly />
              <Button variant="outline" size="icon" onClick={() => copyLink(generatedLink)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowQRCode(true)}>
                <QrCode className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>A log of your recent payment requests.</CardDescription>
          </CardHeader>
          <CardContent>
             {loadingRequests ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
             ) : recentRequests.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <p>You haven't made any payment requests yet.</p>
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right sr-only">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentRequests.map((req) => (
                    <TableRow key={req.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/request-payment/${req.id}`)}>
                        <TableCell>
                        <div className="font-medium truncate">{req.to}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {new Date(req.createdAt.toDate()).toLocaleDateString()}
                            {req.linkType && (
                                <Badge variant="outline" className="text-xs">
                                    {req.linkType === 'reusable' ? 'Reusable' : 'One-Time'}
                                </Badge>
                            )}
                        </div>
                        </TableCell>
                        <TableCell>{req.amount}</TableCell>
                        <TableCell className="text-right">
                        <Badge
                            variant={
                            req.status === 'Paid'
                                ? 'default'
                                : req.status === 'Pending' || req.status === 'Active'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="capitalize"
                        >
                            {req.status}
                        </Badge>
                        </TableCell>
                         <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); copyLink(req.link); }}>
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy Link</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
          {recentRequests.length > 0 && (
            <CardFooter>
                <Button variant="outline" className="w-full">
                View All Requests
                </Button>
            </CardFooter>
           )}
        </Card>
      </div>

      {/* QR Code Dialog */}
      {generatedLink && (
        <QRCodeDialog
          isOpen={showQRCode}
          setIsOpen={setShowQRCode}
          url={generatedLink}
          title="Payment Link QR Code"
        />
      )}
    </div>
  );
}

export default function RequestPaymentPageContent() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'payment-link';
  const create = searchParams.get('create');
  
  const [activeTab, setActiveTab] = useState(tab);
  
  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);
  
  const [invoiceView, setInvoiceView] = useState(create === 'true' ? 'create' : 'list');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const handleEditInvoice = (invoiceId: string) => {
    setEditingInvoiceId(invoiceId);
    setInvoiceView('create');
  };

  const handleCreateInvoice = () => {
    setEditingInvoiceId(null);
    setInvoiceView('create');
  };

  const handleBackToInvoiceList = () => {
    setEditingInvoiceId(null);
    setInvoiceView('list');
    // Also update URL to remove create=true if present
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('create');
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  };


  const renderInvoiceContent = () => {
    if (invoiceView === 'create') {
      return <CreateInvoicePage onBack={handleBackToInvoiceList} invoiceId={editingInvoiceId} />;
    }
    return <InvoiceTab onCreateClick={handleCreateInvoice} onEditClick={handleEditInvoice} />;
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Request Payment</h1>
        </div>

        <EnhancedTabs 
          defaultValue="payment-link" 
          className="w-full" 
          onValueChange={setActiveTab} 
          value={activeTab}
          tabs={[
            {
              value: 'payment-link',
              label: 'Payment Link',
              icon: LinkIcon,
              tooltip: 'Create shareable payment links for quick payments'
            },
            {
              value: 'invoice',
              label: 'Invoice',
              icon: FileText,
              tooltip: 'Create and manage professional invoices'
            },
            {
              value: 'recurring',
              label: 'Recurring',
              icon: Repeat,
              tooltip: 'Set up recurring payment requests'
            },
            {
              value: 'split-payment',
              label: 'Split Payment',
              icon: Users,
              tooltip: 'Split payments between multiple recipients'
            },
            {
              value: 'event-tickets',
              label: 'Event Tickets',
              icon: Ticket,
              tooltip: 'Sell tickets for events and manage attendees'
            },
            {
              value: 'donations',
              label: 'Donations',
              icon: Gift,
              tooltip: 'Create donation campaigns and collect contributions'
            }
          ]}
        >
          <div className="mb-6" />

          <TabsContent value="payment-link" className="animate-in fade-in-50">
             <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <PaymentLinkTab />
             </Suspense>
          </TabsContent>

          <TabsContent value="invoice" className="animate-in fade-in-50">
             <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                {renderInvoiceContent()}
             </Suspense>
            </TabsContent>

          <TabsContent value="recurring" className="animate-in fade-in-50">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <RecurringTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="split-payment" className="animate-in fade-in-50">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <SplitPaymentTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="event-tickets" className="animate-in fade-in-50">
             <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <EventTicketsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="donations" className="animate-in fade-in-50">
             <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DonationsTab />
            </Suspense>
          </TabsContent>

        </EnhancedTabs>
      </main>
    </DashboardLayout>
  );
}

    