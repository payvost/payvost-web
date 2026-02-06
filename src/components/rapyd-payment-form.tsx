'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CreditCard } from 'lucide-react';
import { externalTransactionService, walletService, apiClient } from '@/services';

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

type WalletAccount = {
  id?: string;
  currency: string;
  balance?: number | string;
};

type ExternalTransaction = {
  id: string;
};

type ProviderPayment = {
  id?: string;
  status?: string;
  redirect_url?: string;
  payment_method_data?: { redirect_url?: string };
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function RapydPaymentForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);

  // Load wallets
  useEffect(() => {
    const loadWallets = async () => {
      try {
        const accounts = await walletService.getAccounts();
        setWallets(accounts);
        // Set default currency from first wallet
        if (accounts.length > 0 && !currency) {
          setCurrency(accounts[0].currency);
        }
      } catch (error) {
        console.error('Failed to load wallets:', error);
      }
    };
    loadWallets();
  }, []);

  // Load payment methods when country changes
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!country) return;
      
      setLoadingMethods(true);
      try {
        const response = await apiClient.get<{ ok: boolean; paymentMethods: PaymentMethod[] }>(
          `/api/rapyd/payment-methods?country=${country}`
        );
        
        if (response.ok && response.paymentMethods) {
          // Filter active payment methods and those supporting the selected currency
          const activeMethods = response.paymentMethods.filter(
            (method) => method.status === 1 && 
            (!currency || method.currencies.includes(currency))
          );
          setPaymentMethods(activeMethods);
        }
      } catch (error: unknown) {
        console.error('Failed to load payment methods:', error);
        toast({
          title: 'Failed to load payment methods',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
      } finally {
        setLoadingMethods(false);
      }
    };

    loadPaymentMethods();
  }, [country, currency]);

  const handleCreatePayment = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a payment',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    let transactionRecord: ExternalTransaction | null = null;
    let accountId: string | null = null;

    try {
      // Get user's wallet for the currency
      const matchingAccount = wallets.find((acc) => acc.currency === currency);
      if (matchingAccount) {
        accountId = matchingAccount.id;
      }

      const paymentAmount = parseFloat(amount);

      // Create external transaction record
      const createResponse = await externalTransactionService.create({
        userId: user.uid,
        accountId: accountId || undefined,
        provider: 'RAPYD',
        type: 'PAYMENT',
        amount: paymentAmount,
        currency,
        recipientDetails: {
          paymentMethod: selectedPaymentMethod,
          country,
        },
        metadata: {
          timestamp: Date.now(),
        },
      }) as { transaction: ExternalTransaction };

      transactionRecord = createResponse.transaction;

      // Create payment via payment provider API
      const paymentResponse = await apiClient.post<{ ok: boolean; payment?: ProviderPayment; error?: string }>(
        '/api/rapyd/payments/create',
        {
          amount: paymentAmount,
          currency,
          payment_method: selectedPaymentMethod,
          description: `Payment of ${paymentAmount} ${currency}`,
          metadata: {
            transactionId: transactionRecord.id,
            userId: user.uid,
          },
          complete_payment_url: `${window.location.origin}/dashboard/payments?status=success`,
          error_payment_url: `${window.location.origin}/dashboard/payments?status=error`,
        }
      );

      if (!paymentResponse.ok || !paymentResponse.payment) {
        throw new Error(paymentResponse.error || 'Failed to create payment');
      }

      const payment = paymentResponse.payment;

      // Update transaction with provider transaction ID
      if (payment.id) {
        await externalTransactionService.update(transactionRecord.id, {
          providerTransactionId: payment.id,
          status: payment.status === 'CLO' ? 'COMPLETED' : 'PROCESSING',
        });
      }

      // Redirect to payment page if redirect URL is provided
      if (payment.redirect_url) {
        window.location.href = payment.redirect_url;
      } else if (payment.payment_method_data?.redirect_url) {
        window.location.href = payment.payment_method_data.redirect_url;
      } else {
        toast({
          title: 'Payment Created',
          description: `Payment ID: ${payment.id}. Please complete the payment using the provided instructions.`,
        });
      }
    } catch (error: unknown) {
      console.error('Payment creation error:', error);
      
      // Update transaction status to failed
      if (transactionRecord) {
        try {
          await externalTransactionService.update(transactionRecord.id, {
            status: 'FAILED',
            errorMessage: getErrorMessage(error),
          });
        } catch (updateError: unknown) {
          console.error('Failed to update transaction:', updateError);
        }
      }

      toast({
        title: 'Payment Failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Create payment
        </CardTitle>
        <CardDescription>
          Accept payments from customers worldwide using local methods.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.currency} value={wallet.currency}>
                    {wallet.currency} {wallet.balance ? `(${wallet.balance})` : ''}
                  </SelectItem>
                ))}
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="NGN">NGN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          {loadingMethods ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading payment methods...</span>
            </div>
          ) : (
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.length === 0 ? (
                  <SelectItem value="" disabled>
                    No payment methods available
                  </SelectItem>
                ) : (
                  paymentMethods.map((method) => (
                    <SelectItem key={method.type} value={method.type}>
                      <div className="flex items-center gap-2">
                        {method.image && (
                          <img 
                            src={method.image} 
                            alt={method.name} 
                            className="w-5 h-5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{method.name}</span>
                        <span className="text-xs text-muted-foreground">({method.category})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handleCreatePayment}
          disabled={isCreating || !amount || !selectedPaymentMethod || loadingMethods}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Create Payment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

