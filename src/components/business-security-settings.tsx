
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, KeyRound, Clock, Wifi, FileDown, ShieldCheck, UserCog, Loader2, AlertTriangle, Info } from 'lucide-react';
import type { BusinessSecuritySettings as SecuritySettingsType } from '@/types/business-security-settings';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';

const securitySettingsSchema = z.object({
  enforceMfa: z.boolean(),
  sessionExpiry: z.preprocess((val) => Number(String(val)), z.number().min(5, 'Must be at least 5 minutes')),
  idleTimeout: z.preprocess((val) => Number(String(val)), z.number().min(1, 'Must be at least 1 minute')),
  ipWhitelist: z.string().optional(),
});

type SecurityFormValues = z.infer<typeof securitySettingsSchema>;

export function BusinessSecuritySettings() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySettingsSchema),
    });

    // Load security settings from Firebase
    useEffect(() => {
        if (!user) return;
        
        setLoading(true);
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const securitySettings = userData.securitySettings || {};
                
                const defaultSettings: SecurityFormValues = {
                    enforceMfa: securitySettings.enforceMfa ?? true,
                    sessionExpiry: securitySettings.sessionExpiry || 240,
                    idleTimeout: securitySettings.idleTimeout || 30,
                    ipWhitelist: securitySettings.ipWhitelist || '',
                };

                reset(defaultSettings);
            }
            setLoading(false);
        });
        
        return () => unsub();
    }, [user, reset]);

    const onSubmit = async (data: SecurityFormValues) => {
        if (!user) return;

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                securitySettings: data
            });

            toast({
                title: 'Security Settings Updated',
                description: 'Your security and compliance settings have been saved successfully.',
            });
        } catch (error) {
            console.error('Error saving security settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Security settings apply to all team members. Changes take effect immediately.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5"/>
                        Access Control
                    </CardTitle>
                    <CardDescription>Manage how your team members access the business dashboard and enforce security policies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="enforceMfa" className="flex items-center gap-2 font-semibold text-base cursor-pointer">
                                <ShieldCheck className="h-5 w-5 text-primary"/>Enforce Two-Factor Authentication (2FA)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Require all team members to use 2FA to log in. This adds an extra layer of security to protect your business account.
                            </p>
                        </div>
                         <Controller name="enforceMfa" control={control} render={({field}) => (
                             <Switch id="enforceMfa" checked={field.value} onCheckedChange={field.onChange} />
                         )} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ipWhitelist">IP Address Whitelist</Label>
                        <Textarea 
                            id="ipWhitelist" 
                            {...register('ipWhitelist')} 
                            rows={4} 
                            placeholder="Enter one IP address or CIDR block per line.&#10;Example:&#10;192.168.1.1&#10;10.0.0.0/24&#10;203.0.113.0/24"
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Leave blank to allow access from any IP address. CIDR notation supported (e.g., 10.0.0.0/24).
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5"/>
                        Session Management
                    </CardTitle>
                    <CardDescription>Control how long team members can stay logged in and when they're automatically logged out.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="sessionExpiry">Session Expiry (minutes)</Label>
                        <Input 
                            id="sessionExpiry" 
                            type="number" 
                            {...register('sessionExpiry')} 
                            min={5}
                            placeholder="240"
                        />
                        {errors.sessionExpiry && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {errors.sessionExpiry.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">Maximum session duration before automatic logout. Minimum: 5 minutes.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="idleTimeout">Idle Timeout (minutes)</Label>
                        <Input 
                            id="idleTimeout" 
                            type="number" 
                            {...register('idleTimeout')} 
                            min={1}
                            placeholder="30"
                        />
                        {errors.idleTimeout && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {errors.idleTimeout.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">Time of inactivity before automatic logout. Minimum: 1 minute.</p>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        API & Compliance
                    </CardTitle>
                    <CardDescription>Manage API keys, access compliance documents, and view audit logs.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                        <div className="flex flex-col items-start">
                            <span className="font-medium">Manage & Rotate API Keys</span>
                            <span className="text-xs text-muted-foreground mt-1">View, create, and revoke API keys for integrations</span>
                        </div>
                        <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                        <div className="flex flex-col items-start">
                            <span className="font-medium">Download KYC/AML Report</span>
                            <span className="text-xs text-muted-foreground mt-1">Export your compliance verification documents</span>
                        </div>
                        <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                        <div className="flex flex-col items-start">
                            <span className="font-medium">Download Terms Acceptance Log</span>
                            <span className="text-xs text-muted-foreground mt-1">View team member terms and conditions acceptance history</span>
                        </div>
                        <FileDown className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => reset()}>
                    Reset
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4"/>
                            Save Security Settings
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
