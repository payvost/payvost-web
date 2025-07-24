
'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "./ui/label";
import { useRouter } from "next/navigation";

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
}: PaymentConfirmationDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState<'review' | 'otp'>('review');
    const [isConfirming, setIsConfirming] = useState(false);
    const [otp, setOtp] = useState('');
    const [open, setOpen] = useState(false);


    const handleInitialConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Here you would typically trigger sending the OTP to the user's phone
        console.log("Sending OTP...");
        setStep('otp');
    }

    const handleFinalConfirm = async () => {
        setIsConfirming(true);
        // Here you would verify the OTP and then execute the transfer
        console.log("Verifying OTP:", otp);
        await onConfirm();
        toast({
            title: "Transfer Initiated!",
            description: `Your transfer to ${transactionDetails.recipientName} is being processed.`,
        });
        setIsConfirming(false);
        setOpen(false); // Manually close the dialog on success
        router.push('/dashboard/transactions/txn_01'); // Redirect to details page
    }
    
    const onDialogOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset state when dialog is closed
            setStep('review');
            setOtp('');
        }
    }


  return (
    <AlertDialog open={open} onOpenChange={onDialogOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        {step === 'review' && (
            <>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Your Transfer</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please review the details of your transaction before confirming.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">You send:</span>
                        <span className="font-semibold">{transactionDetails.sendAmount} {transactionDetails.sendCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient gets:</span>
                        <span className="font-semibold">{transactionDetails.recipientGets} {transactionDetails.recipientCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient:</span>
                        <span className="font-semibold">{transactionDetails.recipientName}</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Exchange rate:</span>
                            <span>{transactionDetails.exchangeRate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee:</span>
                            <span>{transactionDetails.fee}</span>
                        </div>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button onClick={handleInitialConfirm}>
                        Confirm & Continue
                    </Button>
                </AlertDialogFooter>
            </>
        )}
        {step === 'otp' && (
             <>
                <AlertDialogHeader>
                    <AlertDialogTitle>Enter Verification Code</AlertDialogTitle>
                    <AlertDialogDescription>
                        A 6-digit code has been sent to your registered phone number.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 flex flex-col items-center justify-center gap-4">
                     <Label htmlFor="otp-input" className="sr-only">
                        One-Time Password
                    </Label>
                    <InputOTP id="otp-input" maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                     <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        Didn't receive a code? Resend
                    </Button>
                </div>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setStep('review')}>Back</Button>
                    <Button onClick={handleFinalConfirm} disabled={isConfirming || otp.length < 6}>
                        {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Complete Transfer
                    </Button>
                </AlertDialogFooter>
            </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
