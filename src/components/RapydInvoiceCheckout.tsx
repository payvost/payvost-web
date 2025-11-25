'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services';

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

interface RapydInvoiceCheckoutProps {
  invoiceId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  onPaymentSuccess?: () => void;
}

export function RapydInvoiceCheckout({
  invoiceId,
  amount,
  currency,
  customerEmail,
  customerName,
  onPaymentSuccess
}: RapydInvoiceCheckoutProps) {
  const { toast } = useToast();
  const [country, setCountry] = useState('US');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!country) return;
      
      setLoadingMethods(true);
      try {
        const response = await apiClient.get<{ ok: boolean; paymentMethods: PaymentMethod[] }>(
          `/api/rapyd/payment-methods?country=${country}`
        );
        
        if (response.ok && response.paymentMethods) {
          const activeMethods = response.paymentMethods.filter(
            (method) => method.status === 1 && 
            method.currencies.includes(currency)
          );
          setPaymentMethods(activeMethods);
        }
      } catch (error: any) {
        console.error('Failed to load payment methods:', error);
        toast({
          title: 'Failed to load payment methods',
          description: error.message || 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setLoadingMethods(false);
      }
    };
    loadPaymentMethods();
  }, [country, currency, toast]);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
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
          // Show instructions for manual payment methods
          toast({
            title: 'Payment Instructions',
            description: 'Please follow the instructions to complete payment.',
          });
          // You could show a modal with instructions here
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
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to create payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-detect country from currency (basic mapping)
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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Pay with Rapyd
        </CardTitle>
        <CardDescription>
          Select a payment method to complete your invoice payment. 900+ payment methods available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rapyd-country">Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="rapyd-country">
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
          <Label htmlFor="rapyd-payment-method">Payment Method</Label>
          {loadingMethods ? (
            <div className="flex items-center justify-center p-4 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading payment methods...</span>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="p-4 border rounded-md text-sm text-muted-foreground text-center">
              No payment methods available for {currency} in {country}
            </div>
          ) : (
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger id="rapyd-payment-method">
                <SelectValue placeholder="Select payment method" />
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
                      {method.category && (
                        <span className="text-xs text-muted-foreground">({method.category})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handlePayment}
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
              Pay {currency} {amount.toFixed(2)}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Rapyd. Supports cards, bank transfers, mobile money, and more.
        </p>
      </CardContent>
    </Card>
  );
}

