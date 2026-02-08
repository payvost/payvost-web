
'use client';

import { useFieldArray, useForm, Controller, SubmitHandler, type FieldPath } from 'react-hook-form';
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
import { ArrowLeft, CalendarIcon, Download, Printer, Send, Trash2, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SendInvoiceDialog } from './send-invoice-dialog';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface CreateInvoicePageProps {
  onBack?: () => void;
  onFinished?: () => void;
  invoiceId?: string | null;
  variant?: 'page' | 'embedded';
  disabled?: boolean;
}


export function CreateInvoicePage({ onBack, onFinished, invoiceId, variant = 'page', disabled = false }: CreateInvoicePageProps) {
    const { toast } = useToast();
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(invoiceId ?? null);
    const { user, loading: authLoading } = useAuth();
    const [loadingUserData, setLoadingUserData] = useState(true);
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(true);
    const [isDueDateOpen, setIsDueDateOpen] = useState(false);
    const [isIssueDateOpen, setIsIssueDateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const isEditing = !!invoiceId;

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        trigger,
        reset,
        formState: { errors },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        mode: 'onTouched',
        defaultValues: {
            issueDate: new Date(),
            dueDate: addDays(new Date(), 30),
            fromName: '',
            fromAddress: '',
            toName: '',
            toEmail: '',
            toAddress: '',
            items: [{ description: '', quantity: 1, price: 0 }],
            notes: 'Thank you for your business. Please pay within 30 days.',
            taxRate: 0,
            currency: 'USD',
            paymentMethod: 'rapyd',
        },
    });

    useEffect(() => {
        setStep(0);
    }, [invoiceId]);

     useEffect(() => {
        if (!isEditing || !invoiceId) return;
        if (!user) return;

        let cancelled = false;

        (async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/v1/invoices/${invoiceId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store',
                });

                if (!res.ok) {
                    throw new Error(`Failed to load invoice (${res.status})`);
                }

                const invoice = await res.json();
                if (cancelled) return;

                reset({
                    issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
                    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
                    currency: invoice.currency || 'USD',
                    fromName: invoice.fromName || '',
                    fromAddress: invoice.fromAddress || '',
                    toName: invoice.toName || '',
                    toEmail: invoice.toEmail || '',
                    toAddress: invoice.toAddress || '',
                    items: Array.isArray(invoice.items) ? invoice.items : [{ description: '', quantity: 1, price: 0 }],
                    notes: invoice.notes || '',
                    taxRate: invoice.taxRate || 0,
                    paymentMethod: invoice.paymentMethod || 'rapyd',
                });
            } catch (e: unknown) {
                console.error('Failed to load invoice:', e);
                const msg = e instanceof Error ? e.message : 'Failed to load invoice';
                toast({ title: 'Error', description: msg, variant: 'destructive' });
            } finally {
                setLoadingUserData(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isEditing, invoiceId, reset, toast, user]);
    
    useEffect(() => {
        if (!user) {
            if (!authLoading) {
                 setLoadingUserData(false);
            }
            return;
        }

        if (isEditing) {
            setLoadingUserData(false);
            return;
        }

        const userDocUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setValue('fromName', data.name || user.displayName || '');
                const address = `${data.street || ''}\n${data.city || ''}, ${data.state || ''} ${data.zip || ''}`;
                setValue('fromAddress', address.trim());
            }
            setLoadingUserData(false);
        });

        return () => {
            userDocUnsub();
        };
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
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
        } catch {
            const formattedAmount = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
            return `${currency} ${formattedAmount}`;
        }
    };

    const currencyOptions = useMemo(() => {
        return availableCurrencies.map((c) => ({ value: c, label: c }));
    }, [availableCurrencies]);

    useEffect(() => {
        if (!user) {
            setAvailableCurrencies([]);
            setLoadingCurrencies(false);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoadingCurrencies(true);
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/wallet/accounts?workspaceType=PERSONAL&limit=200', {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });

                if (!res.ok) throw new Error(`Failed to load wallets (${res.status})`);
                const data = await res.json();
                if (cancelled) return;

                const accounts: Array<{ currency?: unknown }> = Array.isArray(data?.accounts) ? data.accounts : [];
                const currencies = Array.from(
                    new Set(
                        accounts
                            .map((a) => String(a?.currency || '').toUpperCase())
                            .filter((c) => Boolean(c))
                    )
                ).sort();

                setAvailableCurrencies(currencies);
            } catch (e: unknown) {
                console.error('Failed to load wallet currencies:', e);
                setAvailableCurrencies([]);
            } finally {
                if (!cancelled) setLoadingCurrencies(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user]);

    useEffect(() => {
        if (loadingCurrencies) return;
        if (!availableCurrencies.length) return;
        const current = String(getValues('currency') || '').toUpperCase();
        if (!availableCurrencies.includes(current)) {
            setValue('currency', availableCurrencies[0], { shouldValidate: true, shouldTouch: true });
        }
    }, [availableCurrencies, getValues, loadingCurrencies, setValue]);

    const mapPaymentMethod = (value: string | undefined) => {
        const v = String(value || '').toLowerCase();
        if (v === 'stripe') return 'STRIPE';
        if (v === 'rapyd') return 'RAPYD';
        if (v === 'manual') return 'MANUAL';
        if (v === 'payvost') return 'PAYVOST';
        return 'PAYVOST';
    };

    const resetForNewInvoice = useCallback(() => {
        const preservedFromName = getValues('fromName');
        const preservedFromAddress = getValues('fromAddress');
        const preferredCurrency = String(getValues('currency') || '').toUpperCase();
        const nextCurrency = availableCurrencies.includes(preferredCurrency)
            ? preferredCurrency
            : (availableCurrencies[0] || preferredCurrency || 'USD');
        reset({
            issueDate: new Date(),
            dueDate: addDays(new Date(), 30),
            currency: nextCurrency,
            fromName: preservedFromName,
            fromAddress: preservedFromAddress,
            toName: '',
            toEmail: '',
            toAddress: '',
            items: [{ description: '', quantity: 1, price: 0 }],
            notes: 'Thank you for your business. Please pay within 30 days.',
            taxRate: 0,
            paymentMethod: 'rapyd',
        });
        setSavedInvoiceId(null);
        setStep(0);
    }, [availableCurrencies, getValues, reset]);

    const prevInvoiceIdRef = useRef<string | null | undefined>(invoiceId);
    useEffect(() => {
        const prev = prevInvoiceIdRef.current;
        if (invoiceId && invoiceId !== prev) {
            setSavedInvoiceId(invoiceId);
        }
        if (!invoiceId && prev && variant === 'embedded') {
            // Switching from edit mode back to "new invoice" within the same mounted form.
            resetForNewInvoice();
        }
        prevInvoiceIdRef.current = invoiceId;
    }, [invoiceId, resetForNewInvoice, variant]);

    const upsertDraft = async () => {
        if (!user) {
            toast({ title: 'Not authenticated', variant: 'destructive'});
            throw new Error('User not authenticated');
        }

        const data = getValues();
        const token = await user.getIdToken();

        const payload = {
            invoiceType: 'USER',
            currency: data.currency,
            issueDate: data.issueDate.toISOString(),
            dueDate: data.dueDate.toISOString(),
            fromInfo: {
                name: data.fromName || user.displayName || '',
                address: data.fromAddress || '',
                email: user.email || undefined,
            },
            toInfo: {
                name: data.toName,
                address: data.toAddress,
                email: data.toEmail,
            },
            items: data.items,
            taxRate: data.taxRate || 0,
            notes: data.notes || '',
            paymentMethod: mapPaymentMethod(data.paymentMethod),
        };

        if (savedInvoiceId) {
            const res = await fetch(`/api/v1/invoices/${savedInvoiceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
                cache: 'no-store',
            });
            if (!res.ok) throw new Error(`Failed to save draft (${res.status})`);
            return savedInvoiceId;
        }

        const res = await fetch('/api/v1/invoices/drafts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Failed to create draft (${res.status})`);
        const created = await res.json();
        const newId = created?.id;
        if (!newId) throw new Error('Invalid draft response');
        setSavedInvoiceId(newId);
        return newId as string;
    };


    const onSubmit: SubmitHandler<InvoiceFormValues> = async () => {
        if (disabled) {
            toast({ title: 'Verification required', description: 'Complete verification to create invoices.', variant: 'destructive' });
            return;
        }
        // Prevent accidental submit (e.g. pressing Enter) before the final step.
        if (step !== 2) {
            await handleNextStep();
            return;
        }
        setIsSaving(true);
        try {
            const finalInvoiceId = await upsertDraft();
            // Issue+send (server will issue drafts automatically)
            if (!user) throw new Error('User not authenticated');
            const token = await user.getIdToken();
            const sendRes = await fetch(`/api/v1/invoices/${finalInvoiceId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ channel: 'email' }),
                cache: 'no-store',
            });
            if (!sendRes.ok) throw new Error(`Failed to send invoice (${sendRes.status})`);
            setShowSendDialog(true);
        } catch (error) {
            console.error("Error sending invoice:", error);
            toast({ title: 'Error', description: 'Could not send the invoice.', variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAsDraft = async () => {
        if (disabled) {
            toast({ title: 'Verification required', description: 'Complete verification to create invoices.', variant: 'destructive' });
            return;
        }
        const isValid = await trigger();
        if (!isValid) {
            toast({
                title: "Incomplete Form",
                description: "Please fill out required fields before saving.",
                variant: "destructive"
            });
            return;
        }
        
        setIsSaving(true);
        try {
            await upsertDraft();
            toast({ title: "Draft Saved", description: "Your invoice has been saved." });
            if (variant === 'embedded') {
                resetForNewInvoice();
            }
            onFinished?.();
            onBack?.();
        } catch (error) {
            console.error("Error saving draft:", error);
            toast({ title: 'Error', description: 'Could not save draft.', variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };

    const handleNextStep = async () => {
        const fieldsToValidate: FieldPath<InvoiceFormValues>[] | undefined = step === 0
            ? ['currency', 'issueDate', 'dueDate', 'toName', 'toEmail', 'toAddress']
            : undefined;

        const ok = fieldsToValidate ? await trigger(fieldsToValidate) : await trigger();
        if (!ok) {
            toast({
                title: "Missing Required Fields",
                description: "Please fix the highlighted fields before continuing.",
                variant: "destructive",
            });
            return;
        }

        setStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s));
    };

    const handlePrevStep = () => {
        setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : s));
    };

    return (
        <div>
            {variant === 'page' && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back</span>
                            </Button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h1>
                            <p className="text-muted-foreground text-sm">Create a professional invoice in 3 steps.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled><Printer className="mr-2 h-4 w-4"/>Print</Button>
                        <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader className="space-y-4">
                        {variant === 'embedded' && (
                            <div>
                                <CardTitle>{isEditing ? 'Edit Invoice' : 'Create Invoice'}</CardTitle>
                                <CardDescription>Step {step + 1} of 3</CardDescription>
                            </div>
                        )}

                        <ol className="flex flex-wrap items-center gap-3 text-sm">
                            {[
                                { label: 'Details', idx: 0 as const },
                                { label: 'Line Items', idx: 1 as const },
                                { label: 'Review', idx: 2 as const },
                            ].map((s, i) => (
                                <li key={s.label} className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                                            step >= s.idx ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground",
                                        )}
                                    >
                                        {s.idx + 1}
                                    </span>
                                    <span className={cn(step === s.idx ? "font-medium text-foreground" : "text-muted-foreground")}>
                                        {s.label}
                                    </span>
                                    {i < 2 && <span className="mx-1 h-px w-6 bg-muted" />}
                                </li>
                            ))}
                        </ol>

                        {step === 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-start w-full">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Invoice</Label>
                                <Input value={isEditing ? 'Editing draft' : 'New draft'} readOnly className="h-10" />
                                <div className="h-4" />
                            </div>
                             <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Currency</Label>
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger
                                                type="button"
                                                className="h-10"
                                                disabled={disabled || loadingCurrencies || currencyOptions.length === 0}
                                            >
                                                <SelectValue>
                                                    {loadingCurrencies
                                                        ? 'Loading...'
                                                        : currencyOptions.find(c => c.value === field.value)?.label || 'Select Currency'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencyOptions.map(c => (
                                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <div className="h-4">
                                 {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
                                </div>
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Invoice Date</Label>
                                <Controller
                                    name="issueDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={isIssueDateOpen} onOpenChange={setIsIssueDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(date) => {field.onChange(date); setIsIssueDateOpen(false);}} /></PopoverContent>
                                        </Popover>
                                    )}
                                />
                                 <div className="h-4">
                                    {errors.issueDate && <p className="text-sm text-destructive">{errors.issueDate.message}</p>}
                                 </div>
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Status</Label>
                                <Input value="Draft" readOnly className="h-10" />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Due Date</Label>
                                <Controller
                                    name="dueDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(date) => {field.onChange(date); setIsDueDateOpen(false);}} /></PopoverContent>
                                        </Popover>
                                    )}
                                />
                                 <div className="h-4">
                                  {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                                 </div>
                            </div>
                        </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {step === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        )}

                        {step === 1 && (
                        <div className="space-y-8">
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
                                        <TableRow key={field.id} className="align-top">
                                            <TableCell className="pt-2">
                                                <Input {...register(`items.${index}.description`)} placeholder="Service or product description"/>
                                                <div className="h-4 mt-1">
                                                    {errors.items?.[index]?.description && <p className="text-sm text-destructive">{errors.items[index]?.description?.message}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pt-2">
                                                <Input type="number" {...register(`items.${index}.quantity`)} placeholder="1" className="w-20" />
                                                <div className="h-4 mt-1">
                                                    {errors.items?.[index]?.quantity && <p className="text-sm text-destructive">{errors.items[index]?.quantity?.message}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pt-2">
                                                <Input type="number" {...register(`items.${index}.price`)} placeholder="0.00" className="w-24" />
                                                <div className="h-4 mt-1">
                                                    {errors.items?.[index]?.price && <p className="text-sm text-destructive">{errors.items[index]?.price?.message}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pt-4 font-medium">
                                                {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0), selectedCurrency)}
                                            </TableCell>
                                            <TableCell className="text-right pt-2">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {errors.items && typeof errors.items === 'object' && 'message' in errors.items && <p className="text-sm text-destructive mt-2">{errors.items.message}</p>}
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-4">
                             <div className="lg:col-span-2 space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" {...register('notes')} placeholder="Additional information for the client" className="min-h-[120px]"/>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(subtotal, selectedCurrency)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="taxRate">Tax (%)</Label>
                                    <Input type="number" step="0.01" id="taxRate" {...register('taxRate')} className="w-20 h-8" placeholder="0" />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax Amount</span>
                                    <span className="font-medium">{formatCurrency(taxAmount, selectedCurrency)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                    <span>Grand Total</span>
                                    <span>{formatCurrency(grandTotal, selectedCurrency)}</span>
                                </div>
                            </div>
                        </div>
                        </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="rounded-md border p-4">
                                        <div className="text-xs text-muted-foreground">From</div>
                                        <div className="mt-1 font-medium">{getValues('fromName') || 'You'}</div>
                                        <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{getValues('fromAddress') || ''}</div>
                                    </div>
                                    <div className="rounded-md border p-4">
                                        <div className="text-xs text-muted-foreground">To</div>
                                        <div className="mt-1 font-medium">{getValues('toName') || 'Client'}</div>
                                        <div className="mt-1 text-sm text-muted-foreground">{getValues('toEmail') || ''}</div>
                                        <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{getValues('toAddress') || ''}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-md border p-4">
                                        <div className="text-xs text-muted-foreground">Invoice Date</div>
                                        <div className="mt-1 font-medium">{getValues('issueDate') ? format(getValues('issueDate'), 'PPP') : ''}</div>
                                    </div>
                                    <div className="rounded-md border p-4">
                                        <div className="text-xs text-muted-foreground">Due Date</div>
                                        <div className="mt-1 font-medium">{getValues('dueDate') ? format(getValues('dueDate'), 'PPP') : ''}</div>
                                    </div>
                                    <div className="rounded-md border p-4">
                                        <div className="text-xs text-muted-foreground">Total</div>
                                        <div className="mt-1 font-medium">{formatCurrency(grandTotal, selectedCurrency)}</div>
                                    </div>
                                </div>

                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {watchedItems.map((it, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{it.description || `Item ${idx + 1}`}</TableCell>
                                                    <TableCell className="text-right">{it.quantity}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(Number(it.price || 0), selectedCurrency)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency((Number(it.quantity || 0) * Number(it.price || 0)), selectedCurrency)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                            {step > 0 && (
                                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isSaving}>
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            {(step === 1 || step === 2) && (
                                <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={isSaving || disabled}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save as Draft
                                </Button>
                            )}
                            {step < 2 ? (
                                <Button type="button" onClick={handleNextStep} disabled={isSaving}>
                                    Next
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSaving || disabled}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Send className="mr-2 h-4 w-4" />
                                    {isEditing ? 'Update & Send' : 'Send Invoice'}
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </form>
             {showSendDialog && (
                <SendInvoiceDialog
                    isOpen={showSendDialog}
                    setIsOpen={setShowSendDialog}
                    invoiceId={savedInvoiceId}
                    onSuccessfulSend={() => {
                        if (variant === 'embedded') {
                            resetForNewInvoice();
                        }
                        onFinished?.();
                        onBack?.();
                    }}
                />
            )}
        </div>
    );
}
