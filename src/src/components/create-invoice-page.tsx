
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
import { ArrowLeft, CalendarIcon, Download, Printer, Send, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const invoiceItemSchema = z.object({
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

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.date({ required_error: 'Issue date is required' }),
  dueDate: z.date({ required_error: 'Due date is required' }),
  currency: z.string().min(1, 'Currency is required'),
  fromName: z.string().min(1, 'Your name is required'),
  fromAddress: z.string().min(1, 'Your address is required'),
  toName: z.string().min(1, 'Client name is required'),
  toAddress: z.string().min(1, 'Client address is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  taxRate: z.preprocess(
    (val) => (String(val) === '' ? 0 : Number(String(val))),
    z.number().min(0, 'Tax rate cannot be negative').optional()
  ),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
};

interface CreateInvoicePageProps {
    onBack: () => void;
}

export function CreateInvoicePage({ onBack }: CreateInvoicePageProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
            issueDate: new Date(),
            fromName: 'Payvost Inc.',
            fromAddress: '123 Finance Street, Moneyville, USA',
            toName: '',
            toAddress: '',
            items: [{ description: '', quantity: 1, price: 0 }],
            notes: 'Thank you for your business. Please pay within 30 days.',
            taxRate: 0,
            currency: 'USD',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const watchedItems = watch('items');
    const watchedTaxRate = watch('taxRate') || 0;
    const selectedCurrency = watch('currency');
    const currencySymbol = currencySymbols[selectedCurrency] || '$';
    
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const taxAmount = subtotal * (watchedTaxRate / 100);
    const grandTotal = subtotal + taxAmount;

    const formatCurrency = (amount: number) => {
        return `${currencySymbol}${amount.toFixed(2)}`;
    }

    const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
        setIsSubmitting(true);
        console.log(data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: "Invoice Sent!",
            description: `Invoice ${data.invoiceNumber} has been sent to ${data.toName}.`,
        });
        setIsSubmitting(false);
        onBack();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
                        <p className="text-muted-foreground text-sm">Fill out the form below to create a new invoice.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Label htmlFor="invoiceNumber" className="text-muted-foreground">#</Label>
                                <Input id="invoiceNumber" {...register('invoiceNumber')} className="w-32 h-8" />
                            </div>
                            {errors.invoiceNumber && <p className="text-sm text-destructive mt-1">{errors.invoiceNumber.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Currency</Label>
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                                <SelectItem value="NGN">NGN (₦)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                 {errors.currency && <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>}
                            </div>
                            <div>
                                <Label>Invoice Date</Label>
                                <Controller
                                    name="issueDate"
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
                                {errors.issueDate && <p className="text-sm text-destructive mt-1">{errors.issueDate.message}</p>}
                            </div>
                             <div>
                                <Label>Due Date</Label>
                                <Controller
                                    name="dueDate"
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
                                {errors.dueDate && <p className="text-sm text-destructive mt-1">{errors.dueDate.message}</p>}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <Label className="font-semibold">From:</Label>
                                <Input {...register('fromName')} placeholder="Your Name/Company" className="mt-1" />
                                {errors.fromName && <p className="text-sm text-destructive mt-1">{errors.fromName.message}</p>}
                                <Textarea {...register('fromAddress')} placeholder="Your Address" className="mt-2"/>
                                 {errors.fromAddress && <p className="text-sm text-destructive mt-1">{errors.fromAddress.message}</p>}
                            </div>
                             <div>
                                <Label className="font-semibold">To:</Label>
                                <Input {...register('toName')} placeholder="Client's Name/Company" className="mt-1" />
                                {errors.toName && <p className="text-sm text-destructive mt-1">{errors.toName.message}</p>}
                                <Textarea {...register('toAddress')} placeholder="Client's Address" className="mt-2" />
                                {errors.toAddress && <p className="text-sm text-destructive mt-1">{errors.toAddress.message}</p>}
                            </div>
                        </div>

                        <div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Description</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Input {...register(`items.${index}.description`)} placeholder="Service or product description"/>
                                                {errors.items?.[index]?.description && <p className="text-sm text-destructive mt-1">{errors.items[index]?.description?.message}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" {...register(`items.${index}.quantity`)} placeholder="1" className="w-20" />
                                                {errors.items?.[index]?.quantity && <p className="text-sm text-destructive mt-1">{errors.items[index]?.quantity?.message}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" {...register(`items.${index}.price`)} placeholder="0.00" className="w-24" />
                                                 {errors.items?.[index]?.price && <p className="text-sm text-destructive mt-1">{errors.items[index]?.price?.message}</p>}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0))}
                                            </TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {errors.items && <p className="text-sm text-destructive mt-2">{errors.items.message}</p>}
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>
                        
                        <div className="flex justify-between gap-8">
                             <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" {...register('notes')} placeholder="Additional information for the client" className="mt-1"/>
                            </div>
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="taxRate">Tax (%)</Label>
                                    <Input type="number" id="taxRate" {...register('taxRate')} className="w-20 h-8" placeholder="0" />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax Amount</span>
                                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                    <span>Grand Total</span>
                                    <span>{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                         <Button type="button" variant="outline">Save as Draft</Button>
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : <><Send className="mr-2 h-4 w-4" />Send Invoice</>}
                         </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
