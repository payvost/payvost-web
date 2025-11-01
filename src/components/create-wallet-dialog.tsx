
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wallet, CheckCircle, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { walletService } from '@/services';

interface CreateWalletDialogProps {
  children: React.ReactNode;
  onWalletCreated: () => void;
  disabled?: boolean;
}

const createWalletSchema = z.object({
  currency: z.string().min(1, 'Please select a currency'),
});

type FormValues = z.infer<typeof createWalletSchema>;

const availableCurrencies = [
  { currency: 'USD', name: 'US Dollar', flag: 'us' },
  { currency: 'EUR', name: 'Euro', flag: 'eu' },
  { currency: 'GBP', name: 'British Pound', flag: 'gb' },
  { currency: 'NGN', name: 'Nigerian Naira', flag: 'ng' },
  { currency: 'JPY', name: 'Japanese Yen', flag: 'jp' },
  { currency: 'CAD', name: 'Canadian Dollar', flag: 'ca' },
  { currency: 'AUD', name: 'Australian Dollar', flag: 'au' },
  { currency: 'GHS', name: 'Ghanaian Cedi', flag: 'gh' },
];

export function CreateWalletDialog({ children, onWalletCreated, disabled = false }: CreateWalletDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'form' | 'submitting' | 'success'>('form');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(createWalletSchema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a wallet.", variant: "destructive" });
      return;
    }
    setCreationStatus('submitting');

    try {
      // Create wallet via backend API
      await walletService.createAccount({
        currency: data.currency,
        type: 'PERSONAL',
      });
      
      toast({
        title: "Wallet Created!",
        description: `Your new ${data.currency} wallet is ready.`,
      });
      onWalletCreated();
      setCreationStatus('success');
      reset();
    } catch(error) {
      console.error("Error creating wallet:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create wallet. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setCreationStatus('form');
    }
  };
  
  const handleCreateAnother = () => {
    setCreationStatus('form');
  }
  
  const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
          // Reset state when dialog closes
          setTimeout(() => setCreationStatus('form'), 300);
      }
  }

  const renderContent = () => {
    switch (creationStatus) {
        case 'success':
            return (
                <>
                    <DialogHeader>
                        <div className="flex justify-center">
                            <div className="p-3 bg-green-500/10 rounded-full mb-2">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <DialogTitle className="text-center">Wallet Created Successfully</DialogTitle>
                         <DialogDescription className="text-center">
                            You can now send, receive, and hold funds in this currency.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4 flex-col sm:flex-col sm:space-x-0 gap-2">
                        <Button onClick={handleCreateAnother} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Another Wallet
                        </Button>
                         <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
                            Done
                        </Button>
                    </DialogFooter>
                </>
            );
        case 'form':
        case 'submitting':
            return (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <div className="flex justify-center">
                            <div className="p-3 bg-primary/10 rounded-full mb-2">
                                <Wallet className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <DialogTitle className="text-center">Create a New Currency Wallet</DialogTitle>
                        <DialogDescription className="text-center">
                            Add a new wallet to hold, send, and receive a different currency.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Select Currency</Label>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="currency">
                                            <SelectValue placeholder="Choose a currency..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCurrencies.map(c => (
                                                <SelectItem key={c.currency} value={c.currency}>
                                                    <div className="flex items-center gap-2">
                                                        <Image src={`/flag/${c.flag.toUpperCase()}.png`} alt={c.name} width={20} height={20} className="rounded-full object-cover"/>
                                                        <span>{c.name} ({c.currency})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full" disabled={creationStatus === 'submitting'}>
                            {creationStatus === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Wallet
                        </Button>
                    </DialogFooter>
                </form>
            )
    }
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
       {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
