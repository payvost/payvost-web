
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';
import type { VirtualCardData } from '@/types/virtual-card';
import { DollarSign } from 'lucide-react';
import { Separator } from './ui/separator';


const createCardSchema = z.object({
  cardLabel: z.string().min(3, 'Card label must be at least 3 characters'),
  cardModel: z.enum(['debit', 'credit']),
  cardType: z.enum(['visa', 'mastercard']),
  theme: z.enum(['blue', 'purple', 'green', 'black']),
  spendingLimit: z.object({
      amount: z.preprocess(
        (val) => (val === '' ? undefined : Number(val)),
        z.number().positive('Limit must be a positive number').optional()
      ),
      interval: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'all_time']),
  }).optional(),
});

type CreateCardFormValues = z.infer<typeof createCardSchema>;

const themes = [
  { value: 'blue' as const, className: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' },
  { value: 'purple' as const, className: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white' },
  { value: 'green' as const, className: 'bg-gradient-to-br from-green-500 to-teal-600 text-white' },
  { value: 'black' as const, className: 'bg-gradient-to-br from-gray-800 to-black text-white' },
];

interface CreateVirtualCardFormProps {
    onSubmit: (data: Omit<VirtualCardData, 'id' | 'balance' | 'currency' | 'status' | 'fullNumber' | 'transactions' | 'last4' | 'expiry' | 'cvv'>) => void;
    onCancel: () => void;
    isKycVerified: boolean;
}

export function CreateVirtualCardForm({ onSubmit, onCancel, isKycVerified }: CreateVirtualCardFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateCardFormValues>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      cardLabel: '',
      cardModel: 'debit',
      cardType: 'visa',
      theme: 'blue',
      spendingLimit: {
        amount: 500,
        interval: 'monthly',
      }
    },
  });

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cardLabel">Card Label</Label>
            <Input id="cardLabel" {...register('cardLabel')} placeholder="e.g., Online Subscriptions" disabled={!isKycVerified} />
            {errors.cardLabel && <p className="text-sm text-destructive">{errors.cardLabel.message}</p>}
          </div>

           <div className="space-y-2">
            <Label>Card Model</Label>
             <Controller
                name="cardModel"
                control={control}
                render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4" disabled={!isKycVerified}>
                       <div><RadioGroupItem value="debit" id="debit" className="peer sr-only" /><Label htmlFor="debit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary">Debit</Label></div>
                       <div><RadioGroupItem value="credit" id="credit" className="peer sr-only" /><Label htmlFor="credit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary">Credit</Label></div>
                    </RadioGroup>
                )}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Card Network</Label>
             <Controller
                name="cardType"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                        disabled={!isKycVerified}
                    >
                       <div>
                         <RadioGroupItem value="visa" id="visa" className="peer sr-only" />
                         <Label htmlFor="visa" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Visa
                         </Label>
                       </div>
                        <div>
                         <RadioGroupItem value="mastercard" id="mastercard" className="peer sr-only" />
                         <Label htmlFor="mastercard" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                           Mastercard
                         </Label>
                       </div>
                    </RadioGroup>
                )}
            />
          </div>
          
           <div className="space-y-2">
            <Label>Spending Limit</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="spendingLimit.amount" type="number" {...register('spendingLimit.amount')} placeholder="500" className="pl-8" disabled={!isKycVerified} />
                </div>
                 <Controller
                    name="spendingLimit.interval"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isKycVerified}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Per Day</SelectItem>
                            <SelectItem value="weekly">Per Week</SelectItem>
                            <SelectItem value="monthly">Per Month</SelectItem>
                            <SelectItem value="yearly">Per Year</SelectItem>
                            <SelectItem value="all_time">All Time</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                />
            </div>
             {errors.spendingLimit?.amount && <p className="text-sm text-destructive">{errors.spendingLimit.amount.message}</p>}
          </div>


          <div className="space-y-2">
            <Label>Card Theme</Label>
            <Controller
                name="theme"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        disabled={!isKycVerified}
                    >
                         {themes.map(theme => (
                             <div key={theme.value}>
                                <RadioGroupItem value={theme.value} className="sr-only" id={`theme-${theme.value}`} />
                                <Label 
                                    htmlFor={`theme-${theme.value}`}
                                    className={cn(
                                        'h-20 w-full rounded-md cursor-pointer border-2 border-transparent transition-all flex items-center justify-center text-white font-semibold',
                                        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                        field.value === theme.value && 'ring-2 ring-primary',
                                        theme.className
                                    )}
                                >
                                    {theme.value.charAt(0).toUpperCase() + theme.value.slice(1)}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
            />
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={!isKycVerified}>Create Card</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
