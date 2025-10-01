
'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, CalendarIcon, Repeat, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, writeBatch, getDoc, arrayUnion, Timestamp, collection, addDoc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const recurringPaymentSchema = z.object({
  recipient: z.string().min(1, 'Please select a recipient'),
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

type RecurringPaymentFormValues = z.infer<typeof recurringPaymentSchema>;

interface CreateRecurringPaymentFormProps {
    onBack: () => void;
}

export function CreateRecurringPaymentForm({ onBack }: CreateRecurringPaymentFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [formData, setFormData] = useState<RecurringPaymentFormValues | null>(null);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RecurringPaymentFormValues>({
        resolver: zodResolver(recurringPaymentSchema),
        defaultValues: {
            currency: 'USD',
            frequency: 'monthly',
            startDate: new Date(),
        },
    });

    useEffect(() => {
        if (!user) {
            setLoadingBeneficiaries(false);
            return;
        }
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setBeneficiaries(doc.data().beneficiaries || []);
            }
            setLoadingBeneficiaries(false);
        });

        return () => unsub();
    }, [user]);

    const onFormSubmit: SubmitHandler<RecurringPaymentFormValues> = (data) => {
        setFormData(data);
        setShowConfirmDialog(true);
    };
    
    const handleConfirmSchedule = async () => {
        if (!formData || !user) return;
        
        setIsSubmitting(true);
        setShowConfirmDialog(false);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            
            // 1. Save the recurring payment schedule
            const recurringPaymentsColRef = collection(db, "users", user.uid, "scheduledPayments");
            const recurringPaymentDoc = await addDoc(recurringPaymentsColRef, {
                ...formData,
                endDate: formData.endDate || null,
                status: 'Active',
                createdAt: Timestamp.now(),
            });

            // 2. If start date is today, debit wallet and create first transaction
            if (isToday(formData.startDate)) {
                const batch = writeBatch(db);
                const userDocSnap = await getDoc(userDocRef);
                if (!userDocSnap.exists()) throw new Error("User not found");
                
                const wallets = userDocSnap.data().wallets || [];
                const walletIndex = wallets.findIndex((w: any) => w.currency === formData.currency);

                if (walletIndex === -1 || wallets[walletIndex].balance < formData.amount) {
                    throw new Error(`Insufficient funds in ${formData.currency} wallet.`);
                }

                wallets[walletIndex].balance -= formData.amount;
                
                const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                const newTransaction = {
                    id: transactionId,
                    recipientName: formData.recipient,
                    sendAmount: formData.amount.toFixed(2),
                    sendCurrency: formData.currency,
                    recipientGets: formData.amount.toFixed(2), // Assuming same currency for now
                    recipientCurrency: formData.currency,
                    fee: '0.00', // Recurring payments might have different fee structures
                    status: 'Completed',
                    type: 'Recurring Payment',
                    date: new Date().toISOString(),
                    createdAt: Timestamp.now(),
                    exchangeRate: '1.00',
                };
                
                batch.update(userDocRef, { 
                    wallets: wallets,
                    transactions: arrayUnion(newTransaction)
                });
                
                await batch.commit();
            }

            // A backend function (e.g., Cloud Function with a scheduler) would be needed
            // to handle subsequent debits based on the frequency.

            toast({
                title: "Payment Scheduled!",
                description: `Recurring payment to ${formData.recipient} has been set up.`,
            });
            onBack();

        } catch (error: any) {
            console.error("Error scheduling payment:", error);
            toast({
                title: "Scheduling Failed",
                description: error.message || "Could not schedule the payment. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setFormData(null);
        }
    };


    return (
        <>
            <Card>
                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                            </Button>
                            <div>
                                <CardTitle>Schedule a New Recurring Payment</CardTitle>
                                <CardDescription>Set up automated payments with ease.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient</Label>
                            {loadingBeneficiaries ? <Skeleton className="h-10 w-full" /> : (
                                <Controller
                                    name="recipient"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select a saved beneficiary" /></SelectTrigger>
                                            <SelectContent>
                                                {beneficiaries.map((b) => (
                                                    <SelectItem key={b.id} value={b.name}>
                                                        {b.name} ({b.bank} ••••{b.accountLast4})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            )}
                            {errors.recipient && <p className="text-sm text-destructive mt-1">{errors.recipient.message}</p>}
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
                            <Input id="notes" {...register('notes')} placeholder="e.g. September Rent" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Scheduling...' : <><Repeat className="mr-2 h-4 w-4" />Schedule Payment</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

             <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Recurring Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please review the details of your recurring payment before confirming.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {formData && (
                         <div className="my-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Recipient:</span><span className="font-semibold">{formData.recipient}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-semibold">{formData.amount.toFixed(2)} {formData.currency}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Frequency:</span><span className="font-semibold capitalize">{formData.frequency}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Starts On:</span><span className="font-semibold">{format(formData.startDate, 'PPP')}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Ends On:</span><span className="font-semibold">{formData.endDate ? format(formData.endDate, 'PPP') : 'Never'}</span></div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSchedule}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirm & Schedule
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
