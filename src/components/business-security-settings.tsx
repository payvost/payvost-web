
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
import { Save, KeyRound, Clock, Wifi, FileDown, ShieldCheck, UserCog } from 'lucide-react';
import type { BusinessSecuritySettings as SecuritySettingsType } from '@/types/business-security-settings';

const securitySettingsSchema = z.object({
  enforceMfa: z.boolean(),
  sessionExpiry: z.preprocess((val) => Number(String(val)), z.number().min(5, 'Must be at least 5 minutes')),
  idleTimeout: z.preprocess((val) => Number(String(val)), z.number().min(1, 'Must be at least 1 minute')),
  ipWhitelist: z.string().optional(),
});

type SecurityFormValues = z.infer<typeof securitySettingsSchema>;

const mockSettings: SecuritySettingsType = {
    enforceMfa: true,
    sessionExpiry: 240,
    idleTimeout: 30,
    ipWhitelist: '192.168.1.1\n10.0.0.0/24',
};

export function BusinessSecuritySettings() {
    const { toast } = useToast();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySettingsSchema),
        defaultValues: {
            ...mockSettings
        }
    });

    const onSubmit = async (data: SecurityFormValues) => {
        console.log(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: 'Security Settings Updated',
            description: 'Your security and compliance settings have been saved.',
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5"/>Access Control</CardTitle>
                    <CardDescription>Manage how your team members access the business dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enforceMfa" className="flex items-center gap-2 font-semibold text-base">
                                <ShieldCheck className="h-5 w-5"/>Enforce Two-Factor Authentication (2FA)
                            </Label>
                            <p className="text-sm text-muted-foreground">Require all team members to use 2FA to log in.</p>
                        </div>
                         <Controller name="enforceMfa" control={control} render={({field}) => (
                             <Switch id="enforceMfa" checked={field.value} onCheckedChange={field.onChange} />
                         )} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ipWhitelist">IP Address Whitelist</Label>
                        <Textarea id="ipWhitelist" {...register('ipWhitelist')} rows={4} placeholder="Enter one IP address or CIDR block per line."/>
                        <p className="text-xs text-muted-foreground">Leave blank to allow access from any IP address.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Session Management</CardTitle>
                    <CardDescription>Control how long team members can stay logged in.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="sessionExpiry">Session Expiry (minutes)</Label>
                        <Input id="sessionExpiry" type="number" {...register('sessionExpiry')} />
                        {errors.sessionExpiry && <p className="text-sm text-destructive">{errors.sessionExpiry.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="idleTimeout">Idle Timeout (minutes)</Label>
                        <Input id="idleTimeout" type="number" {...register('idleTimeout')} />
                        {errors.idleTimeout && <p className="text-sm text-destructive">{errors.idleTimeout.message}</p>}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>API & Compliance</CardTitle>
                    <CardDescription>Manage API keys and access compliance documents.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between"><span>Manage & Rotate API Keys</span><KeyRound className="h-4 w-4" /></Button>
                    <Button variant="outline" className="w-full justify-between"><span>Download KYC/AML Report</span><FileDown className="h-4 w-4" /></Button>
                    <Button variant="outline" className="w-full justify-between"><span>Download Terms Acceptance Log</span><FileDown className="h-4 w-4" /></Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4"/>Save Security Settings
                </Button>
            </div>
        </form>
    );
}
