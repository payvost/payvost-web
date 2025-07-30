
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
import { Save, Percent, Repeat, FileText, Settings } from 'lucide-react';
import type { InvoiceSettings } from '@/types/business-invoice-settings';

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
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSettingsSchema),
        defaultValues: {
            ...mockSettings
        }
    });

    const onSubmit = async (data: InvoiceFormValues) => {
        console.log(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
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
                <CardContent className="space-y-4">
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
