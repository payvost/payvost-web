
'use client';

import { useFieldArray, useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CalendarIcon, Send, Trash2, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

// Re-using the same schema from the personal create invoice page
import { invoiceSchema, type InvoiceFormValues } from './create-invoice-page';

interface CreateBusinessInvoiceFormProps {
    onBack: () => void;
    invoiceId?: string | null;
}

const currencySymbols: { [key: string]: string } = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦',
};

export function CreateBusinessInvoiceForm({ onBack, invoiceId }: CreateBusinessInvoiceFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isIssueDateOpen, setIsIssueDateOpen] = useState(false);
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [loadingUserData, setLoadingUserData] = useState(true);
  const isEditing = !!invoiceId;

  const {
    register, control, handleSubmit, watch, setValue, getValues,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onTouched',
     defaultValues: {
            issueDate: new Date(),
            fromName: '', fromAddress: '', toName: '', toEmail: '', toAddress: '',
            items: [{ description: '', quantity: 1, price: 0 }],
            notes: 'Thank you for your business. Please pay within 30 days.',
            taxRate: 8.5, currency: 'USD', paymentMethod: 'payvost',
            invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        },
  });
  
    useEffect(() => {
        if (!user) {
            if (!authLoading) setLoadingUserData(false);
            return;
        }

        if (isEditing) {
            // Logic to fetch and populate existing invoice data can go here
            setLoadingUserData(false);
            return;
        }

        const userDocUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const businessProfile = data.businessProfile || {};
                setValue('fromName', businessProfile.name || '');
                setValue('fromAddress', businessProfile.address || '');
            }
            setLoadingUserData(false);
        });

        return () => userDocUnsub();
    }, [user, authLoading, setValue, isEditing]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
    const watchedItems = watch('items');
    const watchedTaxRate = watch('taxRate') || 0;
    const selectedCurrency = watch('currency');
    
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const taxAmount = subtotal * (watchedTaxRate / 100);
    const grandTotal = subtotal + taxAmount;

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
    };

    const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
        setIsSaving(true);
        console.log(data); // In a real app, this would save to a 'businessInvoices' collection
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast({
            title: isEditing ? "Invoice Updated!" : "Invoice Created & Sent!",
            description: `Invoice #${data.invoiceNumber} has been successfully processed.`,
        });
        setIsSaving(false);
        onBack();
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</h2>
                <p className="text-muted-foreground">Fill out the form below to create a new business invoice.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start w-full">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="invoiceNumber">Invoice #</Label>
                            <Input id="invoiceNumber" {...register('invoiceNumber')} className="h-10" />
                        </div>
                         <div className="space-y-2 col-span-1">
                            <Label>Invoice Date</Label>
                             <Controller name="issueDate" control={control} render={({ field }) => (
                                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                            )} />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Due Date</Label>
                            <Controller name="dueDate" control={control} render={({ field }) => (
                                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                            )} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                         <div>
                            <Label className="font-semibold">From:</Label>
                            <div className="mt-1 p-3 border rounded-md bg-muted/50 min-h-[108px]">
                                <div className="font-semibold">{loadingUserData ? <Skeleton className="h-5 w-32" /> : getValues('fromName')}</div>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {loadingUserData ? <Skeleton className="h-10 w-48 mt-1" /> : getValues('fromAddress')}
                                </div>
                            </div>
                        </div>
                         <div>
                            <Label className="font-semibold">To:</Label>
                            <Input {...register('toName')} placeholder="Client's Name/Company" className="mt-1" />
                            <Textarea {...register('toAddress')} placeholder="Client's Address" className="mt-2" />
                        </div>
                    </div>

                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[50%]">Description</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id} className="align-top">
                                    <TableCell><Input {...register(`items.${index}.description`)} placeholder="Service or product" /></TableCell>
                                    <TableCell><Input type="number" {...register(`items.${index}.quantity`)} placeholder="1" className="w-20" /></TableCell>
                                    <TableCell><Input type="number" {...register(`items.${index}.price`)} placeholder="0.00" className="w-24" /></TableCell>
                                    <TableCell className="text-right pt-4 font-medium">{formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0), selectedCurrency)}</TableCell>
                                    <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                     <div className="grid grid-cols-2 gap-8 items-start">
                        <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register('notes')} /></div>
                        <div className="space-y-2">
                             <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, selectedCurrency)}</span></div>
                             <div className="flex justify-between items-center"><Label htmlFor="taxRate">Tax (%)</Label><Input type="number" id="taxRate" {...register('taxRate')} className="w-20 h-8" placeholder="0" /></div>
                             <div className="flex justify-between"><span className="text-muted-foreground">Tax Amount</span><span className="font-medium">{formatCurrency(taxAmount, selectedCurrency)}</span></div>
                             <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Grand Total</span><span>{formatCurrency(grandTotal, selectedCurrency)}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button type="button" variant="outline" disabled={isSaving}>Save as Draft</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Send className="mr-2 h-4 w-4" />{isEditing ? 'Update & Send' : 'Save & Send'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
