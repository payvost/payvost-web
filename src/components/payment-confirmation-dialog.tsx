'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

interface PaymentConfirmationDialogProps {
  children: ReactNode;
  onConfirm: () => Promise<void> | void;
  transactionDetails: {
    sendAmount: string;
    sendCurrency: string;
    recipientGets: string;
    recipientCurrency: string;
    recipientName: string;
    exchangeRate: string;
    fee: string;
  };
  isLoading?: boolean;
}

export function PaymentConfirmationDialog({
  children,
  onConfirm,
  transactionDetails,
  isLoading,
}: PaymentConfirmationDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'review' | 'pin'>('review');
  const [isConfirming, setIsConfirming] = useState(false);
  const [pin, setPin] = useState('');
  const [userPin, setUserPin] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        setUserPin((snap.data() as any)?.transactionPin || null);
      }
    });
    return () => unsub();
  }, [user]);

  const feeAmount = parseFloat(String(transactionDetails.fee).replace('$', '')) || 0;
  const sendAmountNum = parseFloat(String(transactionDetails.sendAmount)) || 0;
  const totalDeducted = sendAmountNum + feeAmount;

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsConfirming(true);
    try {
      await onConfirm();
      toast({
        title: 'Submitted',
        description: `Your payment is being processed.`,
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Payment confirm failed:', error);
      toast({
        title: 'Failed',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const onDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setStep('review');
        setPin('');
      }, 200);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onDialogOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        {step === 'review' ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
              <AlertDialogDescription>Review the details before submitting.</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You pay:</span>
                <span className="font-semibold">
                  {transactionDetails.sendAmount} {transactionDetails.sendCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-semibold">
                  {feeAmount.toFixed(2)} {transactionDetails.sendCurrency}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span className="text-muted-foreground">Total debited:</span>
                <span>
                  {totalDeducted.toFixed(2)} {transactionDetails.sendCurrency}
                </span>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient gets:</span>
                  <span className="font-semibold">
                    {transactionDetails.recipientGets} {transactionDetails.recipientCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-semibold">{transactionDetails.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange rate:</span>
                  <span>{transactionDetails.exchangeRate}</span>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isConfirming || isLoading}>Cancel</AlertDialogCancel>
              <Button
                onClick={() => {
                  if (userPin) setStep('pin');
                  else void handleConfirm();
                }}
                disabled={isConfirming || isLoading}
              >
                {isConfirming || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Transaction PIN</AlertDialogTitle>
              <AlertDialogDescription>Enter your 4-digit PIN to authorize this payment.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 flex flex-col items-center justify-center gap-4">
              <Label htmlFor="pin-input" className="sr-only">
                Transaction PIN
              </Label>
              <InputOTP id="pin-input" maxLength={4} value={pin} onChange={setPin} inputMode="numeric">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isConfirming || isLoading}>Cancel</AlertDialogCancel>
              <Button
                onClick={() => {
                  if (!userPin || pin !== userPin) {
                    toast({
                      title: 'Invalid PIN',
                      description: 'The transaction PIN you entered is incorrect.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  void handleConfirm();
                }}
                disabled={isConfirming || isLoading}
              >
                {isConfirming || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
