
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, Landmark, Upload, Calendar, Users, Gift, Smartphone, Zap, FileText } from 'lucide-react';
import { QuickRemit } from '@/components/quick-remit';
import { Beneficiaries } from '@/components/beneficiaries';

const billCategories = [
    { value: 'airtime', label: 'Airtime', icon: <Smartphone className="h-5 w-5 mr-2" /> },
    { value: 'data', label: 'Data', icon: <FileText className="h-5 w-5 mr-2" /> },
    { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" /> },
];

export default function PaymentsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Payments</h1>
        </div>
        <Tabs defaultValue="remittances">
          <TabsList>
            <TabsTrigger value="remittances"><ArrowRightLeft className="mr-2 h-4 w-4"/>Remittances</TabsTrigger>
            <TabsTrigger value="bill-payment"><FileText className="mr-2 h-4 w-4"/>Bill Payment</TabsTrigger>
            <TabsTrigger value="bulk-transfer"><Upload className="mr-2 h-4 w-4"/>Bulk Transfer</TabsTrigger>
            <TabsTrigger value="scheduled"><Calendar className="mr-2 h-4 w-4"/>Scheduled</TabsTrigger>
            <TabsTrigger value="split-payment"><Users className="mr-2 h-4 w-4"/>Split Payment</TabsTrigger>
            <TabsTrigger value="gift-cards"><Gift className="mr-2 h-4 w-4"/>Gift Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="remittances">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <QuickRemit />
                </div>
                <div className="lg:col-span-1">
                    <Beneficiaries />
                </div>
            </div>
          </TabsContent>

          <TabsContent value="bill-payment">
            <Card>
              <CardHeader>
                <CardTitle>Bill Payment</CardTitle>
                <CardDescription>Pay for airtime, data, electricity, and more.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="bill-category">Select Category</Label>
                    <Select>
                        <SelectTrigger id="bill-category">
                            <SelectValue placeholder="Select a bill category" />
                        </SelectTrigger>
                        <SelectContent>
                            {billCategories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center">{cat.icon}{cat.label}</div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="provider">Provider/Biller</Label>
                    <Input id="provider" placeholder="e.g. MTN, Ikeja Electric" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-number">Account/Meter Number</Label>
                    <Input id="account-number" placeholder="Enter account or meter number" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" placeholder="Enter amount" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Pay Bill</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-transfer">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Transfer</CardTitle>
                <CardDescription>Send money to multiple recipients at once by uploading a file.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Drag and drop your CSV file here or click to upload.</p>
                    <Button variant="outline" className="mt-4">
                        Upload File
                    </Button>
                </div>
                 <div className="text-sm text-muted-foreground">
                    <p>Supported file format: CSV.</p>
                    <p>Columns: recipient_name, account_number, bank_code, amount</p>
                    <Button variant="link" className="p-0 h-auto">Download sample CSV</Button>
                 </div>
              </CardContent>
               <CardFooter>
                    <Button>Process Bulk Transfer</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Transfers</CardTitle>
                <CardDescription>Set up future-dated or recurring payments.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-12">You have no scheduled transfers.</p>
              </CardContent>
              <CardFooter>
                <Button>Schedule New Transfer</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="split-payment">
            <Card>
              <CardHeader>
                <CardTitle>Split Payment</CardTitle>
                <CardDescription>Divide a single payment among multiple people.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2">
                    <Label htmlFor="total-amount">Total Amount to Split</Label>
                    <Input id="total-amount" type="number" placeholder="Enter total amount" />
                </div>
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Add participants to split the bill.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Add Participant</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="gift-cards">
            <Card>
              <CardHeader>
                <CardTitle>Gift Cards</CardTitle>
                <CardDescription>Purchase and send gift cards from popular brands.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="flex flex-col items-center justify-center p-4">
                            <img src={`https://placehold.co/100x60.png`} data-ai-hint="gift card" alt="Brand Logo" className="rounded-md" />
                            <p className="mt-2 text-sm font-semibold">Brand {i}</p>
                        </Card>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </DashboardLayout>
  );
}
