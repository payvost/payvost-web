
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
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, arrayUnion, Timestamp, collection, addDoc, serverTimestamp } from "firebase/firestore";


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
    const { user } = useAuth();
    const [step, setStep] = useState<'review' | 'otp'>('review');
    const [isConfirming, setIsConfirming] = useState(false);
    const [otp, setOtp] = useState('');
    const [open, setOpen] = useState(false);

    const feeAmount = parseFloat(transactionDetails.fee.replace('$', '')) || 0.00;
    const sendAmountNum = parseFloat(transactionDetails.sendAmount) || 0;
    const totalDeducted = sendAmountNum + feeAmount;


    const handleInitialConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Here you would typically trigger sending the OTP to the user's phone
        console.log("Sending OTP...");
        setStep('otp');
    }

    const handleFinalConfirm = async () => {
        if (!user) {
            toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
            return;
        }
        setIsConfirming(true);
        // Here you would verify the OTP and then execute the transfer
        console.log("Verifying OTP:", otp);

        try {
            // 1. Generate unique transaction ID
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                throw new Error("User document not found.");
            }
            
            const userData = userDoc.data();
            const wallets = userData.wallets || [];

            // 2. Debit the user's wallet
            let walletFound = false;
            const updatedWallets = wallets.map((w: any) => {
                if (w.currency === transactionDetails.sendCurrency) {
                    walletFound = true;
                    if (w.balance < totalDeducted) {
                        throw new Error("Insufficient funds for this transaction.");
                    }
                    return { ...w, balance: w.balance - totalDeducted };
                }
                return w;
            });
            
            if (!walletFound) {
                throw new Error(`Wallet for ${transactionDetails.sendCurrency} not found.`);
            }

            // 3. Create the transaction record
            const newTransaction = {
                id: transactionId,
                recipientName: transactionDetails.recipientName,
                sendAmount: transactionDetails.sendAmount,
                sendCurrency: transactionDetails.sendCurrency,
                recipientGets: transactionDetails.recipientGets,
                recipientCurrency: transactionDetails.recipientCurrency,
                fee: feeAmount.toFixed(2),
                status: 'Completed',
                type: transactionDetails.recipientName === 'Bill Payment' ? 'Bill Payment' : 'Transfer',
                date: new Date().toISOString(),
                createdAt: Timestamp.now(),
                exchangeRate: transactionDetails.exchangeRate,
            };

            // 4. Update Firestore
            await updateDoc(userDocRef, {
                wallets: updatedWallets,
                transactions: arrayUnion(newTransaction)
            });

            // 5. Add a notification for the successful transaction
            const notificationsColRef = collection(db, "users", user.uid, "notifications");
            await addDoc(notificationsColRef, {
                icon: 'success',
                title: 'Transfer Successful',
                description: `Your transfer of ${sendAmountNum.toFixed(2)} ${transactionDetails.sendCurrency} to ${transactionDetails.recipientName} was successful.`,
                date: serverTimestamp(),
                read: false,
            });

            await onConfirm(); // Call original onConfirm if needed
            toast({
                title: "Transfer Initiated!",
                description: `Your transfer to ${transactionDetails.recipientName} is being processed.`,
            });
            
            setIsConfirming(false);
            setOpen(false); // Manually close the dialog on success
            
            // 6. Redirect to the new transaction details page
            router.push(`/dashboard/transactions/${transactionId}`);

        } catch (error: any) {
            console.error("Final confirmation failed:", error);
            toast({
                title: "Transfer Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
            setIsConfirming(false);
        }
    }
    
    const onDialogOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset state when dialog is closed
            setTimeout(() => {
                setStep('review');
                setOtp('');
            }, 300);
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
                        <span className="text-muted-foreground">Fee:</span>
                        <span className="font-semibold">{feeAmount.toFixed(2)} {transactionDetails.sendCurrency}</span>
                    </div>
                     <div className="flex justify-between font-bold border-t pt-2 mt-2">
                        <span className="text-muted-foreground">Total to be debited:</span>
                        <span>{totalDeducted.toFixed(2)} {transactionDetails.sendCurrency}</span>
                    </div>

                    <div className="pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Recipient gets:</span>
                            <span className="font-semibold">{transactionDetails.recipientGets} {transactionDetails.recipientCurrency}</span>
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
