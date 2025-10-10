
'use client';

import { useFieldArray, useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { useState } from 'react';
import { Separator } from './ui/separator';

const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.preprocess(
    (val) => Number(String(val)),
    z.number().positive('Must be > 0')
  ),
  price: z.preprocess(
    (val) => Number(String(val)),
    z.number().positive('Must be > 0')
  ),
});

const quoteSchema = z.object({
  quoteNumber: z.string().min(1, 'Quote number is required'),
  issueDate: z.date({ required_error: 'Issue date is required' }),
  expiryDate: z.date({ required_error: 'Expiry date is required' }),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('A valid client email is required'),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  taxRate: z.preprocess(
    (val) => (String(val) === '' ? 0 : Number(String(val))),
    z.number().min(0, 'Tax rate cannot be negative').optional()
  ),
  currency: z.string(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface CreateQuoteFormProps {
    onBack: () => void;
    quoteId?: string | null;
}

const currencySymbols: { [key: string]: string } = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦',
};

export function CreateQuoteForm({ onBack, quoteId }: CreateQuoteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!quoteId;

  const {
    register, control, handleSubmit, watch,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      issueDate: new Date(),
      items: [{ description: '', quantity: 1, price: 0 }],
      taxRate: 0,
      currency: 'USD',
      quoteNumber: `QT-${Date.now() % 100000}`,
    },
  });

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

  const formatCurrency = (amount: number) => {
    const symbol = currencySymbols[selectedCurrency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  };
  
  const onSubmit: SubmitHandler<QuoteFormValues> = async (data) => {
    setIsSubmitting(true);
    console.log("Quote Data:", data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
        title: "Quote Created!",
        description: `Quote #${data.quoteNumber} has been saved.`
    });
    setIsSubmitting(false);
    onBack();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isEditing ? `Edit Quote #${quoteId}` : 'Create New Quote'}
                    </h2>
                    <p className="text-muted-foreground">Fill in the details to generate a sales quote.</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline">Save as Draft</Button>
                <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                     {isEditing ? 'Update Quote' : 'Create & Send'}
                </Button>
            </div>
        </div>
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2"><Label>Quote Number</Label><Input {...register('quoteNumber')} />{errors.quoteNumber && <p className="text-sm text-destructive">{errors.quoteNumber.message}</p>}</div>
                    <div className="space-y-2"><Label>Client Name</Label><Input {...register('clientName')} />{errors.clientName && <p className="text-sm text-destructive">{errors.clientName.message}</p>}</div>
                    <div className="space-y-2"><Label>Client Email</Label><Input type="email" {...register('clientEmail')} />{errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail.message}</p>}</div>
                    <div className="space-y-2"><Label>Currency</Label><Controller name="currency" control={control} render={({field}) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem></SelectContent></Select>)}/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2"><Label>Issue Date</Label><Controller name="issueDate" control={control} render={({field}) => (<Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, 'PPP') : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>)}/></div>
                    <div className="space-y-2"><Label>Expiry Date</Label><Controller name="expiryDate" control={control} render={({field}) => (<Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, 'PPP') : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>)}/></div>
                </div>
                <Separator />
                <Table>
                    <TableHeader><TableRow><TableHead className="w-1/2">Description</TableHead><TableHead>Quantity</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell><Input {...register(`items.${index}.description`)}/></TableCell>
                                <TableCell><Input type="number" {...register(`items.${index}.quantity`)}/></TableCell>
                                <TableCell><Input type="number" {...register(`items.${index}.price`)}/></TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0))}</TableCell>
                                <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                    <Plus className="mr-2 h-4 w-4"/>Add Item
                </Button>
                 <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-2"><Label>Notes/Terms</Label><Textarea {...register('notes')} /></div>
                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-center"><Label>Tax (%)</Label><Input type="number" {...register('taxRate')} className="w-20 h-8" /></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(taxAmount)}</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </form>
  )
}
