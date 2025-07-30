
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

interface FundWalletDialogProps {
  children: React.ReactNode;
  wallet: {
    currency: string;
    name: string;
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
    USD: { beneficiary: 'Qwibik Inc.', accountNumber: '0123456789', routingNumber: '987654321', bankName: 'Global Citizen Bank', address: '123 Finance Street, New York, NY 10001, USA' },
    NGN: { beneficiary: 'Qwibik Nigeria Ltd.', accountNumber: '9876543210', bankName: 'Providus Bank', address: '1 Qwibik Close, Lagos, Nigeria' },
};

export function FundWalletDialog({ children, wallet }: FundWalletDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
  });

  const onSubmit = async (data: FundFormValues) => {
    setIsLoading(true);
    console.log('Funding with:', data);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
        title: "Funding Successful",
        description: `Your ${wallet.currency} wallet has been funded with ${data.amount}.`,
    });
    setIsLoading(false);
    setOpen(false);
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
                        <p className="font-semibold">{value}</p>
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

