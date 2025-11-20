
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, UserPlus, Wallet, CreditCard, Landmark, Repeat, Calendar, Check, Send } from 'lucide-react';
import type { PayoutData } from '@/types/payout';
import { Separator } from './ui/separator';

const payoutSchema = z.object({
  recipientType: z.enum(['saved', 'new']),
  savedRecipientId: z.string().optional(),
  recipientName: z.string().optional(),
  accountNumber: z.string().optional(),
  bank: z.string().optional(),
  amount: z.preprocess((val) => Number(String(val)), z.number().positive('Amount must be > 0')),
  currency: z.string(),
  narration: z.string().optional(),
  fundingSource: z.enum(['wallet', 'card', 'bank']),
  saveBeneficiary: z.boolean(),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

const savedBeneficiaries = [
    { id: 'ben_1', name: 'John Doe - Chase Bank ****9876' },
    { id: 'ben_2', name: 'Jane Smith - Barclays ****5432' },
];

export function BusinessPayoutForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
    control,
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      recipientType: 'saved',
      fundingSource: 'wallet',
      currency: 'USD',
      saveBeneficiary: false,
    },
  });

  const recipientType = watch('recipientType');
  const amount = watch('amount');
  const currency = watch('currency');

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof PayoutFormValues)[] = [];
    if (step === 1) {
        fieldsToValidate = ['recipientType'];
        if (recipientType === 'saved') fieldsToValidate.push('savedRecipientId');
        else fieldsToValidate.push('recipientName', 'accountNumber', 'bank');
    } else if (step === 2) {
        fieldsToValidate = ['amount', 'currency', 'narration', 'fundingSource'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => s + 1);
    }
  };

  const onSubmit = (data: PayoutFormValues) => {
    setIsSubmitting(true);
    console.log("Payout Data:", data);
    toast({
        title: "Payout Submitted",
        description: "Your payout is being processed."
    });
    // In a real app, you would handle API submission here.
    setTimeout(() => {
        setIsSubmitting(false);
        setStep(4); // Move to success step
    }, 2000);
  };
  
  if (step === 4) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardContent className="p-10 text-center flex flex-col items-center">
                 <div className="p-4 bg-green-500/10 rounded-full mb-4">
                    <Check className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Payout Successful!</h3>
                <p className="text-muted-foreground mt-2">
                    Your payout of {amount} {currency} has been processed.
                </p>
                <Button className="mt-6" onClick={() => setStep(1)}>Make Another Payout</Button>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Create Payout</CardTitle>
                 <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Step 1: Recipient */}
                {step === 1 && (
                    <div className="space-y-4">
                         <h4 className="font-semibold">Step 1: Who are you paying?</h4>
                        <Controller
                            name="recipientType"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                                    <div><RadioGroupItem value="saved" id="saved" className="peer sr-only" /><Label htmlFor="saved" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><UserPlus className="mr-2 h-4 w-4"/>Saved Beneficiary</Label></div>
                                    <div><RadioGroupItem value="new" id="new" className="peer sr-only" /><Label htmlFor="new" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><UserPlus className="mr-2 h-4 w-4"/>New Recipient</Label></div>
                                </RadioGroup>
                            )}
                        />
                        {recipientType === 'saved' ? (
                             <div className="space-y-2">
                                <Label>Select Beneficiary</Label>
                                <Controller
                                    name="savedRecipientId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select a saved beneficiary"/></SelectTrigger><SelectContent><SelectItem value="ben_1">John Doe - Chase ****9876</SelectItem></SelectContent></Select>
                                    )}
                                />
                                {errors.savedRecipientId && <p className="text-sm text-destructive">{errors.savedRecipientId.message}</p>}
                            </div>
                        ) : (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="recipientName">Recipient Name</Label><Input id="recipientName" {...register('recipientName')} placeholder="e.g. John Doe"/> {errors.recipientName && <p className="text-sm text-destructive">{errors.recipientName.message}</p>}</div>
                                    <div className="space-y-2"><Label htmlFor="accountNumber">Account Number</Label><Input id="accountNumber" {...register('accountNumber')}/> {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}</div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="bank">Bank / Payment Service</Label><Input id="bank" {...register('bank')}/> {errors.bank && <p className="text-sm text-destructive">{errors.bank.message}</p>}</div>
                                <div className="flex items-center space-x-2"><Controller name="saveBeneficiary" control={control} render={({field}) => (<input type="checkbox" id="saveBeneficiary" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} onBlur={field.onBlur} ref={field.ref} />)} /><Label htmlFor="saveBeneficiary">Save as beneficiary for future use</Label></div>
                            </div>
                        )}
                    </div>
                )}
                {/* Step 2: Amount & Funding */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h4 className="font-semibold">Step 2: Payment Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" {...register('amount')}/> {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}</div>
                            <div className="space-y-2"><Label htmlFor="currency">Currency</Label><Controller name="currency" control={control} render={({field}) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="NGN">NGN</SelectItem></SelectContent></Select>)}/></div>
                        </div>
                         <div className="space-y-2"><Label htmlFor="narration">Narration (Optional)</Label><Textarea id="narration" {...register('narration')} placeholder="What is this payment for?" /></div>
                         <div>
                            <Label>Funding Source</Label>
                            <Controller
                                name="fundingSource"
                                control={control}
                                render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-4 mt-2">
                                    <div className="relative">
                                        <RadioGroupItem value="wallet" id="wallet" className="peer sr-only" />
                                        <Label htmlFor="wallet" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            <Wallet className="h-5 w-5 mb-2 mx-auto" /> Wallet
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                        <Label htmlFor="card" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            <CreditCard className="h-5 w-5 mb-2 mx-auto" /> Card
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                                        <Label htmlFor="bank" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            <Landmark className="h-5 w-5 mb-2 mx-auto" /> Bank
                                        </Label>
                                    </div>
                                </RadioGroup>
                                )}
                            />
                            </div>
                    </div>
                )}
                 {/* Step 3: Review */}
                 {step === 3 && (
                    <div className="space-y-4">
                        <h4 className="font-semibold">Step 3: Review & Confirm</h4>
                        <div className="p-4 border rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-medium">{recipientType === 'saved' ? 'John Doe' : watch('recipientName')}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{amount} {currency}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-medium">$2.50 USD</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Est. Arrival</span><span className="font-medium">Immediately</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Funding From</span><span className="font-medium capitalize">{watch('fundingSource')}</span></div>
                            <Separator className="my-2"/>
                            <div className="flex justify-between font-bold text-base"><span className="text-muted-foreground">Total to Pay</span><span>{(amount || 0) + 2.50} {currency}</span></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Repeat className="h-4 w-4"/><p>Set up as a recurring payment</p></div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-4 w-4"/><p>Schedule for a future date</p></div>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>Back</Button>
                {step < 3 ? (
                    <Button type="button" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4"/></Button>
                ) : (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirm & Send Payout
                    </Button>
                )}
            </CardFooter>
        </form>
    </Card>
  )
}
