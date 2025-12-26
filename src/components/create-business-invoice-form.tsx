
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
import { SendInvoiceDialog } from './send-invoice-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, addDoc, updateDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

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

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.date({ required_error: 'Issue date is required' }),
  dueDate: z.date({ required_error: 'Due date is required' }),
  currency: z.string().min(1, 'Currency is required'),
  fromName: z.string(),
  fromAddress: z.string(),
  toName: z.string().min(1, 'Client name is required'),
  toEmail: z.string().email('A valid client email is required'),
  toAddress: z.string().min(1, 'Client address is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  taxRate: z.preprocess(
    (val) => (String(val) === '' ? 0 : Number(String(val))),
    z.number().min(0, 'Tax rate cannot be negative').optional()
  ),
  paymentMethod: z.string().optional(),
  status: z.enum(['Draft', 'Pending', 'Paid']).default('Pending').optional(),
  isRecurring: z.boolean().default(false).optional(),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringEndDate: z.date().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;


interface CreateBusinessInvoiceFormProps {
    onBack: () => void;
    invoiceId?: string | null;
}

const currencySymbols: { [key: string]: string } = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦',
};

const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'NGN', label: 'NGN (₦)' },
];

export function CreateBusinessInvoiceForm({ onBack, invoiceId }: CreateBusinessInvoiceFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isIssueDateOpen, setIsIssueDateOpen] = useState(false);
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [isRecurringEndDateOpen, setIsRecurringEndDateOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(invoiceId ?? null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const isEditing = !!invoiceId;

  const {
    register, control, handleSubmit, watch, setValue, getValues, trigger, reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onTouched',
     defaultValues: {
            issueDate: new Date(),
            fromName: '', fromAddress: '', toName: '', toEmail: '', toAddress: '',
            items: [{ description: '', quantity: 1, price: 0 }],
            notes: 'Thank you for your business. Please pay within 30 days.',
            taxRate: 0, currency: 'USD', paymentMethod: 'rapyd',
            invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        },
  });
  
    useEffect(() => {
        if (!user) {
            if (!authLoading) setLoadingUserData(false);
            return;
        }
        
        if (isEditing && invoiceId) {
            const docRef = doc(db, 'businessInvoices', invoiceId);
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const invoice = docSnap.data();
                    if (invoice.createdBy === user.uid) {
                        reset({
                            invoiceNumber: invoice.invoiceNumber,
                            issueDate: invoice.issueDate.toDate(),
                            dueDate: invoice.dueDate.toDate(),
                            currency: invoice.currency,
                            fromName: invoice.fromName,
                            fromAddress: invoice.fromAddress,
                            toName: invoice.toName,
                            toEmail: invoice.toEmail,
                            toAddress: invoice.toAddress,
                            items: invoice.items,
                            notes: invoice.notes || '',
                            taxRate: invoice.taxRate || 0,
                            paymentMethod: invoice.paymentMethod?.toLowerCase() || 'rapyd',
                        });
                        setBusinessId(invoice.businessId || null);
                        setLoadingUserData(false);
                    }
                }
            });
            return () => unsubscribe();
            return;
        }

        const userDocUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const businessProfile = data.businessProfile || {};
                setValue('fromName', businessProfile.name || '');
                setValue('fromAddress', businessProfile.address || '');
                setBusinessId(businessProfile.id || `biz_${user.uid}`); // Fallback business ID
            }
            setLoadingUserData(false);
        });

        return () => userDocUnsub();
    }, [user, authLoading, setValue, isEditing, invoiceId, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
    const watchedItems = watch('items');
    const watchedTaxRate = watch('taxRate') || 0;
    const selectedCurrency = watch('currency');
    const isRecurring = watch('isRecurring') || false;
    
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const taxAmount = subtotal * (watchedTaxRate / 100);
    const grandTotal = subtotal + taxAmount;

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currencySymbols[currency] || currency;
        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        return `${symbol}${formattedAmount}`;
    };

    // Helper function to format numbers with comma separators
    const formatNumberInput = (value: string): string => {
      if (!value) return '';
      const numStr = String(value).replace(/[^\d.]/g, '');
      if (!numStr) return '';
      const [intPart, decPart] = numStr.split('.');
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decPart ? `${formattedInt}.${decPart.substring(0, 2)}` : formattedInt;
    };

    // Helper function to parse formatted number back to plain number
    const parseFormattedNumber = (value: string): string => {
      return value.replace(/,/g, '');
    };

    const saveInvoice = async (defaultStatus?: 'Draft' | 'Pending' | 'Paid') => {
        if (!user) throw new Error('User not authenticated.');
        if (!businessId) throw new Error('Business ID not found.');

        const data = getValues();
        const statusToUse = (data.status || defaultStatus || 'Pending') as 'Draft' | 'Pending' | 'Paid';
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const taxAmount = subtotal * (watchedTaxRate / 100);
        const grandTotal = subtotal + taxAmount;
        
        const firestoreData = {
            ...data,
            issueDate: Timestamp.fromDate(data.issueDate),
            dueDate: Timestamp.fromDate(data.dueDate),
            grandTotal,
            createdBy: user.uid,
            businessId: businessId,
            status: statusToUse,
            updatedAt: serverTimestamp(),
            isPublic: statusToUse !== 'Draft',
            paymentMethod: data.paymentMethod || 'rapyd',
            isRecurring: data.isRecurring || false,
            recurringFrequency: data.isRecurring ? data.recurringFrequency : null,
            recurringEndDate: data.isRecurring && data.recurringEndDate ? Timestamp.fromDate(data.recurringEndDate) : null,
        };

        if (savedInvoiceId) {
            const docRef = doc(db, 'businessInvoices', savedInvoiceId);
            await updateDoc(docRef, firestoreData);
            
            // Trigger PDF regeneration if status changed to non-draft
            if (statusToUse !== 'Draft') {
              fetch('/api/generate-invoice-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId: savedInvoiceId }),
              }).catch(err => console.error('Failed to trigger PDF generation:', err));
            }
            
            return savedInvoiceId;
        } else {
            const docRef = await addDoc(collection(db, 'businessInvoices'), {
                ...firestoreData,
                createdAt: serverTimestamp(),
            });
            const publicUrl = `${window.location.origin}/invoice/${docRef.id}`;
            await updateDoc(docRef, { publicUrl });
            const newId = docRef.id;
            
            // Trigger PDF generation for non-draft invoices (async, don't wait)
            if (statusToUse !== 'Draft') {
              fetch('/api/generate-invoice-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId: newId }),
              }).catch(err => console.error('Failed to trigger PDF generation:', err));
            }
            
            return newId;
        }
    };
    
    const handleSaveAsDraft = async () => {
        const isValid = await trigger();
        if (!isValid) {
            toast({ title: "Incomplete Form", description: "Please fill out all required fields to save a draft.", variant: "destructive" });
            return;
        }
        
        setIsSaving(true);
        try {
            await saveInvoice('Draft');
            toast({ title: "Draft Saved", description: "Your invoice has been saved as a draft." });
            onBack();
        } catch (error: any) {
            console.error("Error saving draft:", error);
            let errorMessage = 'Could not save draft.';
            
            // Provide more specific error messages
            if (error?.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please ensure your account is verified (KYC Tier 1) and you have a business profile set up.';
            } else if (error?.message?.includes('Business ID')) {
                errorMessage = 'Business profile not found. Please set up your business profile first.';
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            toast({ 
                title: 'Error', 
                description: errorMessage, 
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };


    const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
        setIsSaving(true);
        try {
            const finalInvoiceId = await saveInvoice('Pending');
            setSavedInvoiceId(finalInvoiceId); // Ensure state is updated
            
            // Small delay to ensure invoice is fully committed to Firestore
            // before trying to fetch it via API
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setShowSendDialog(true);
        } catch (error: any) {
            console.error("Error sending invoice:", error);
            let errorMessage = 'Could not send the invoice.';
            
            // Provide more specific error messages
            if (error?.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please ensure your account is verified (KYC Tier 1) and you have a business profile set up.';
            } else if (error?.message?.includes('Business ID')) {
                errorMessage = 'Business profile not found. Please set up your business profile first.';
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            toast({ 
                title: 'Error', 
                description: errorMessage, 
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
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
                     <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-start w-full">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="invoiceNumber">Invoice #</Label>
                            <Input id="invoiceNumber" {...register('invoiceNumber')} className="h-10" />
                        </div>
                         <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label>Currency</Label>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue>{currencyOptions.find(c => c.value === field.value)?.label || 'Select Currency'}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencyOptions.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.currency && <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>}
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value || 'Pending'}>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Draft">Draft</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Invoice Date</Label>
                             <Controller name="issueDate" control={control} render={({ field }) => (
                                <Popover open={isIssueDateOpen} onOpenChange={setIsIssueDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar 
                                            mode="single" 
                                            selected={field.value} 
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setIsIssueDateOpen(false);
                                            }} 
                                        />
                                    </PopoverContent>
                                </Popover>
                            )} />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Due Date</Label>
                            <Controller name="dueDate" control={control} render={({ field }) => (
                                <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar 
                                            mode="single" 
                                            selected={field.value} 
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setIsDueDateOpen(false);
                                            }} 
                                        />
                                    </PopoverContent>
                                </Popover>
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
                            {errors.toName && <p className="text-sm text-destructive mt-1">{errors.toName.message}</p>}
                            <Input {...register('toEmail')} placeholder="Client's Email" className="mt-2" />
                            {errors.toEmail && <p className="text-sm text-destructive mt-1">{errors.toEmail.message}</p>}
                            <Textarea {...register('toAddress')} placeholder="Client's Address" className="mt-2" />
                             {errors.toAddress && <p className="text-sm text-destructive mt-1">{errors.toAddress.message}</p>}
                        </div>
                    </div>

                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[50%]">Description</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id} className="align-top">
                                    <TableCell><Input {...register(`items.${index}.description`)} placeholder="Service or product" /></TableCell>
                                    <TableCell><Input type="number" {...register(`items.${index}.quantity`)} placeholder="1" className="w-20" /></TableCell>
                                    <TableCell>
                                        <Controller
                                            name={`items.${index}.price`}
                                            control={control}
                                            render={({ field: priceField }) => (
                                                <Input
                                                    type="text"
                                                    placeholder="0.00"
                                                    className="w-24"
                                                    value={formatNumberInput(String(priceField.value || ''))}
                                                    onChange={(e) => {
                                                        const parsed = parseFormattedNumber(e.target.value);
                                                        priceField.onChange(parsed ? parseFloat(parsed) : 0);
                                                    }}
                                                    onBlur={() => {
                                                        const parsed = parseFormattedNumber(String(priceField.value || ''));
                                                        if (parsed) {
                                                            priceField.onChange(parseFloat(parsed));
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right pt-4 font-medium">{formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0), selectedCurrency)}</TableCell>
                                    <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                    
                    {/* Recurring Invoice Section */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Controller
                                name="isRecurring"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        id="isRecurring"
                                        checked={field.value || false}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                )}
                            />
                            <Label htmlFor="isRecurring" className="font-semibold cursor-pointer">Make this a recurring invoice</Label>
                        </div>
                        
                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="recurringFrequency">Frequency</Label>
                                    <Controller
                                        name="recurringFrequency"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value || 'monthly'}>
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date (Optional)</Label>
                                    <Controller
                                        name="recurringEndDate"
                                        control={control}
                                        render={({ field }) => (
                                            <Popover open={isRecurringEndDateOpen} onOpenChange={setIsRecurringEndDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date (optional)</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={(date) => {field.onChange(date); setIsRecurringEndDateOpen(false);}} />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="grid grid-cols-2 gap-8 items-start">
                        <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...register('notes')} /></div>
                        <div className="space-y-2">
                             <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, selectedCurrency)}</span></div>
                             <div className="flex justify-between items-center"><Label htmlFor="taxRate">Tax (%)</Label><Input type="number" step="0.01" id="taxRate" {...register('taxRate')} className="w-20 h-8" placeholder="0" /></div>
                             <div className="flex justify-between"><span className="text-muted-foreground">Tax Amount</span><span className="font-medium">{formatCurrency(taxAmount, selectedCurrency)}</span></div>
                             <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Grand Total</span><span>{formatCurrency(grandTotal, selectedCurrency)}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={isSaving}>Save as Draft</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Send className="mr-2 h-4 w-4" />{isEditing ? 'Update & Send' : 'Save & Send'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
         {showSendDialog && (
            <SendInvoiceDialog
                isOpen={showSendDialog}
                setIsOpen={setShowSendDialog}
                invoiceId={savedInvoiceId}
                onSuccessfulSend={onBack}
            />
        )}
    </div>
  );
}

    