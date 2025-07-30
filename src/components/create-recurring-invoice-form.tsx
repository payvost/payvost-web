
'use client';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, CalendarIcon, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const recurringInvoiceSchema = z.object({
  customer: z.string().min(1, 'Please select a customer'),
  amount: z.preprocess(
    (val) => Number(String(val)),
    z.number().positive('Amount must be positive')
  ),
  currency: z.string().min(1, 'Currency is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date().optional(),
  notes: z.string().optional(),
});

type RecurringInvoiceFormValues = z.infer<typeof recurringInvoiceSchema>;

interface CreateRecurringInvoiceFormProps {
    onBack: () => void;
}

export function CreateRecurringInvoiceForm({ onBack }: CreateRecurringInvoiceFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RecurringInvoiceFormValues>({
        resolver: zodResolver(recurringInvoiceSchema),
        defaultValues: {
            currency: 'USD',
            frequency: 'monthly',
            startDate: new Date(),
        },
    });

    const onSubmit: SubmitHandler<RecurringInvoiceFormValues> = async (data) => {
        setIsSubmitting(true);
        console.log(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: "Invoice Scheduled!",
            description: `Recurring invoice for ${data.customer} has been set up.`,
        });
        setIsSubmitting(false);
        onBack();
    };

    return (
        <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                           <ArrowLeft className="h-4 w-4" />
                           <span className="sr-only">Back</span>
                        </Button>
                        <div>
                            <CardTitle>Schedule a New Recurring Invoice</CardTitle>
                            <CardDescription>Set up automated invoices for ongoing work.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="customer">Customer</Label>
                        <Controller
                            name="customer"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Stark Industries">Stark Industries</SelectItem>
                                        <SelectItem value="Wayne Enterprises">Wayne Enterprises</SelectItem>
                                        <SelectItem value="Acme Inc.">Acme Inc.</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.customer && <p className="text-sm text-destructive mt-1">{errors.customer.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" {...register('amount')} placeholder="0.00" />
                            {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Frequency</Label>
                             <Controller
                                name="frequency"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Controller
                                name="startDate"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                    </Popover>
                                )}
                            />
                            {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label>End Date (Optional)</Label>
                             <Controller
                                name="endDate"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'PPP') : <span>Never</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notes / Reference (Optional)</Label>
                        <Input id="notes" {...register('notes')} placeholder="e.g., Monthly Retainer" />
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Scheduling...' : <><Repeat className="mr-2 h-4 w-4" />Schedule Invoice</>}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
