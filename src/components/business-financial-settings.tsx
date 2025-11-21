
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Clock, Save, ShieldCheck, Building, PlusCircle, Wallet, Loader2, TrendingUp } from 'lucide-react';
import type { FinancialSettings } from '@/types/business-financial-settings';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { walletService, type Account } from '@/services/walletService';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const financialSettingsSchema = z.object({
  defaultSettlementAccount: z.string().min(1, "Settlement account is required"),
  primaryOperatingAccount: z.string().min(1, "Primary account is required"),
  payoutSchedule: z.enum(['Daily', 'Weekly', 'Monthly', 'OnDemand']),
  escrowEnabled: z.boolean(),
});

type FinancialFormValues = z.infer<typeof financialSettingsSchema>;

export function BusinessFinancialSettings() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [settings, setSettings] = useState<FinancialSettings | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSettingsSchema),
    });

    // Load accounts from wallet service
    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const fetchedAccounts = await walletService.getAccounts();
                setAccounts(fetchedAccounts.filter(acc => acc.type === 'BUSINESS'));
            } catch (error) {
                console.error('Error loading accounts:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load accounts. Please try again.',
                    variant: 'destructive',
                });
            }
        };

        if (user) {
            loadAccounts();
        }
    }, [user, toast]);

    // Load financial settings from Firebase
    useEffect(() => {
        if (!user) return;
        
        setLoading(true);
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const financialSettings = userData.financialSettings || {};
                
                setSettings({
                    defaultSettlementAccount: financialSettings.defaultSettlementAccount || '',
                    primaryOperatingAccount: financialSettings.primaryOperatingAccount || '',
                    payoutSchedule: financialSettings.payoutSchedule || 'Daily',
                    escrowEnabled: financialSettings.escrowEnabled ?? true,
                });

                reset({
                    defaultSettlementAccount: financialSettings.defaultSettlementAccount || '',
                    primaryOperatingAccount: financialSettings.primaryOperatingAccount || '',
                    payoutSchedule: financialSettings.payoutSchedule || 'Daily',
                    escrowEnabled: financialSettings.escrowEnabled ?? true,
                });
            }
            setLoading(false);
        });
        
        return () => unsub();
    }, [user, reset]);

    const onSubmit = async (data: FinancialFormValues) => {
        if (!user) return;

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                financialSettings: data
            });

            setSettings(data);
            toast({
                title: 'Financial Settings Updated',
                description: 'Your financial preferences have been saved successfully.',
            });
        } catch (error) {
            console.error('Error saving financial settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const formatAccountDisplay = (account: Account) => {
        return `${account.currency} Account - ${account.balance.toFixed(2)} ${account.currency}`;
    };

    const formatAccountValue = (account: Account) => {
        return account.id;
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
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Account Structure
                    </CardTitle>
                    <CardDescription>Manage your primary and sub-accounts for different financial purposes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="primaryOperatingAccount">Primary Operating Account</Label>
                        <Controller 
                            name="primaryOperatingAccount" 
                            control={control} 
                            render={({field}) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select primary operating account"/></SelectTrigger>
                                    <SelectContent>
                                        {accounts.length > 0 ? (
                                            accounts.map((account) => (
                                                <SelectItem key={account.id} value={formatAccountValue(account)}>
                                                    {formatAccountDisplay(account)}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No accounts available</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.primaryOperatingAccount && (
                            <p className="text-sm text-destructive">{errors.primaryOperatingAccount.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">This is your main account for day-to-day expenses and operations.</p>
                    </div>
                    <Separator />
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label>Wallet Accounts</Label>
                            <Badge variant="secondary">{accounts.length} account(s)</Badge>
                        </div>
                        {accounts.length > 0 ? (
                            <div className="space-y-2">
                                {accounts.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Wallet className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{account.currency} Account</span>
                                                    <Badge variant="outline" className="text-xs">BUSINESS</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Balance: {account.balance.toFixed(2)} {account.currency}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={settings?.primaryOperatingAccount === account.id ? 'default' : 'outline'}>
                                                {settings?.primaryOperatingAccount === account.id ? 'Primary' : 'Secondary'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed rounded-lg text-center">
                                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="font-medium text-sm mb-1">No wallet accounts found</p>
                                <p className="text-xs text-muted-foreground mb-4">Create a business account to get started</p>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" type="button">
                                <PlusCircle className="mr-2 h-4 w-4"/>Create New Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Account</DialogTitle>
                                <DialogDescription>
                                    Create a new business wallet account in your preferred currency.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <p className="text-sm text-muted-foreground">
                                    Please navigate to the Wallets section to create a new account.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                     </Dialog>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Payout Settings
                    </CardTitle>
                    <CardDescription>Manage where your funds are sent and how often payouts are processed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultSettlementAccount">Default Settlement Account</Label>
                            <Controller 
                                name="defaultSettlementAccount" 
                                control={control} 
                                render={({field}) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select settlement account"/></SelectTrigger>
                                        <SelectContent>
                                            {accounts.length > 0 ? (
                                                accounts.map((account) => (
                                                    <SelectItem key={account.id} value={formatAccountValue(account)}>
                                                        {formatAccountDisplay(account)}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>No accounts available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.defaultSettlementAccount && (
                                <p className="text-sm text-destructive">{errors.defaultSettlementAccount.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">This account receives automatic payouts</p>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                            <Controller 
                                name="payoutSchedule" 
                                control={control} 
                                render={({field}) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select schedule"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Daily">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    Daily
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                            <SelectItem value="OnDemand">On Demand</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.payoutSchedule && (
                                <p className="text-sm text-destructive">{errors.payoutSchedule.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">How often payouts are processed</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Advanced Configuration
                    </CardTitle>
                    <CardDescription>Manage advanced financial features and security options.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="escrow-switch" className="flex items-center gap-2 font-semibold text-base cursor-pointer">
                                <ShieldCheck className="h-5 w-5 text-primary"/>Enable Escrow
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Allow use of the Escrow feature for secure, milestone-based payments. Funds are held securely until transaction completion.
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
                            Save Financial Settings
                        </>
                    )}
                </Button>
            </div>

        </form>
    );
}
