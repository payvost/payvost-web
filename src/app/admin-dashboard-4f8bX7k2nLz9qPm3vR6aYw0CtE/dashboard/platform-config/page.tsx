
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Wrench, Coins, UserPlus, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function PlatformConfigPage() {
    const { toast } = useToast();

    const handleSaveChanges = () => {
        toast({
            title: "Configuration Saved",
            description: "Platform-wide settings have been updated.",
        });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Platform Configuration</h2>
                    <p className="text-muted-foreground">Manage global settings and feature flags for the entire platform.</p>
                </div>
                 <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
            </div>
            
            <div className="space-y-6">
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5"/>Maintenance Mode</CardTitle>
                        <CardDescription>Take the entire platform offline for users. Admins will still have access.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="maintenance-mode" className="text-base font-semibold">Enable Maintenance Mode</Label>
                                <p className="text-sm text-destructive/80">This will make your app unavailable to all non-admin users.</p>
                            </div>
                            <Switch id="maintenance-mode" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maintenance-message">Maintenance Message</Label>
                            <Textarea id="maintenance-message" placeholder="e.g., We are currently down for scheduled maintenance. We'll be back shortly." />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/>Feature Flags</CardTitle>
                            <CardDescription>Enable or disable major features across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between"><Label>New Dashboard UI</Label><Switch /></div>
                             <div className="flex items-center justify-between"><Label>Crypto Payouts (Beta)</Label><Switch /></div>
                             <div className="flex items-center justify-between"><Label>In-app Chat Support</Label><Switch defaultChecked /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5"/>Registration Gates</CardTitle>
                            <CardDescription>Control new sign-ups on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between"><Label>Allow New User Registrations</Label><Switch defaultChecked /></div>
                             <div className="flex items-center justify-between"><Label>Allow New Merchant Onboarding</Label><Switch defaultChecked /></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
