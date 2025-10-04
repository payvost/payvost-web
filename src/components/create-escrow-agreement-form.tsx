
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2, Plus, Send, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const milestoneSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.preprocess(
    (val) => Number(String(val)),
    z.number().positive('Must be > 0')
  ),
});

const agreementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  sellerEmail: z.string().email('Invalid email for seller'),
  buyerEmail: z.string().email('Invalid email for buyer'),
  mediatorEmail: z.string().email('Invalid email for mediator').optional(),
  milestones: z.array(milestoneSchema).min(1, 'At least one milestone is required'),
});

type AgreementFormValues = z.infer<typeof agreementSchema>;

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
};

interface CreateEscrowAgreementFormProps {
    onBack: () => void;
}

export function CreateEscrowAgreementForm({ onBack }: CreateEscrowAgreementFormProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
            title: '',
            description: '',
            currency: 'USD',
            sellerEmail: '',
            buyerEmail: '',
            mediatorEmail: '',
            milestones: [{ description: '', amount: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'milestones',
    });

    const watchedMilestones = watch('milestones');
    const selectedCurrency = watch('currency');
    const currencySymbol = currencySymbols[selectedCurrency] || '$';
    
    const totalAmount = watchedMilestones.reduce((acc, item) => acc + (item.amount || 0), 0);
    
    const formatCurrency = (amount: number) => {
        return `${currencySymbol}${amount.toFixed(2)}`;
    }

    const onSubmit: SubmitHandler<AgreementFormValues> = async (data) => {
        if (!user) {
            toast({ title: 'Authentication Error', description: 'You must be logged in to create an agreement.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'escrow'), {
                ...data,
                totalAmount,
                userIds: [user.uid], // Link the agreement to the creator
                status: 'Awaiting Funding',
                createdAt: serverTimestamp(),
            });

            toast({
                title: "Agreement Sent for Review",
                description: "All parties have been notified to review and fund the agreement.",
            });
            onBack();
        } catch (error) {
            console.error("Error creating escrow agreement: ", error);
            toast({
                title: "Error",
                description: "Could not create the agreement. Please try again.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Create Escrow Agreement</h1>
                    <p className="text-muted-foreground text-sm">Fill out the form below to create a new agreement.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="p-6 space-y-8">
                        {/* Agreement Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Agreement Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Agreement Title</Label>
                                    <Input id="title" {...register('title')} placeholder="e.g., Website Development Project" />
                                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
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
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="description">Scope of Work / Description</Label>
                                <Textarea id="description" {...register('description')} placeholder="Describe the terms of the agreement." />
                            </div>
                        </div>

                        <Separator />
                        
                        {/* Parties */}
                        <div className="space-y-4">
                             <h3 className="text-lg font-medium">Parties Involved</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="buyerEmail">Buyer's Email</Label>
                                    <Input id="buyerEmail" type="email" {...register('buyerEmail')} placeholder="buyer@example.com" />
                                     {errors.buyerEmail && <p className="text-sm text-destructive">{errors.buyerEmail.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sellerEmail">Seller's Email</Label>
                                    <Input id="sellerEmail" type="email" {...register('sellerEmail')} placeholder="seller@example.com" />
                                    {errors.sellerEmail && <p className="text-sm text-destructive">{errors.sellerEmail.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mediatorEmail">Mediator's Email (Optional)</Label>
                                    <Input id="mediatorEmail" type="email" {...register('mediatorEmail')} placeholder="mediator@example.com" />
                                     {errors.mediatorEmail && <p className="text-sm text-destructive">{errors.mediatorEmail.message}</p>}
                                </div>
                             </div>
                        </div>

                         <Separator />

                        {/* Milestones */}
                        <div>
                            <h3 className="text-lg font-medium">Payment Milestones</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60%]">Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Input {...register(`milestones.${index}.description`)} placeholder="e.g., Initial Deposit, Final Payment"/>
                                                {errors.milestones?.[index]?.description && <p className="text-sm text-destructive mt-1">{errors.milestones[index]?.description?.message}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" {...register(`milestones.${index}.amount`)} placeholder="0.00" className="w-32 text-right ml-auto" />
                                                 {errors.milestones?.[index]?.amount && <p className="text-sm text-destructive mt-1">{errors.milestones[index]?.amount?.message}</p>}
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
                            {errors.milestones && <p className="text-sm text-destructive mt-2">{errors.milestones.message}</p>}
                            <div className="flex justify-between items-center mt-4">
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', amount: 0 })}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Milestone
                                </Button>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Total Amount</p>
                                    <p className="font-bold text-2xl">{formatCurrency(totalAmount)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                         <Button type="button" variant="outline">Save as Draft</Button>
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : <><ShieldCheck className="mr-2 h-4 w-4" />Create & Send for Review</>}
                         </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
