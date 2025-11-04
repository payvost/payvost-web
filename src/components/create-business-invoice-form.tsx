
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
import { ArrowLeft, CalendarIcon, Send, Trash2, Plus, Loader2, Banknote, Landmark, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { SendInvoiceDialog } from './send-invoice-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, doc, addDoc, serverTimestamp, Timestamp, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';

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
  paymentMethod: z.enum(['payvost', 'manual']),
  manualBankName: z.string().optional(),
  manualAccountName: z.string().optional(),
  manualAccountNumber: z.string().optional(),
  manualOtherDetails: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'manual') {
        return !!data.manualBankName && !!data.manualAccountName && !!data.manualAccountNumber;
    }
    return true;
}, {
    message: "Bank Name, Account Name, and Account Number are required for manual bank transfers.",
    path: ["manualBankName"],
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
            taxRate: 0, currency: 'USD', paymentMethod: 'payvost',
            invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        },
  });
  
    useEffect(() => {
        if (!user) {
            if (!authLoading) setLoadingUserData(false);
            return;
        }
        
        if (isEditing && invoiceId) {
            const fetchInvoice = async () => {
                const docRef = doc(db, 'businessInvoices', invoiceId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().createdBy === user.uid) {
                    const data = docSnap.data();
                    reset({
                        ...data,
                        issueDate: data.issueDate.toDate(),
                        dueDate: data.dueDate.toDate(),
                    });
                     setBusinessId(data.businessId);
                }
            };
            fetchInvoice().finally(() => setLoadingUserData(false));
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
    const paymentMethod = watch('paymentMethod');
    
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const taxAmount = subtotal * (watchedTaxRate / 100);
    const grandTotal = subtotal + taxAmount;

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
    };

    const saveInvoice = async (status: 'Draft' | 'Pending') => {
        if (!user) throw new Error('User not authenticated.');
        if (!businessId) throw new Error('Business ID not found.');

        const data = getValues();
        const firestoreData = {
            ...data,
            issueDate: Timestamp.fromDate(data.issueDate),
            dueDate: Timestamp.fromDate(data.dueDate),
            grandTotal,
            createdBy: user.uid,
            businessId: businessId,
            status,
            updatedAt: serverTimestamp(),
            isPublic: status !== 'Draft',
        };

        if (savedInvoiceId) {
            const docRef = doc(db, 'businessInvoices', savedInvoiceId);
            await updateDoc(docRef, firestoreData);
            return savedInvoiceId;
        } else {
            const docRef = await addDoc(collection(db, 'businessInvoices'), {
                ...firestoreData,
                createdAt: serverTimestamp(),
            });
            const publicUrl = `${window.location.origin}/invoice/${docRef.id}`;
            await updateDoc(docRef, { publicUrl });
            return docRef.id;
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
        } catch (error) {
            console.error("Error saving draft:", error);
            toast({ title: 'Error', description: 'Could not save draft.', variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };


    const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
        setIsSaving(true);
        try {
            const finalInvoiceId = await saveInvoice('Pending');
            setSavedInvoiceId(finalInvoiceId); // Ensure state is updated
            setShowSendDialog(true);
        } catch (error) {
             console.error("Error sending invoice:", error);
            toast({ title: 'Error', description: 'Could not send the invoice.', variant: 'destructive'});
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
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start w-full">
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
                             <div className="flex justify-between items-center"><Label htmlFor="taxRate">Tax (%)</Label><Input type="number" step="0.01" id="taxRate" {...register('taxRate')} className="w-20 h-8" placeholder="0" /></div>
                             <div className="flex justify-between"><span className="text-muted-foreground">Tax Amount</span><span className="font-medium">{formatCurrency(taxAmount, selectedCurrency)}</span></div>
                             <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Grand Total</span><span>{formatCurrency(grandTotal, selectedCurrency)}</span></div>
                        </div>
                    </div>
                     <Separator />
                     <div className="space-y-4">
                        <Label className="font-semibold">Payment Method</Label>
                        <Controller
                            name="paymentMethod"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Label htmlFor="payvost" className={cn("flex flex-col items-start rounded-md border-2 p-4 cursor-pointer", field.value === 'payvost' && 'border-primary')}>
                                        <RadioGroupItem value="payvost" id="payvost" className="sr-only" />
                                        <div className="flex items-center gap-2 font-semibold"><Wallet className="h-5 w-5"/>Payvost Checkout</div>
                                        <p className="text-sm text-muted-foreground mt-1">Allow client to pay securely via Card, Bank Transfer, or their Payvost Wallet.</p>
                                    </Label>
                                     <Label htmlFor="manual" className={cn("flex flex-col items-start rounded-md border-2 p-4 cursor-pointer", field.value === 'manual' && 'border-primary')}>
                                        <RadioGroupItem value="manual" id="manual" className="sr-only" />
                                        <div className="flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5"/>Manual Bank Transfer</div>
                                        <p className="text-sm text-muted-foreground mt-1">Provide your bank details for the client to transfer money to.</p>
                                    </Label>
                                </RadioGroup>
                            )}
                        />
                        {paymentMethod === 'manual' && (
                            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Bank Name</Label><Input {...register('manualBankName')} placeholder="e.g., Chase Bank" /></div>
                                    <div className="space-y-2"><Label>Account Holder Name</Label><Input {...register('manualAccountName')} placeholder="e.g., John Doe" /></div>
                                </div>
                                <div className="space-y-2"><Label>Account Number</Label><Input {...register('manualAccountNumber')} placeholder="e.g., 1234567890" /></div>
                                <div className="space-y-2"><Label>Other Details (Optional)</Label><Textarea {...register('manualOtherDetails')} placeholder="e.g., SWIFT/BIC, Routing Number, IBAN" /></div>
                                 {errors.manualBankName && <p className="text-sm text-destructive">{errors.manualBankName.message}</p>}
                            </div>
                        )}
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

    