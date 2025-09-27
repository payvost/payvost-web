
'use client';

import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { VirtualCardData } from '@/types/virtual-card';
import { DollarSign, ArrowLeft, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const createCardSchema = z.object({
  cardLabel: z.string().min(3, 'Card label must be at least 3 characters'),
  cardholder: z.string().min(1, 'Cardholder is required'),
  cardModel: z.enum(['debit', 'credit']),
  cardNetwork: z.enum(['visa', 'mastercard']),
  fundingSource: z.string().min(1, 'Funding source is required'),
  spendingLimitAmount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().positive('Limit must be a positive number').optional()
  ),
  spendingLimitInterval: z.enum(['daily', 'weekly', 'monthly', 'all_time']),
});

type CreateCardFormValues = z.infer<typeof createCardSchema>;

export default function CreateCardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { errors } } = useForm<CreateCardFormValues>({
        resolver: zodResolver(createCardSchema),
        defaultValues: {
            cardLabel: '',
            cardModel: 'debit',
            cardNetwork: 'visa',
            spendingLimitInterval: 'monthly'
        },
    });

    const onSubmit = (data: CreateCardFormValues) => {
        console.log(data);
        toast({
            title: "Virtual Card Issued!",
            description: `A new card "${data.cardLabel}" has been issued to ${data.cardholder}.`,
        });
        router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management');
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Issue New Virtual Card</h2>
                    <p className="text-muted-foreground">Configure and issue a new card for a user or team.</p>
                </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="p-6 space-y-8">
                        <div className="space-y-4">
                             <h3 className="text-lg font-medium">Card Details</h3>
                             <div className="space-y-2">
                                <Label htmlFor="cardLabel">Card Label</Label>
                                <Input id="cardLabel" {...register('cardLabel')} placeholder="e.g., Marketing Team Subscriptions" />
                                {errors.cardLabel && <p className="text-sm text-destructive">{errors.cardLabel.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardholder">Cardholder</Label>
                                <Controller
                                    name="cardholder"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select a user or team..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user_1">Alice Johnson</SelectItem>
                                                <SelectItem value="user_2">Bob Williams</SelectItem>
                                                <SelectItem value="team_1">Marketing Team</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.cardholder && <p className="text-sm text-destructive">{errors.cardholder.message}</p>}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                             <h3 className="text-lg font-medium">Card Configuration</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="mb-2 block">Card Model</Label>
                                    <Controller
                                        name="cardModel"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                                <div><RadioGroupItem value="debit" id="debit" className="peer sr-only" /><Label htmlFor="debit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary">Debit</Label></div>
                                                <div><RadioGroupItem value="credit" id="credit" className="peer sr-only" /><Label htmlFor="credit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary">Credit</Label></div>
                                            </RadioGroup>
                                        )}
                                    />
                                </div>
                                 <div>
                                    <Label className="mb-2 block">Card Network</Label>
                                    <Controller
                                        name="cardNetwork"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                                <div><RadioGroupItem value="visa" id="visa" className="peer sr-only" /><Label htmlFor="visa" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary">Visa</Label></div>
                                                <div><RadioGroupItem value="mastercard" id="mastercard" className="peer sr-only" /><Label htmlFor="mastercard" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary">Mastercard</Label></div>
                                            </RadioGroup>
                                        )}
                                    />
                                </div>
                              </div>
                        </div>

                         <Separator />

                        <div className="space-y-4">
                             <h3 className="text-lg font-medium">Funding & Limits</h3>
                            <div className="space-y-2">
                                <Label htmlFor="fundingSource">Funding Source</Label>
                                <Controller
                                    name="fundingSource"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select a funding source..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="balance_usd">Company Balance (USD)</SelectItem>
                                                <SelectItem value="balance_gbp">Company Balance (GBP)</SelectItem>
                                                <SelectItem value="bank_1">Chase Bank •••• 1234</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.fundingSource && <p className="text-sm text-destructive">{errors.fundingSource.message}</p>}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="spendingLimitAmount">Spending Limit</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="spendingLimitAmount" type="number" {...register('spendingLimitAmount')} placeholder="e.g. 1000" className="pl-8" />
                                    </div>
                                    {errors.spendingLimitAmount && <p className="text-sm text-destructive">{errors.spendingLimitAmount.message}</p>}
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="spendingLimitInterval">Limit Frequency</Label>
                                    <Controller
                                        name="spendingLimitInterval"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Per Day</SelectItem>
                                                    <SelectItem value="weekly">Per Week</SelectItem>
                                                    <SelectItem value="monthly">Per Month</SelectItem>
                                                    <SelectItem value="all_time">All Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                         <Separator />
                        
                         <div className="space-y-4">
                             <h3 className="text-lg font-medium">Advanced Rules (Optional)</h3>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Allowed Merchant Categories</Label>
                                        <p className="text-sm text-muted-foreground">Restrict spending to specific types of businesses (e.g., software, travel).</p>
                                    </div>
                                    <Button variant="outline">Configure</Button>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Block International Transactions</Label>
                                        <p className="text-sm text-muted-foreground">Prevent the card from being used outside of its primary country.</p>
                                    </div>
                                    <Switch />
                                </div>
                             </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit"><CreditCard className="mr-2 h-4 w-4" />Issue Card</Button>
                    </CardFooter>
                </Card>
            </form>
        </>
    );
}
