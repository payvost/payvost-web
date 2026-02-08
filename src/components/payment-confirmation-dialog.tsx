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
import { Loader2, Calendar, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface PaymentConfirmationDialogProps {
  children: ReactNode;
  onConfirm: (options?: { saveBeneficiary?: boolean; schedulePayment?: boolean }) => Promise<void> | void;
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
  showOptions?: boolean;
}

export function PaymentConfirmationDialog({
  children,
  onConfirm,
  transactionDetails,
  isLoading,
  showOptions = false,
}: PaymentConfirmationDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'review' | 'pin'>('review');
  const [isConfirming, setIsConfirming] = useState(false);
  const [pin, setPin] = useState('');
  const [pinStatus, setPinStatus] = useState<{ loaded: boolean; hasPin: boolean }>({
    loaded: false,
    hasPin: false,
  });

  // Transaction options
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [schedulePayment, setSchedulePayment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      if (!open || !user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/security/pin/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load PIN status');
        const data = (await res.json()) as { hasPin?: boolean };
        if (!cancelled) setPinStatus({ loaded: true, hasPin: Boolean(data?.hasPin) });
      } catch (err) {
        console.error('PIN status load error:', err);
        if (!cancelled) setPinStatus({ loaded: false, hasPin: false });
      }
    };

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const feeAmount = parseFloat(String(transactionDetails.fee).replace('$', '').replace('Free', '0')) || 0;
  const sendAmountNum = parseFloat(String(transactionDetails.sendAmount)) || 0;
  const totalDeducted = sendAmountNum + feeAmount;

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsConfirming(true);
    try {
      await onConfirm({
        saveBeneficiary,
        schedulePayment,
      });
      toast({
        title: 'Success',
        description: schedulePayment
          ? 'Payment scheduled successfully.'
          : 'Your payment is being processed.',
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
        setSaveBeneficiary(false);
        setSchedulePayment(false);
      }, 200);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onDialogOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[450px]">
        {step === 'review' ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
              <AlertDialogDescription>Review the details before submitting.</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You pay:</span>
                  <span className="font-semibold text-base">
                    {transactionDetails.sendAmount} {transactionDetails.sendCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee:</span>
                  <span className="font-semibold">
                    {transactionDetails.fee === 'Free' ? 'Free' : `${feeAmount.toFixed(2)} ${transactionDetails.sendCurrency}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span className="text-muted-foreground">Total debited:</span>
                  <span className="text-primary">
                    {totalDeducted.toFixed(2)} {transactionDetails.sendCurrency}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient gets:</span>
                  <span className="font-semibold text-base">
                    {transactionDetails.recipientGets} {transactionDetails.recipientCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-semibold">{transactionDetails.recipientName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Exchange rate:</span>
                  <span>{transactionDetails.exchangeRate}</span>
                </div>
              </div>

              {showOptions && (
                <>
                  <Separator />
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setSaveBeneficiary(!saveBeneficiary)}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          saveBeneficiary ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-none">Save as Beneficiary</p>
                          <p className="text-xs text-muted-foreground mt-1">Add to your saved recipients list</p>
                        </div>
                      </div>
                      <Switch
                        checked={saveBeneficiary}
                        onCheckedChange={setSaveBeneficiary}
                      />
                    </div>

                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setSchedulePayment(!schedulePayment)}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          schedulePayment ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-none">Schedule Payment</p>
                          <p className="text-xs text-muted-foreground mt-1">Make this a recurring transaction</p>
                        </div>
                      </div>
                      <Switch
                        checked={schedulePayment}
                        onCheckedChange={setSchedulePayment}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isConfirming || isLoading}>Cancel</AlertDialogCancel>
              <Button
                onClick={() => {
                  if (!user) {
                    toast({ title: 'Not authenticated', description: 'Please sign in.', variant: 'destructive' });
                    return;
                  }
                  if (!pinStatus.loaded) {
                    toast({ title: 'Loading...', description: 'Verifying security status...', variant: 'default' });
                    return;
                  }
                  if (pinStatus.hasPin) setStep('pin');
                  else void handleConfirm();
                }}
                disabled={isConfirming || isLoading}
                className="min-w-[100px]"
              >
                {isConfirming || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Transaction PIN</AlertDialogTitle>
              <AlertDialogDescription>Enter your 4-digit PIN to authorize this payment.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-8 flex flex-col items-center justify-center gap-4">
              <InputOTP id="pin-input" maxLength={4} value={pin} onChange={setPin} inputMode="numeric" autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isConfirming || isLoading}>Cancel</AlertDialogCancel>
              <Button
                onClick={async () => {
                  if (!/^\d{4}$/.test(pin)) return;
                  try {
                    const token = await user?.getIdToken();
                    const res = await fetch('/api/security/pin/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ pin }),
                    });
                    const data = await res.json();
                    if (res.ok && data?.ok) {
                      void handleConfirm();
                    } else {
                      toast({ title: 'Invalid PIN', description: data?.error || 'Incorrect PIN.', variant: 'destructive' });
                      setPin('');
                    }
                  } catch (err) {
                    toast({ title: 'Error', description: 'PIN verification failed.', variant: 'destructive' });
                  }
                }}
                disabled={isConfirming || isLoading || pin.length !== 4}
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
