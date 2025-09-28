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
import { Copy, QrCode, Link as LinkIcon, FileText, Repeat, Users, Ticket, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceTab } from '@/components/invoice-tab';
import { CreateInvoicePage } from '@/components/create-invoice-page';
import { RecurringTab } from '@/components/recurring-tab';
import { SplitPaymentTab } from '@/components/split-payment-tab';
import { EventTicketsTab } from '@/components/event-tickets-tab';
import { DonationsTab } from '@/components/donations-tab';

// Firebase
import { auth, db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function PaymentLinkTab() {
  const [generatedLink, setGeneratedLink] = useState('');
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const { toast } = useToast();

  const userId = auth.currentUser?.uid;

  // Fetch requests from Firestore (only current user)
  useEffect(() => {
    const fetchRequests = async () => {
      if (!userId) return;
      try {
        const q = query(
          collection(db, 'paymentRequests'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecentRequests(data);
      } catch (err) {
        console.error('Error fetching requests:', err);
      }
    };

    fetchRequests();
  }, [userId]);

  // Handle creating a new request
  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a payment request.',
        variant: 'destructive',
      });
      return;
    }

    const form = e.currentTarget;
    const amount = (form as any).amount.value;
    const description = (form as any).description.value;
    const payerEmail = (form as any)['payer-email'].value;
    const currency = (form as any).currency.value;

    // Generate unique link
    const link = `https://qwibik.remit/pay/${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedLink(link);

    let bannerURL = null;

    // Upload banner if file selected
    if (bannerFile) {
      try {
        const storageRef = ref(storage, `payment_banners/${userId}/${Date.now()}_${bannerFile.name}`);
        await uploadBytes(storageRef, bannerFile);
        bannerURL = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Error uploading banner:', err);
        toast({
          title: 'Upload Error',
          description: 'Failed to upload banner image.',
          variant: 'destructive',
        });
      }
    }

    try {
      await addDoc(collection(db, 'paymentRequests'), {
        userId,
        to: payerEmail || 'No email (Link)',
        amount: `${currency} ${amount}`,
        description,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        link,
        bannerURL,
      });

      toast({
        title: 'Payment Link Generated!',
        description: 'You can now share the link with your payer.',
      });

      // Refresh requests
      const q = query(
        collection(db, 'paymentRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecentRequests(data);

      // Clear file input
      setBannerFile(null);
    } catch (err) {
      console.error('Error saving request:', err);
      toast({
        title: 'Error',
        description: 'Failed to save request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
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
              <div className="space-y-2">
                <Label htmlFor="banner">Banner (Optional)</Label>
                <Input
                  id="banner"
                  name="banner"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">Fees may apply.</p>
              <Button type="submit">
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
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium truncate">{req.to}</div>
                      <div className="text-sm text-muted-foreground">{req.date}</div>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Requests
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function RequestPaymentPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [activeTab, setActiveTab] = useState('payment-link');
  const [view, setView] = useState('list');

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
