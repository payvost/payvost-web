
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InvestmentListing } from '@/types/investment';

interface InvestNowModalProps {
  children: React.ReactNode;
  listing: InvestmentListing;
}

export function InvestNowModal({ children, listing }: InvestNowModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvest = async () => {
    const investmentAmount = Number(amount);
    if (isNaN(investmentAmount) || investmentAmount < listing.minInvestment) {
      toast({
        title: "Invalid Amount",
        description: `Please enter an amount of at least ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.minInvestment)}.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Investment Successful!",
      description: `You have invested ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investmentAmount)} in ${listing.title}.`
    });

    setIsSubmitting(false);
    setOpen(false);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invest in: {listing.title}</DialogTitle>
          <DialogDescription>
            Enter the amount you'd like to invest. Minimum investment is {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.minInvestment)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount (USD)</Label>
                <Input 
                    id="amount" 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(listing.minInvestment)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="source">Funding Source</Label>
                 <Select defaultValue="usd-wallet">
                    <SelectTrigger id="source">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="usd-wallet">USD Wallet ($1,250.75)</SelectItem>
                         <SelectItem value="new-card">New Card</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleInvest} disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Confirm Investment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
