
'use client';

import { useState } from 'react';
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
import CreateInvoicePage from '@/components/create-invoice-page';
import { RecurringTab } from '@/components/recurring-tab';
import { SplitPaymentTab } from '@/components/split-payment-tab';
import { EventTicketsTab } from '@/components/event-tickets-tab';
import { DonationsTab } from '@/components/donations-tab';


// Placeholder data for recent requests, can be adapted for each tab
const recentRequests = [
    { id: 'req_1', to: 'client@example.com', amount: '$500.00', status: 'Paid', date: '2024-07-22' },
    { id: 'req_2', to: 'customer@email.com', amount: '$1,200.00', status: 'Pending', date: '2024-07-21' },
    { id: 'req_3', to: 'john.doe@work.com', amount: '$75.50', status: 'Paid', date: '2024-07-20' },
    { id: 'req_4', to: 'No email (Link)', amount: '$250.00', status: 'Overdue', date: '2024-07-15' },
];

function PaymentLinkTab() {
  const [generatedLink, setGeneratedLink] = useState('');
  const { toast } = useToast();

  const handleCreateRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const link = `https://qwibik.remit/pay/${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedLink(link);
    toast({
        title: "Payment Link Generated!",
        description: "You can now share the link with your payer.",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
        title: "Copied to Clipboard!",
        description: "The payment link has been copied.",
    });
  };
    
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
            <form onSubmit={handleCreateRequest}>
                <Card>
                    <CardHeader>
                        <CardTitle>Create Payment Link</CardTitle>
                        <CardDescription>Generate a secure link to get paid by anyone, for anything.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Form fields from original page */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input id="amount" type="number" placeholder="0.00" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select defaultValue="USD">
                                    <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
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
                            <Input id="description" placeholder="e.g., Invoice #123, Graphic Design Services" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payer-email">Payer's Email (Optional)</Label>
                            <Input id="payer-email" type="email" placeholder="Send an invoice directly to their email" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <p className="text-sm text-muted-foreground">Fees may apply.</p>
                        <Button type="submit"><LinkIcon className="mr-2 h-4 w-4" />Create Payment Link</Button>
                    </CardFooter>
                </Card>
            </form>

            {generatedLink && (
                <Card className="mt-6">
                    <CardHeader><CardTitle>Your Payment Link is Ready!</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Input value={generatedLink} readOnly />
                        <Button variant="outline" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4"/></Button>
                        <Button variant="outline" size="icon"><QrCode className="h-4 w-4"/></Button>
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
                            {recentRequests.slice(0, 4).map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <div className="font-medium truncate">{req.to}</div>
                                    <div className="text-sm text-muted-foreground">{req.date}</div>
                                </TableCell>
                                <TableCell>{req.amount}</TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant={
                                            req.status === 'Paid' ? 'default' :
                                            req.status === 'Pending' ? 'secondary' : 'destructive'
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
                    <Button variant="outline" className="w-full">View All Requests</Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  )
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
            <TabsTrigger value="payment-link"><LinkIcon className="mr-2 h-4 w-4"/>Payment Link</TabsTrigger>
            <TabsTrigger value="invoice"><FileText className="mr-2 h-4 w-4"/>Invoice</TabsTrigger>
            <TabsTrigger value="recurring"><Repeat className="mr-2 h-4 w-4"/>Recurring</TabsTrigger>
            <TabsTrigger value="split-payment"><Users className="mr-2 h-4 w-4"/>Split Payment</TabsTrigger>
            <TabsTrigger value="event-tickets"><Ticket className="mr-2 h-4 w-4"/>Event Tickets</TabsTrigger>
            <TabsTrigger value="donations"><Gift className="mr-2 h-4 w-4"/>Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="payment-link">
            <PaymentLinkTab />
          </TabsContent>

          <TabsContent value="invoice">
            {renderInvoiceContent()}
          </TabsContent>

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
