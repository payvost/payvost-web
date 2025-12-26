
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Loader2, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CurrencyExchangeDialogProps {
  children: React.ReactNode;
  wallets: {
    currency: string;
    name: string;
    balance: number;
    flag: string;
  }[];
}

const exchangeSchema = z.object({
  fromCurrency: z.string().min(1, 'Source currency is required'),
  toCurrency: z.string().min(1, 'Destination currency is required'),
  fromAmount: z.preprocess((a) => parseFloat(String(a || '0')), z.number().positive('Amount must be greater than 0')),
});

type ExchangeFormValues = z.infer<typeof exchangeSchema>;

// Mock rates for demonstration
const rates: Record<string, number> = {
  'USD-EUR': 0.92,
  'USD-GBP': 0.79,
  'USD-NGN': 1450.50,
  'EUR-USD': 1.08,
  'EUR-GBP': 0.85,
  'GBP-USD': 1.27,
  'GBP-EUR': 1.17,
};

export function CurrencyExchangeDialog({ children, wallets }: CurrencyExchangeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toAmount, setToAmount] = useState<string>('0.00');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ExchangeFormValues>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
    }
  });

  const fromCurrency = watch('fromCurrency');
  const toCurrency = watch('toCurrency');
  const fromAmount = watch('fromAmount');

  useEffect(() => {
    if (fromCurrency && toCurrency && fromAmount > 0) {
      const rateKey = `${fromCurrency}-${toCurrency}`;
      const rate = rates[rateKey] || 0; // Fallback to 0 if rate not found
      const calculatedAmount = fromAmount * rate;
      setToAmount(calculatedAmount.toFixed(2));
    } else {
      setToAmount('0.00');
    }
  }, [fromCurrency, toCurrency, fromAmount]);

  const onSubmit = async (data: ExchangeFormValues) => {
    setIsLoading(true);
    console.log('Exchanging:', data);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
        title: "Exchange Successful",
        description: `You have successfully exchanged ${data.fromAmount} ${data.fromCurrency} to ${toAmount} ${data.toCurrency}.`,
    });
    setIsLoading(false);
    setOpen(false);
  };
  
  const getWalletBalance = (currency: string) => {
    const wallet = wallets.find(w => w.currency === currency);
    if (!wallet) return '0.00';
    
    // Ensure balance is a number before calling toFixed
    const balance = typeof wallet.balance === 'number' 
      ? wallet.balance 
      : parseFloat(String(wallet.balance || '0')) || 0;
    
    return balance.toFixed(2);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Currency Exchange</DialogTitle>
          <DialogDescription>Swap funds between your wallets instantly.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {/* From Wallet */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="fromAmount">You Send</Label>
                    <p className="text-xs text-muted-foreground">Balance: {getWalletBalance(fromCurrency)}</p>
                </div>
                 <div className="flex gap-2">
                    <Input id="fromAmount" type="number" placeholder="0.00" {...register('fromAmount')} className="text-lg font-bold h-12" />
                    <Controller
                        name="fromCurrency"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={(value) => setValue('fromCurrency', value)} defaultValue={field.value}>
                                <SelectTrigger className="w-[150px] h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map(w => (
                                        <SelectItem key={w.currency} value={w.currency}>
                                            <div className="flex items-center gap-2">
                                                <Image src={`/flag/${w.flag.toUpperCase()}.png`} alt={w.name} width={20} height={20} className="rounded-full object-cover"/>
                                                {w.currency}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                {errors.fromAmount && <p className="text-sm text-destructive">{errors.fromAmount.message}</p>}
            </div>

            <div className="flex justify-center items-center">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* To Wallet */}
             <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                    <Label>You Get (Approximately)</Label>
                    <p className="text-xs text-muted-foreground">Balance: {getWalletBalance(toCurrency)}</p>
                </div>
                <div className="flex gap-2">
                    <Input value={toAmount} readOnly className="text-lg font-bold h-12 bg-transparent border-0" />
                    <Controller
                        name="toCurrency"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={(value) => setValue('toCurrency', value)} defaultValue={field.value}>
                                <SelectTrigger className="w-[150px] h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                     {wallets.map(w => (
                                        <SelectItem key={w.currency} value={w.currency}>
                                            <div className="flex items-center gap-2">
                                                <Image src={`/flag/${w.flag.toUpperCase()}.png`} alt={w.name} width={20} height={20} className="rounded-full object-cover"/>
                                                {w.currency}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>
          
            <div className="text-center text-sm text-muted-foreground">
                <p>1 {fromCurrency} ≈ {(rates[`${fromCurrency}-${toCurrency}`] || 0).toFixed(4)} {toCurrency}</p>
            </div>
          
          <DialogFooter>
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Exchange
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
