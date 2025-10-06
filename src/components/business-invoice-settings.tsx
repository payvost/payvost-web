
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Percent, Repeat, FileText, Settings, Loader2, UploadCloud } from 'lucide-react';
import type { InvoiceSettings } from '@/types/business-invoice-settings';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


const invoiceSettingsSchema = z.object({
  defaultFooter: z.string().optional(),
  enableTax: z.boolean(),
  defaultTaxRate: z.preprocess((val) => (val === '' ? 0 : Number(val)), z.number().min(0, 'Tax rate cannot be negative').optional()),
  autoInvoiceForRecurring: z.boolean(),
});

type InvoiceFormValues = z.infer<typeof invoiceSettingsSchema>;

const mockSettings: InvoiceSettings = {
    defaultFooter: 'Thank you for your business. Please pay within 30 days.',
    enableTax: true,
    defaultTaxRate: 8.5,
    autoInvoiceForRecurring: true,
};

export function BusinessInvoiceSettings() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSavingLogo, setIsSavingLogo] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSettingsSchema),
        defaultValues: {
            ...mockSettings
        }
    });

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const businessProfile = doc.data().businessProfile;
                if (businessProfile?.invoiceLogoUrl) {
                    setLogoPreview(businessProfile.invoiceLogoUrl);
                }
                 // If you save invoice settings to the user doc, you can reset the form here
                 // reset(businessProfile.invoiceSettings || mockSettings);
            }
        });
        return () => unsub();
    }, [user, reset]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: 'File too large', description: 'Logo should be less than 2MB.', variant: 'destructive' });
                return;
            }
            if(!file.type.startsWith('image/')) {
                toast({ title: 'Invalid File Type', description: 'Please upload a PNG or JPG file.', variant: 'destructive' });
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

     const handleSaveLogo = async () => {
        if (!user || !logoFile) return;

        setIsSavingLogo(true);
        try {
            const storageRef = ref(storage, `invoice_logos/${user.uid}/${logoFile.name}`);
            await uploadBytes(storageRef, logoFile);
            const downloadURL = await getDownloadURL(storageRef);

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                'businessProfile.invoiceLogoUrl': downloadURL
            });
            
            toast({ title: 'Logo Updated', description: 'Your new invoice logo has been saved.' });
            setLogoFile(null);
        } catch (error) {
            console.error("Error updating logo:", error);
            toast({ title: 'Upload Failed', description: 'Could not save your new logo.', variant: 'destructive' });
        } finally {
            setIsSavingLogo(false);
        }
    };


    const onSubmit = async (data: InvoiceFormValues) => {
        console.log(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Here you would save the data to firestore, e.g.
        // if (user) {
        //   const userDocRef = doc(db, 'users', user.uid);
        //   await updateDoc(userDocRef, { 'businessProfile.invoiceSettings': data });
        // }
        toast({
            title: 'Invoice Settings Updated',
            description: 'Your invoice and tax preferences have been saved.',
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Customization</CardTitle>
                    <CardDescription>Customize the look and feel of your invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label>Business Logo</Label>
                        <div className="flex items-center gap-6 p-4 border rounded-lg">
                             <Avatar className="h-20 w-20 rounded-md">
                                <AvatarImage src={logoPreview || undefined} className="object-contain" />
                                <AvatarFallback className="rounded-md">Logo</AvatarFallback>
                            </Avatar>
                             <div className="flex-1">
                                <h4 className="font-semibold">Upload your invoice logo</h4>
                                <Label htmlFor="logo-upload" className="inline-flex items-center justify-center h-9 px-4 py-2 mt-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                                </Label>
                                <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg"/>
                                <p className="text-xs text-muted-foreground mt-2">PNG or JPG, max 2MB. Recommended: 300x150px.</p>
                                {logoFile && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <p className="text-xs font-medium truncate">{logoFile.name}</p>
                                        <Button size="sm" onClick={handleSaveLogo} disabled={isSavingLogo}>
                                             {isSavingLogo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Logo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="defaultFooter">Default Invoice Footer</Label>
                        <Textarea id="defaultFooter" {...register('defaultFooter')} rows={3} placeholder="e.g., Thank you for your payment."/>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Tax Configuration</CardTitle>
                    <CardDescription>Manage tax settings for your invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                             <Label htmlFor="enableTax" className="text-base font-semibold">Enable Tax Collection</Label>
                             <p className="text-sm text-muted-foreground">Automatically add tax to your invoices.</p>
                        </div>
                        <Controller name="enableTax" control={control} render={({field}) => (<Switch id="enableTax" checked={field.value} onCheckedChange={field.onChange} />)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                        <div className="relative">
                            <Input id="defaultTaxRate" type="number" {...register('defaultTaxRate')} placeholder="8.5" className="pl-8"/>
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        </div>
                         {errors.defaultTaxRate && <p className="text-sm text-destructive">{errors.defaultTaxRate.message}</p>}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Automation &amp; Integrations</CardTitle>
                    <CardDescription>Connect with other services and automate your workflow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                             <Label htmlFor="autoInvoiceForRecurring" className="text-base font-semibold">Auto-Invoicing</Label>
                             <p className="text-sm text-muted-foreground">Automatically generate and send invoices for recurring payments.</p>
                        </div>
                        <Controller name="autoInvoiceForRecurring" control={control} render={({field}) => (<Switch id="autoInvoiceForRecurring" checked={field.value} onCheckedChange={field.onChange} />)} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                             <Label className="text-base font-semibold">QuickBooks</Label>
                             <p className="text-sm text-muted-foreground">Sync your invoices and payments with QuickBooks.</p>
                        </div>
                        <Button variant="outline">Connect</Button>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                             <Label className="text-base font-semibold">Xero</Label>
                             <p className="text-sm text-muted-foreground">Sync your invoices and payments with Xero.</p>
                        </div>
                        <Button variant="outline">Connect</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4"/>Save Invoice Settings
                </Button>
            </div>
        </form>
    );
}
