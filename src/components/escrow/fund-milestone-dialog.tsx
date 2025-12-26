'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { escrowApi } from '@/lib/api/escrow';
import { DollarSign } from 'lucide-react';

const fundSchema = z.object({
  amount: z.preprocess((val) => Number(String(val)), z.number().positive('Amount must be positive')),
  accountId: z.string().min(1, 'Please select an account'),
});

type FundFormValues = z.infer<typeof fundSchema>;

interface FundMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escrowId: string;
  milestoneId: string;
  milestoneTitle: string;
  requiredAmount: number;
  currency: string;
  accounts?: Array<{ id: string; currency: string; balance: number }>;
  onSuccess?: () => void;
}

export function FundMilestoneDialog({
  open,
  onOpenChange,
  escrowId,
  milestoneId,
  milestoneTitle,
  requiredAmount,
  currency,
  accounts = [],
  onSuccess,
}: FundMilestoneDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: requiredAmount,
    },
  });

  const selectedAccountId = watch('accountId');
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const onSubmit = async (data: FundFormValues) => {
    if (!selectedAccount) {
      toast({
        title: 'Error',
        description: 'Please select an account',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAccount.balance < data.amount) {
      toast({
        title: 'Insufficient Funds',
        description: 'The selected account does not have enough balance',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await escrowApi.fundMilestone(escrowId, milestoneId, {
        amount: data.amount,
        accountId: data.accountId,
      });

      toast({
        title: 'Milestone Funded',
        description: `Successfully funded ${milestoneTitle}`,
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to fund milestone',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Fund Milestone
          </DialogTitle>
          <DialogDescription>
            Fund the milestone: <strong>{milestoneTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountId">Select Account</Label>
            <Select onValueChange={(value) => setValue('accountId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((acc) => acc.currency === currency)
                  .map((account) => {
                    const balance = typeof account.balance === 'number' 
                      ? account.balance 
                      : parseFloat(String(account.balance || '0')) || 0;
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        {currency} Account - Balance: {balance.toFixed(2)}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-destructive">{errors.accountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="pl-12"
                placeholder="0.00"
                {...register('amount')}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Required: {currency} {requiredAmount.toFixed(2)}
            </p>
          </div>

          {selectedAccount && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Available Balance: {currency} {(typeof selectedAccount.balance === 'number' ? selectedAccount.balance : parseFloat(String(selectedAccount.balance || '0')) || 0).toFixed(2)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedAccount}>
              {isSubmitting ? 'Processing...' : 'Fund Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
