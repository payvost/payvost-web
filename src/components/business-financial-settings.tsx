
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Clock, Save, ShieldCheck, Building, PlusCircle } from 'lucide-react';
import type { FinancialSettings } from '@/types/business-financial-settings';
import { Separator } from './ui/separator';

const financialSettingsSchema = z.object({
  defaultSettlementAccount: z.string().min(1, "Settlement account is required"),
  primaryOperatingAccount: z.string().min(1, "Primary account is required"),
  payoutSchedule: z.enum(['Daily', 'Weekly', 'Monthly', 'OnDemand']),
  escrowEnabled: z.boolean(),
});

type FinancialFormValues = z.infer<typeof financialSettingsSchema>;

const mockSettings: FinancialSettings = {
    defaultSettlementAccount: 'Chase Bank **** 1234',
    primaryOperatingAccount: 'Operating Account (USD)',
    payoutSchedule: 'Daily',
    escrowEnabled: true,
};

export function BusinessFinancialSettings() {
    const { toast } = useToast();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSettingsSchema),
        defaultValues: {
            ...mockSettings
        }
    });

    const onSubmit = async (data: FinancialFormValues) => {
        console.log(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: 'Financial Settings Updated',
            description: 'Your financial preferences have been saved.',
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Account Structure</CardTitle>
                    <CardDescription>Manage your primary and sub-accounts for different financial purposes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="primaryOperatingAccount">Primary Operating Account</Label>
                        <Controller name="primaryOperatingAccount" control={control} render={({field}) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Operating Account (USD)">Operating Account (USD)</SelectItem>
                                    <SelectItem value="Revenue Account (USD)">Revenue Account (USD)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}/>
                        <p className="text-xs text-muted-foreground">This is your main account for day-to-day expenses.</p>
                    </div>
                    <Separator />
                    <div>
                        <Label>Sub-accounts</Label>
                        <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <span className="text-sm font-medium">Revenue Account</span>
                                <Button variant="ghost" size="sm">Manage</Button>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <span className="text-sm font-medium">Tax Holding Account</span>
                                <Button variant="ghost" size="sm">Manage</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                     <Button variant="outline" type="button"><PlusCircle className="mr-2 h-4 w-4"/>Create Sub-account</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payout Settings</CardTitle>
                    <CardDescription>Manage where your funds are sent and how often.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultSettlementAccount">Default Settlement Account</Label>
                            <Controller name="defaultSettlementAccount" control={control} render={({field}) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Chase Bank **** 1234">Chase Bank **** 1234</SelectItem>
                                        <SelectItem value="Bank of America **** 5678">Bank of America **** 5678</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}/>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                            <Controller name="payoutSchedule" control={control} render={({field}) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Daily">Daily</SelectItem>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}/>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Advanced Configuration</CardTitle>
                    <CardDescription>Manage advanced financial features like Escrow.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="escrow-switch" className="flex items-center gap-2 font-semibold text-base">
                                <ShieldCheck className="h-5 w-5"/>Enable Escrow
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Allow use of the Escrow feature for secure, milestone-based payments.
                            </p>
                        </div>
                         <Controller name="escrowEnabled" control={control} render={({field}) => (
                             <Switch
                                id="escrow-switch"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                         )} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4"/>Save Financial Settings
                </Button>
            </div>

        </form>
    );
}
