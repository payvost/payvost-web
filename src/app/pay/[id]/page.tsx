'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lock, CheckCircle, Loader2, Globe, CreditCard, Shield, Badge as BadgeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeDialog } from '@/components/qr-code-dialog';

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [request, setRequest] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [payerEmail, setPayerEmail] = useState('');
  const [payerName, setPayerName] = useState('');
  const [country, setCountry] = useState('US');
  const [showQRCode, setShowQRCode] = useState(false);
  const { toast } = useToast();

  // Check for payment status from URL params
  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    if (!id) return;
    
    // Real-time listener for payment link updates
    const unsubscribe = onSnapshot(doc(db, "paymentRequests", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'Active') {
          setRequest({ id: docSnap.id, ...data });
        } else {
          setRequest(null);
        }
      } else {
        setRequest(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    // Handle payment status redirects
    if (paymentStatus === 'success') {
      toast({
        title: 'Payment Successful!',
        description: 'Your payment has been processed successfully.',
      });
    } else if (paymentStatus === 'error') {
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled.',
      });
    }
  }, [paymentStatus, toast]);

  const handleCreateCheckout = async () => {
    if (!request) return;
    
    // Validate email for reusable links
    if (request.linkType === 'reusable' && !payerEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to continue.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingCheckout(true);
    try {
      const response = await apiClient.post<{
        ok: boolean;
        checkout?: any;
        checkoutUrl?: string;
        error?: string;
      }>(`/api/payment-links/${id}/checkout`, {
        country,
        customerEmail: payerEmail || undefined,
        customerName: payerName || payerEmail || undefined,
      });

      if (response.ok && response.checkoutUrl) {
        // Redirect to Rapyd checkout page (but it will be in an iframe or new window)
        // For better UX, we can open in same window
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error(response.error || 'Failed to create checkout');
      }
    } catch (error: any) {
      console.error('Checkout creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingCheckout(false);
    }
  };

  const formatCurrencyDisplay = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-12 w-full" />
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-center p-4">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <h1 className="text-3xl font-bold">Payment Link Not Found</h1>
            <p className="text-muted-foreground">
              This payment link is invalid or has been deactivated.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const displayAmount = request.currency && request.numericAmount
    ? formatCurrencyDisplay(request.numericAmount, request.currency)
    : request.amount;

  // Check if link has been used (for one-time links)
  const isUsed = request.linkType === 'one-time' && request.used;
  const paymentLinkUrl = `${window.location.origin}/pay/${id}`;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-xs">
                {request.linkType === 'reusable' ? 'Reusable Link' : 'One-Time Payment'}
              </Badge>
            </div>
            <CardTitle className="text-3xl">Payment Request</CardTitle>
            <CardDescription className="text-base">{request.description}</CardDescription>
            <div className="pt-4">
              <p className="text-5xl font-bold">{displayAmount}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {request.currency} • {request.linkType === 'reusable' ? 'Can be used multiple times' : 'Single use only'}
              </p>
            </div>
          </CardHeader>

          {isUsed ? (
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Link Already Used</h3>
                <p className="text-muted-foreground">
                  This one-time payment link has already been used.
                </p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Country
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {request.linkType === 'reusable' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your payment is processed securely with industry-standard encryption. Multiple payment methods available.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCreateCheckout}
                  disabled={creatingCheckout || (request.linkType === 'reusable' && !payerEmail)}
                >
                  {creatingCheckout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {displayAmount}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to a secure payment page with multiple payment options.
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </main>

      {/* QR Code Dialog */}
      <QRCodeDialog
        isOpen={showQRCode}
        setIsOpen={setShowQRCode}
        url={paymentLinkUrl}
        title="Payment Link QR Code"
      />
    </div>
  );
}
