'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Wallet, Building2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/services';
import { walletService, type Account } from '@/services/walletService';

interface PaymentMethod {
  type: string;
  name: string;
  category: string;
  image: string;
  country: string;
  payment_flow_type: string;
  currencies: string[];
  status: number;
}

interface InvoicePaymentOptionsProps {
  invoiceId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  onPaymentSuccess?: () => void;
}

export function InvoicePaymentOptions({
  invoiceId,
  amount,
  currency,
  customerEmail,
  customerName,
  onPaymentSuccess
}: InvoicePaymentOptionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [country, setCountry] = useState('US');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'payvost' | 'card' | 'bank' | ''>('');

  // Check if user has account in invoice currency
  const hasAccountInCurrency = userAccounts.some(acc => acc.currency === currency);

  // Load user accounts if logged in
  useEffect(() => {
    const loadUserAccounts = async () => {
      if (!user) {
        setUserAccounts([]);
        return;
      }

      setLoadingAccounts(true);
      try {
        const accounts = await walletService.getAccounts();
        setUserAccounts(accounts);
      } catch (error: any) {
        console.error('Failed to load user accounts:', error);
        // Don't show error toast, just silently fail
        setUserAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadUserAccounts();
  }, [user]);

  // Load payment methods for card payment
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!country || selectedPaymentOption !== 'card') return;
      
      setLoadingMethods(true);
      try {
        // Use skipAuth for public invoice pages
        const response = await apiClient.get<{ ok: boolean; paymentMethods: PaymentMethod[] }>(
          `/api/rapyd/payment-methods?country=${country}`,
          { skipAuth: true }
        );
        
        if (response.ok && response.paymentMethods) {
          // Filter for card payment methods only
          const cardMethods = response.paymentMethods.filter(
            (method) => method.status === 1 && 
            method.currencies.includes(currency) &&
            (method.category?.toLowerCase().includes('card') || 
             method.type?.toLowerCase().includes('card') ||
             method.name?.toLowerCase().includes('card'))
          );
          setPaymentMethods(cardMethods);
        }
      } catch (error: any) {
        console.error('Failed to load payment methods:', error);
        // Don't show error toast for public access - just log it
        if (user) {
          toast({
            title: 'Failed to load payment methods',
            description: error.message || 'Please try again later',
            variant: 'destructive',
          });
        }
      } finally {
        setLoadingMethods(false);
      }
    };
    
    if (selectedPaymentOption === 'card') {
      loadPaymentMethods();
    }
  }, [country, currency, selectedPaymentOption, user, toast]);

  // Auto-detect country from currency
  useEffect(() => {
    const currencyToCountry: { [key: string]: string } = {
      'USD': 'US',
      'GBP': 'GB',
      'EUR': 'DE',
      'NGN': 'NG',
      'CAD': 'CA',
      'AUD': 'AU',
    };
    if (currencyToCountry[currency] && !country) {
      setCountry(currencyToCountry[currency]);
    }
  }, [currency]);

  const handlePayWithPayvost = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to use Payvost wallet payment',
        variant: 'destructive',
      });
      router.push(`/login?redirect=/invoice/${invoiceId}`);
      return;
    }

    // Redirect to dashboard payment page with invoice ID
    router.push(`/dashboard/payments?invoiceId=${invoiceId}&amount=${amount}&currency=${currency}`);
  };

  const handleCardPayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is logged in for card payments
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to complete card payment',
        variant: 'destructive',
      });
      router.push(`/login?redirect=/invoice/${invoiceId}`);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.post<{ ok: boolean; payment: any }>(
        '/api/rapyd/payments/create',
        {
          amount,
          currency,
          payment_method: selectedPaymentMethod,
          description: `Invoice payment - ${invoiceId}`,
          metadata: {
            invoiceId,
            type: 'invoice_payment',
            customerEmail,
            customerName,
          },
          complete_payment_url: `${window.location.origin}/invoice/${invoiceId}?payment=success`,
          error_payment_url: `${window.location.origin}/invoice/${invoiceId}?payment=error`,
        }
      );

      if (response.ok && response.payment) {
        const payment = response.payment;
        
        // Redirect to payment page if redirect URL is provided
        if (payment.redirect_url) {
          window.location.href = payment.redirect_url;
        } else if (payment.payment_method_data?.redirect_url) {
          window.location.href = payment.payment_method_data.redirect_url;
        } else if (payment.instructions) {
          toast({
            title: 'Payment Instructions',
            description: 'Please follow the instructions to complete payment.',
          });
        } else {
          toast({
            title: 'Payment Created',
            description: `Payment ID: ${payment.id}. Please complete the payment using the provided instructions.`,
          });
        }
      } else {
        throw new Error(response.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        toast({
          title: 'Login Required',
          description: 'Please log in to complete payment',
          variant: 'destructive',
        });
        router.push(`/login?redirect=/invoice/${invoiceId}`);
      } else {
        toast({
          title: 'Payment Failed',
          description: error.message || 'Failed to create payment. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to use bank transfer',
        variant: 'destructive',
      });
      router.push(`/login?redirect=/invoice/${invoiceId}`);
      return;
    }

    // Find the account in the invoice currency
    const account = userAccounts.find(acc => acc.currency === currency);
    if (!account) {
      toast({
        title: 'Account Not Found',
        description: `You don't have a ${currency} account. Please create one first.`,
        variant: 'destructive',
      });
      return;
    }

    // Redirect to dashboard payment page for bank transfer
    router.push(`/dashboard/payments?invoiceId=${invoiceId}&amount=${amount}&currency=${currency}&method=bank`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Select Payment Method
        </CardTitle>
        <CardDescription>
          Choose how you would like to pay this invoice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Option Selection */}
        <div className="space-y-3">
          {/* Pay with Payvost Option */}
          {user && (
            <Button
              variant={selectedPaymentOption === 'payvost' ? 'default' : 'outline'}
              className="w-full justify-start h-auto py-4"
              onClick={() => setSelectedPaymentOption('payvost')}
            >
              <div className="flex items-center gap-3 w-full">
                <Wallet className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Pay with Payvost</div>
                  <div className="text-sm text-muted-foreground">Use your Payvost wallet balance</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          )}

          {/* Card Payment Option */}
          <Button
            variant={selectedPaymentOption === 'card' ? 'default' : 'outline'}
            className="w-full justify-start h-auto py-4"
            onClick={() => setSelectedPaymentOption('card')}
          >
            <div className="flex items-center gap-3 w-full">
              <CreditCard className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-semibold">Debit or Credit Card</div>
                <div className="text-sm text-muted-foreground">Pay with your card securely</div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>

          {/* Bank Transfer Option - Only if user has account in currency */}
          {hasAccountInCurrency && (
            <Button
              variant={selectedPaymentOption === 'bank' ? 'default' : 'outline'}
              className="w-full justify-start h-auto py-4"
              onClick={() => setSelectedPaymentOption('bank')}
            >
              <div className="flex items-center gap-3 w-full">
                <Building2 className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Bank Transfer</div>
                  <div className="text-sm text-muted-foreground">Transfer from your {currency} account</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          )}
        </div>

        {/* Payment Form Based on Selection */}
        {selectedPaymentOption === 'payvost' && (
          <div className="pt-4 border-t">
            <Button
              onClick={handlePayWithPayvost}
              className="w-full"
              size="lg"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {selectedPaymentOption === 'card' && (
          <div className="pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="NG">Nigeria</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="KE">Kenya</SelectItem>
                  <SelectItem value="ZA">South Africa</SelectItem>
                  <SelectItem value="GH">Ghana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Card Type</Label>
              {loadingMethods ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading payment methods...</span>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-4 border rounded-md text-sm text-muted-foreground text-center">
                  No card payment methods available for {currency} in {country}
                </div>
              ) : (
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.type} value={method.type}>
                        <div className="flex items-center gap-2">
                          {method.image && (
                            <img 
                              src={method.image} 
                              alt={method.name} 
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span>{method.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button
              onClick={handleCardPayment}
              disabled={isProcessing || !selectedPaymentMethod || loadingMethods || paymentMethods.length === 0}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(amount, currency)}
                </>
              )}
            </Button>
          </div>
        )}

        {selectedPaymentOption === 'bank' && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleBankTransfer}
              className="w-full"
              size="lg"
              disabled={loadingAccounts}
            >
              {loadingAccounts ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Continue to Bank Transfer
                </>
              )}
            </Button>
          </div>
        )}

        {!selectedPaymentOption && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            Please select a payment method above
          </p>
        )}

        <p className="text-xs text-center text-muted-foreground pt-2">
          Secure payment processing. Supports cards, bank transfers, and more.
        </p>
      </CardContent>
    </Card>
  );
}

