
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, CreditCard, Landmark, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface FundWalletDialogProps {
  children: React.ReactNode;
  wallet: {
    currency: string;
  };
}

const fundSchema = z.object({
  amount: z.preprocess((a) => parseFloat(String(a)), z.number().positive('Amount must be greater than 0')),
  cardNumber: z.string().refine((val) => /^\d{16}$/.test(val), 'Invalid card number'),
  expiry: z.string().refine((val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val), 'Invalid expiry date (MM/YY)'),
  cvc: z.string().refine((val) => /^\d{3,4}$/.test(val), 'Invalid CVC'),
});

type FundFormValues = z.infer<typeof fundSchema>;

const accountDetails: { [key: string]: any } = {
    USD: { beneficiary: 'Payvost Inc.', accountNumber: '0123456789', routingNumber: '987654321', bankName: 'Global Citizen Bank', address: '123 Finance Street, New York, NY 10001, USA' },
    NGN: { beneficiary: 'Payvost Nigeria Ltd.', accountNumber: '9876543210', bankName: 'Providus Bank', address: '1 Payvost Close, Lagos, Nigeria' },
};

export function FundWalletDialog({ children, wallet }: FundWalletDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
  });

  const onSubmit = async (data: FundFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to fund a wallet.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error("User data not found.");
        }

        const userData = userDoc.data();
        const wallets = userData.wallets || [];

        // Find the wallet and update its balance
        const updatedWallets = wallets.map((w: any) => {
            if (w.currency === wallet.currency) {
                return { ...w, balance: (w.balance || 0) + data.amount };
            }
            return w;
        });

        // Prepare new card details to be saved (non-sensitive info only)
        const newCard = {
            last4: data.cardNumber.slice(-4),
            cardType: 'visa', // This can be determined from the card number in a real app
            expiry: data.expiry,
            cardLabel: 'New Card' // Or derive from user input
        };

        // Update the user document
        await updateDoc(userDocRef, {
            wallets: updatedWallets,
            cards: arrayUnion(newCard) // Assuming you have a 'cards' array in your user doc
        });

        toast({
            title: "Funding Successful",
            description: `Your ${wallet.currency} wallet has been funded with ${data.amount}.`,
        });
        setOpen(false);

    } catch (error) {
        console.error("Funding failed:", error);
        toast({
            title: "Funding Failed",
            description: "There was a problem funding your wallet. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const details = accountDetails[wallet.currency] || accountDetails.USD;
  const detailsToCopy = Object.entries(details).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}`).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(detailsToCopy);
    toast({ title: "Copied to Clipboard!", description: `Funding details for your ${wallet.currency} wallet have been copied.` });
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Your {wallet.currency} Wallet</DialogTitle>
          <DialogDescription>Choose a method to add funds to your wallet.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="card">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4"/>Card</TabsTrigger>
            <TabsTrigger value="transfer"><Landmark className="mr-2 h-4 w-4"/>Bank Transfer</TabsTrigger>
          </TabsList>
          <TabsContent value="card" className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({wallet.currency})</Label>
                <Input id="amount" type="number" placeholder="0.00" {...register('amount')} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="•••• •••• •••• ••••" {...register('cardNumber')} />
                 {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                    <Input id="expiry" placeholder="MM/YY" {...register('expiry')} />
                    {errors.expiry && <p className="text-sm text-destructive">{errors.expiry.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" {...register('cvc')} />
                    {errors.cvc && <p className="text-sm text-destructive">{errors.cvc.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fund Wallet
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="transfer" className="pt-4">
             <div className="space-y-4">
        {Object.entries(details).map(([key, value]) => (
                     <div key={key} className="text-sm">
                        <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="font-semibold">{String(value)}</p>
                    </div>
                ))}
                <Separator />
                <p className="text-xs text-muted-foreground">
                    Please ensure you are sending {wallet.currency}. Funds sent in other currencies may be lost or subject to high conversion fees.
                </p>
                <Button onClick={handleCopy} className="w-full">
                    <Copy className="mr-2 h-4 w-4"/> Copy Details
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
