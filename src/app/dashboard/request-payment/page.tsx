
'use client';

import { useState, useEffect } from 'react';
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
import { InvoiceTab } from '@/components/invoice-tab';
import { CreateInvoicePage } from '@/components/create-invoice-page';
import { RecurringTab } from '@/components/recurring-tab';
import { SplitPaymentTab } from '@/components/split-payment-tab';
import { EventTicketsTab } from '@/components/event-tickets-tab';
import { DonationsTab } from '@/components/donations-tab';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, arrayUnion, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { sendPaymentRequestEmail } from '@/services/emailService';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';


function PaymentLinkTab() {
  const { user, loading: authLoading } = useAuth();
  const [generatedLink, setGeneratedLink] = useState('');
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
        if (!authLoading) setLoadingRequests(false);
        return;
    }
    const q = query(
        collection(db, "paymentRequests"), 
        where("userId", "==", user.uid),
        limit(5)
    );
    const unsub = onSnapshot(q, (querySnapshot) => {
        const requests: any[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        // Sort on the client side
        requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setRecentRequests(requests);
        setLoadingRequests(false);
    });
    return () => unsub();
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
    const currency = (form as any).currency.value;

    const newRequestData = {
        to: payerEmail || 'No email (Link)',
        amount: `${currency} ${amount}`,
        description,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        userId: user.uid,
        numericAmount: parseFloat(amount),
        currency: currency,
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
                  <Input id="amount" name="amount" type="number" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-email">Payer's Email (Optional)</Label>
                <Input
                  id="payer-email"
                  name="payer-email"
                  type="email"
                  placeholder="Send an invoice directly to their email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">Fees may apply.</p>
              <Button type="submit" disabled={isSubmitting}>
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
              <Button variant="outline" size="icon">
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
                        <div className="text-sm text-muted-foreground">{new Date(req.createdAt.toDate()).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>{req.amount}</TableCell>
                        <TableCell className="text-right">
                        <Badge
                            variant={
                            req.status === 'Paid'
                                ? 'default'
                                : req.status === 'Pending'
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
    </div>
  );
}

export default function RequestPaymentPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'payment-link';
  
  const [activeTab, setActiveTab] = useState(tab);
  const [view, setView] = useState('list');

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const renderInvoiceContent = () => {
    if (view === 'create') {
      return <CreateInvoicePage onBack={() => setView('list')} />;
    }
    return <InvoiceTab onFabClick={() => setView('create')} />;
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Request Payment</h1>
        </div>

        <Tabs defaultValue="payment-link" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="payment-link">
              <LinkIcon className="mr-2 h-4 w-4" />
              Payment Link
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <Repeat className="mr-2 h-4 w-4" />
              Recurring
            </TabsTrigger>
            <TabsTrigger value="split-payment">
              <Users className="mr-2 h-4 w-4" />
              Split Payment
            </TabsTrigger>
            <TabsTrigger value="event-tickets">
              <Ticket className="mr-2 h-4 w-4" />
              Event Tickets
            </TabsTrigger>
            <TabsTrigger value="donations">
              <Gift className="mr-2 h-4 w-4" />
              Donations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment-link">
            <PaymentLinkTab />
          </TabsContent>

          <TabsContent value="invoice">{renderInvoiceContent()}</TabsContent>

          <TabsContent value="recurring">
            <RecurringTab />
          </TabsContent>

          <TabsContent value="split-payment">
            <SplitPaymentTab />
          </TabsContent>

          <TabsContent value="event-tickets">
            <EventTicketsTab />
          </TabsContent>

          <TabsContent value="donations">
            <DonationsTab />
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}
