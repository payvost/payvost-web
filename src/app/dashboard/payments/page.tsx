
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTabs } from '@/components/enhanced-tabs';
import { ArrowRightLeft, Landmark, Upload, Calendar, Users, Gift, Smartphone, Zap, FileText, Tv, ChevronDown, CreditCard } from 'lucide-react';
import { Payvost } from '@/components/Payvost';
import { Beneficiaries } from '@/components/beneficiaries';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaymentConfirmationDialog } from '@/components/payment-confirmation-dialog';
import { reloadlyService, type Biller, type GiftCardProduct, externalTransactionService, walletService } from '@/services';
import { useToast } from '@/hooks/use-toast';

const billerData: Record<string, any> = {
  NGA: {
    currency: 'NGN',
    flag: 'NG',
    categories: [
      { value: 'airtime', label: 'Airtime', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['MTN', 'Airtel', 'Glo', '9mobile'] },
      { value: 'data', label: 'Data', icon: <FileText className="h-5 w-5 mr-2" />, providers: ['MTN', 'Airtel', 'Spectranet'] },
      { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Ikeja Electric (IKEDC)', 'Eko Electric (EKEDC)'] },
      { value: 'cable', label: 'Cable TV', icon: <Tv className="h-5 w-5 mr-2" />, providers: ['DSTV', 'GOtv'] },
    ]
  },
  USA: {
    currency: 'USD',
    flag: 'US',
    categories: [
      { value: 'utilities', label: 'Utilities', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Con Edison', 'PG&E', 'Florida Power & Light'] },
      { value: 'phone', label: 'Phone Bill', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['AT&T', 'Verizon', 'T-Mobile'] },
      { value: 'cable', label: 'Cable & Internet', icon: <Tv className="h-5 w-5 mr-2" />, providers: ['Comcast Xfinity', 'Spectrum', 'Cox'] },
    ]
  },
  GBR: {
      currency: 'GBP',
      flag: 'GB',
      categories: [
          { value: 'energy', label: 'Energy', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['British Gas', 'EDF Energy', 'ScottishPower'] },
          { value: 'mobile', label: 'Mobile Top-up', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['EE', 'O2', 'Vodafone'] },
          { value: 'council_tax', label: 'Council Tax', icon: <Landmark className="h-5 w-5 mr-2" />, providers: [] },
      ]
  }
};

const VALID_TABS = ['remittances', 'bill-payment', 'bulk-transfer', 'scheduled', 'split-payment', 'gift-cards'] as const;

function PaymentsPageContent() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | undefined>();
  
  // Tab state management
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl as any) ? tabFromUrl : 'remittances';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`/dashboard/payments?${params.toString()}`, { scroll: false });
  };
  
  // Sync with URL on mount or when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as any) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);
  
  // Bill payment state
  const [billCountry, setBillCountry] = useState('NGA'); // Default to Nigeria, can be dynamic
  const [billCategory, setBillCategory] = useState('');
  const [billProvider, setBillProvider] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Reloadly integration state
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [giftCardProducts, setGiftCardProducts] = useState<GiftCardProduct[]>([]);
  const [loadingBillers, setLoadingBillers] = useState(false);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  
  const currentBillerData = billerData[billCountry];
  const providers = currentBillerData.categories.find((c:any) => c.value === billCategory)?.providers || [];

  // Load billers from Reloadly when component mounts or country changes
  useEffect(() => {
    const loadBillers = async () => {
      if (!billCountry) return;
      
      setLoadingBillers(true);
      try {
        // Map country codes to Reloadly country codes
        const countryCodeMap: Record<string, string> = {
          'NGA': 'NG',
          'USA': 'US',
          'GBR': 'GB',
        };
        
        const reloadlyCountryCode = countryCodeMap[billCountry] || billCountry;
        const fetchedBillers = await reloadlyService.getBillersByCountry(reloadlyCountryCode);
        // Defensive check: ensure billers is an array
        const billersArray = Array.isArray(fetchedBillers) ? fetchedBillers : [];
        setBillers(billersArray);
      } catch (error) {
        console.error('Failed to load billers:', error);
        // Fall back to hardcoded data if Reloadly fails
        setBillers([]);
      } finally {
        setLoadingBillers(false);
      }
    };

    loadBillers();
  }, [billCountry]);

  // Load gift cards when gift cards tab is active
  useEffect(() => {
    const loadGiftCards = async () => {
      setLoadingGiftCards(true);
      try {
        const products = await reloadlyService.getGiftCardProducts();
        // Defensive check: ensure products is an array
        const productsArray = Array.isArray(products) ? products : [];
        setGiftCardProducts(productsArray.slice(0, 12)); // Show first 12
      } catch (error) {
        console.error('Failed to load gift cards:', error);
        toast({
          title: 'Failed to load gift cards',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setLoadingGiftCards(false);
      }
    };

    // Only load once
    if (giftCardProducts.length === 0) {
      loadGiftCards();
    }
  }, []);

  const handleBillPayment = async () => {
    if (!selectedBiller || !accountNumber || !billAmount || !user) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    let transactionRecord: any = null;
    let accountId: string | null = null;
    let balanceDeducted = false;
    
    try {
      // Get user's accounts to find matching currency account
      const accounts = await walletService.getAccounts();
      const matchingAccount = accounts.find(acc => acc.currency === currentBillerData.currency);
      
      if (!matchingAccount) {
        throw new Error(`No ${currentBillerData.currency} wallet found. Please create one first.`);
      }

      const paymentAmount = parseFloat(billAmount);
      
      // Check balance
      if (matchingAccount.balance < paymentAmount) {
        throw new Error(`Insufficient balance. You have ${matchingAccount.balance} ${currentBillerData.currency}, but need ${paymentAmount} ${currentBillerData.currency}.`);
      }

      accountId = matchingAccount.id;

      // Create custom identifier with user info for webhook tracking
      const customIdentifier = `bill-${user.uid}-${accountId}-${Date.now()}`;
      
      // Record the transaction in our database first
      const createResponse = await externalTransactionService.create({
        userId: user.uid,
        accountId: accountId,
        provider: 'RELOADLY',
        type: 'BILL_PAYMENT',
        amount: paymentAmount,
        currency: currentBillerData.currency,
        recipientDetails: {
          billerName: selectedBiller.name,
          billerId: selectedBiller.id,
          accountNumber: accountNumber,
        },
        metadata: {
          customIdentifier,
          billerType: billCategory,
        },
      }) as { transaction: any };

      transactionRecord = createResponse.transaction;

      // Deduct balance from wallet BEFORE calling Reloadly
      await walletService.deductBalance({
        accountId: accountId,
        amount: paymentAmount,
        currency: currentBillerData.currency,
        description: `Bill payment to ${selectedBiller.name}`,
        referenceId: transactionRecord.id,
      });
      balanceDeducted = true;

      // Make the actual bill payment via Reloadly
      const result = await reloadlyService.payBill({
        billerId: selectedBiller.id,
        subscriberAccountNumber: accountNumber,
        amount: paymentAmount,
        customIdentifier,
      });

      // Update transaction with provider ID
      if (transactionRecord?.id && result.transactionId) {
        await externalTransactionService.update(transactionRecord.id, {
          providerTransactionId: result.transactionId.toString(),
          status: result.deliveryStatus === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
        });
      }

      toast({
        title: 'Payment Successful',
        description: `Bill payment of ${billAmount} ${currentBillerData.currency} completed successfully`,
      });

      // Clear form
      setBillProvider('');
      setBillAmount('');
      setAccountNumber('');
      setSelectedBiller(null);
    } catch (error) {
      console.error('Bill payment failed:', error);
      
      // If balance was deducted but Reloadly call failed, refund the user
      if (balanceDeducted && accountId) {
        try {
          await walletService.refundBalance({
            accountId: accountId,
            amount: parseFloat(billAmount),
            currency: currentBillerData.currency,
            description: `Refund for failed bill payment`,
            referenceId: transactionRecord?.id || undefined,
          });
          console.log('Balance refunded due to failed payment');
        } catch (refundError) {
          console.error('Failed to refund balance:', refundError);
          // Log this for manual review
        }
      }
      
      // Update transaction status to failed if we created a record
      if (transactionRecord?.id) {
        await externalTransactionService.update(transactionRecord.id, {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const billPaymentDetails = {
    sendAmount: billAmount || "0.00",
    sendCurrency: currentBillerData.currency,
    recipientGets: billAmount || "0.00",
    recipientCurrency: currentBillerData.currency,
    recipientName: billProvider || "Bill Payment",
    exchangeRate: 'N/A',
    fee: '$0.00'
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Payments</h1>
        </div>
        <EnhancedTabs 
          value={activeTab}
          onValueChange={handleTabChange}
          tabs={[
            {
              value: 'remittances',
              label: 'Remittances',
              icon: ArrowRightLeft,
              tooltip: 'Send money internationally to friends and family'
            },
            {
              value: 'bill-payment',
              label: 'Bill Payment',
              icon: FileText,
              tooltip: 'Pay utility bills and services'
            },
            {
              value: 'bulk-transfer',
              label: 'Bulk Transfer',
              icon: Upload,
              tooltip: 'Send money to multiple recipients at once'
            },
            {
              value: 'scheduled',
              label: 'Scheduled',
              icon: Calendar,
              tooltip: 'View and manage scheduled payments'
            },
            {
              value: 'split-payment',
              label: 'Split Payment',
              icon: Users,
              tooltip: 'Split payments between multiple people'
            },
            {
              value: 'gift-cards',
              label: 'Gift Cards',
              icon: Gift,
              tooltip: 'Purchase and manage gift cards'
            }
          ]}
        >

          <TabsContent value="remittances" className="animate-in fade-in-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Payvost initialBeneficiaryId={selectedBeneficiaryId} />
                </div>
                <div className="lg:col-span-1">
                    <Beneficiaries 
                      onSelectBeneficiary={(id) => {
                        setSelectedBeneficiaryId(id);
                      }}
                    />
                </div>
            </div>
          </TabsContent>

          <TabsContent value="bill-payment" className="animate-in fade-in-50">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Bill Payment</CardTitle>
                        <CardDescription>Pay for airtime, data, electricity, and more.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Image src={`/flag/${currentBillerData.flag}.png`} alt={billCountry} width={20} height={20} className="rounded-full object-cover" />
                                <span>{billCountry}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.keys(billerData).map(countryCode => (
                                <DropdownMenuItem key={countryCode} onSelect={() => {setBillCountry(countryCode); setBillCategory('')}}>
                                    <Image src={`/flag/${billerData[countryCode].flag}.png`} alt={countryCode} width={20} height={20} className="rounded-full object-cover mr-2" />
                                    <span>{countryCode}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="bill-category">Select Category</Label>
                    <Select onValueChange={setBillCategory} value={billCategory}>
                        <SelectTrigger id="bill-category">
                            <SelectValue placeholder="Select a bill category" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentBillerData.categories.map((cat:any) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center">{cat.icon}{cat.label}</div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="provider">Provider/Biller</Label>
                    <Select 
                      disabled={loadingBillers || billers.length === 0} 
                      onValueChange={(value) => {
                        setBillProvider(value);
                        const biller = billers.find(b => b.id.toString() === value);
                        setSelectedBiller(biller || null);
                      }}
                      value={billProvider}
                    >
                        <SelectTrigger id="provider">
                            <SelectValue placeholder={loadingBillers ? "Loading billers..." : billers.length > 0 ? "Select a biller" : "No billers available"} />
                        </SelectTrigger>
                        <SelectContent>
                            {billers.map((biller) => (
                              <SelectItem key={biller.id} value={biller.id.toString()}>
                                {biller.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-number">Account/Meter Number</Label>
                    <Input 
                      id="account-number" 
                      placeholder="Enter account or meter number" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currentBillerData.currency})</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="Enter amount" 
                      value={billAmount} 
                      onChange={(e) => setBillAmount(e.target.value)} 
                    />
                    {selectedBiller && (
                      <p className="text-sm text-muted-foreground">
                        Min: {selectedBiller.localMinAmount} {selectedBiller.localTransactionFeeCurrencyCode} | 
                        Max: {selectedBiller.localMaxAmount} {selectedBiller.localTransactionFeeCurrencyCode}
                      </p>
                    )}
                </div>
              </CardContent>
              <CardFooter>
                 <PaymentConfirmationDialog
                  onConfirm={handleBillPayment}
                  transactionDetails={billPaymentDetails}
                  isLoading={isLoading}
                >
                  <Button disabled={isLoading}>Pay Bill</Button>
                </PaymentConfirmationDialog>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-transfer" className="animate-in fade-in-50">
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

          <TabsContent value="scheduled" className="animate-in fade-in-50">
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

          <TabsContent value="split-payment" className="animate-in fade-in-50">
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

          <TabsContent value="gift-cards" className="animate-in fade-in-50">
            <Card>
              <CardHeader>
                <CardTitle>Gift Cards</CardTitle>
                <CardDescription>Purchase and send gift cards from popular brands.</CardDescription>
              </CardHeader>
              <CardContent>
                 {loadingGiftCards ? (
                   <div className="text-center py-12">
                     <p className="text-muted-foreground">Loading gift cards...</p>
                   </div>
                 ) : giftCardProducts.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {giftCardProducts.map((product) => (
                          <Card key={product.productId} className="flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary transition-colors">
                              {product.logoUrls && product.logoUrls.length > 0 ? (
                                <img src={product.logoUrls[0]} alt={product.productName} className="h-16 w-auto object-contain rounded-md" />
                              ) : (
                                <div className="h-16 w-20 bg-muted rounded-md flex items-center justify-center">
                                  <Gift className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <p className="mt-2 text-sm font-semibold text-center">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">{product.countryCode}</p>
                          </Card>
                      ))}
                   </div>
                 ) : (
                   <div className="text-center py-12">
                     <p className="text-muted-foreground">No gift cards available at the moment.</p>
                   </div>
                 )}
              </CardContent>
            </Card>
          </TabsContent>

        </EnhancedTabs>
      </main>
    </DashboardLayout>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout language="en" setLanguage={() => {}}>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Payments</h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </DashboardLayout>
    }>
      <PaymentsPageContent />
    </Suspense>
  );
}
