
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Mail, Phone, Calendar, Globe, User, Shield, BarChart, Wallet, MessageSquareWarning, Repeat, Power, CircleDollarSign, Briefcase, CreditCard, Landmark, KeyRound, Lock, Unlock, Activity, Settings, CheckCircle2, XCircle, Bell, BarChart3, ListChecks, IdCard, Download, FileText, ExternalLink, Loader2, TrendingUp, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CustomerData, KycStatus, UserType } from '@/types/customer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const TransactionChart = dynamic(() => import('@/components/transaction-chart').then(m => m.TransactionChart), { ssr: false });


const kycStatusConfig: Record<KycStatus, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    verified: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-green-600', variant: 'default' },
    pending: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-yellow-600', variant: 'secondary' },
    unverified: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-gray-600', variant: 'outline' },
    restricted: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-orange-600', variant: 'destructive' },
    rejected: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-red-600', variant: 'destructive' },
};


export default function CustomerDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Admin action dialog state
    const [kycLevelOpen, setKycLevelOpen] = useState(false);
    const [limitsOpen, setLimitsOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [kycLevel, setKycLevel] = useState<'Basic' | 'Full' | 'Advanced'>('Full');
    
    // Get available KYC levels based on user's current tier
    const getAvailableKycLevels = (): ('Basic' | 'Full' | 'Advanced')[] => {
        if (!customer) return ['Basic', 'Full', 'Advanced'];
        
        // If user is tier3, they can have Advanced
        if (customer.kycTier === 'tier3' || customer.userType === 'Tier 3') {
            return ['Basic', 'Full', 'Advanced'];
        }
        // If user is tier2, they can have Full
        if (customer.kycTier === 'tier2' || customer.userType === 'Tier 2') {
            return ['Basic', 'Full'];
        }
        // If user is tier1, they can have Basic
        return ['Basic'];
    };
    const [limits, setLimits] = useState({ daily: 1000, fx: 5000, withdrawal: 2000 });
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    
    // Loading states for admin actions
    const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
    const [changeKycLoading, setChangeKycLoading] = useState(false);
    const [adjustLimitsLoading, setAdjustLimitsLoading] = useState(false);
    const [sendNotificationLoading, setSendNotificationLoading] = useState(false);

    // KYC submissions state
    const [kycSubmissions, setKycSubmissions] = useState<any[]>([]);
    const [loadingKyc, setLoadingKyc] = useState(false);
    const [processingDecision, setProcessingDecision] = useState<string | null>(null);
    
    // Tier1 approval state
    const [processingTier1Decision, setProcessingTier1Decision] = useState(false);
    const [tier1RejectReason, setTier1RejectReason] = useState('');
    const [tier1RejectDialogOpen, setTier1RejectDialogOpen] = useState(false);

    // Helpers
    const toDate = (date: any): Date | null => {
        if (!date) return null;
        if (typeof date === 'string') return new Date(date);
        if (date.toDate) return date.toDate();
        if (date._seconds) return new Date(date._seconds * 1000);
        return null;
    };

    const monthKey = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

    const computeStats = (c: CustomerData) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

        let monthIn = 0, monthOut = 0, qIn = 0, qOut = 0, lifeIn = 0, lifeOut = 0;
        const counts = { succeeded: 0, failed: 0, pending: 0 } as Required<NonNullable<CustomerData['transactionCounts']>>;

        const byMonth: Record<string, { income: number; expense: number }> = {};

        (c.transactions || []).forEach(tx => {
            const d = toDate((tx as any).date) ?? new Date();
            const isThisMonth = d >= startOfMonth;
            const isThisQuarter = d >= startOfQuarter;

            const amt = tx.amount || 0;
            if (tx.type === 'inflow') {
                lifeIn += amt; if (isThisMonth) monthIn += amt; if (isThisQuarter) qIn += amt;
            } else {
                lifeOut += amt; if (isThisMonth) monthOut += amt; if (isThisQuarter) qOut += amt;
            }

            counts[tx.status] = (counts[tx.status] ?? 0) + 1;

            const key = monthKey(d);
            byMonth[key] = byMonth[key] || { income: 0, expense: 0 };
            if (tx.type === 'inflow') byMonth[key].income += amt; else byMonth[key].expense += amt;
        });

        // Build last 6 months sequence for chart
        const months: { month: string; income: number; expense: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('en-US', { month: 'short' });
            const ent = byMonth[key] || { income: 0, expense: 0 };
            months.push({ month: key, income: ent.income, expense: ent.expense });
        }

        return {
            month: { inflow: monthIn, outflow: monthOut },
            quarter: { inflow: qIn, outflow: qOut },
            lifetime: { inflow: lifeIn, outflow: lifeOut },
            counts,
            chartData: months,
        };
    };

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/admin/customers/${id}`);
                const customerData = response.data;
                setCustomer(customerData);
                
                // Initialize limits from customer data if available
                if (customerData.accountLimits) {
                    setLimits({
                        daily: customerData.accountLimits.daily || 1000,
                        fx: customerData.accountLimits.fx || 5000,
                        withdrawal: customerData.accountLimits.withdrawal || 2000,
                    });
                } else if (customerData.dailyLimit || customerData.fxLimit || customerData.withdrawalLimit) {
                    setLimits({
                        daily: customerData.dailyLimit || 1000,
                        fx: customerData.fxLimit || 5000,
                        withdrawal: customerData.withdrawalLimit || 2000,
                    });
                }
                
                // Initialize KYC level from customer data if available
                if (customerData.kycLevel) {
                    setKycLevel(customerData.kycLevel);
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
                setError('Failed to load customer data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCustomer();
        }
    }, [id]);

    // Fetch KYC submissions - only for users who have submitted documents (tier2+)
    useEffect(() => {
        const fetchKycSubmissions = async () => {
            if (!id || !customer) return;
            
            // Only fetch KYC submissions if:
            // 1. User is not tier1 (tier1 users don't submit documents)
            // 2. OR user has upgraded and has a kycProfile with tier2/tier3 status that's not locked
            const isTier1Only = customer.kycTier === 'tier1' && 
                               (customer.kycStatus === 'tier1_pending_review' || 
                                customer.kycStatus === 'tier1_verified' ||
                                customer.userType === 'Pending' ||
                                customer.userType === 'Tier 1');
            
            // Check if user has upgraded tiers (tier2 or tier3 unlocked)
            const hasUpgradedTier = customer.kycProfile?.tiers && (
                (customer.kycProfile.tiers.tier2 && customer.kycProfile.tiers.tier2.status !== 'locked') ||
                (customer.kycProfile.tiers.tier3 && customer.kycProfile.tiers.tier3.status !== 'locked')
            );
            
            // Skip fetching if user is tier1 only and hasn't upgraded
            if (isTier1Only && !hasUpgradedTier) {
                setKycSubmissions([]);
                setLoadingKyc(false);
                return;
            }
            
            try {
                setLoadingKyc(true);
                const response = await axios.get(`/api/admin/kyc/submissions?userId=${id}`);
                setKycSubmissions(response.data || []);
            } catch (err: any) {
                // Only show error if it's not a storage bucket error (which is expected for tier1 users)
                if (err.response?.status !== 500 || 
                    !err.response?.data?.details?.includes('Bucket name not specified')) {
                    console.error('Error fetching KYC submissions:', err);
                    // Don't show toast for tier1 users without documents
                    if (!isTier1Only) {
                        toast({
                            title: 'Error',
                            description: 'Failed to load KYC documents',
                            variant: 'destructive',
                        });
                    }
                }
                setKycSubmissions([]);
            } finally {
                setLoadingKyc(false);
            }
        };

        if (id && customer) {
            fetchKycSubmissions();
        }
    }, [id, customer, toast]);

    // Handle KYC decision
    const handleKycDecision = async (submissionId: string, decision: 'approved' | 'rejected', reason?: string, level?: string) => {
        try {
            setProcessingDecision(submissionId);
            await axios.post('/api/admin/kyc/decision', {
                submissionId,
                decision,
                reason,
                level,
            });
            
            toast({
                title: `KYC ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
                description: `User has been notified of the decision.`,
            });

            // Refresh submissions
            const response = await axios.get(`/api/admin/kyc/submissions?userId=${id}`);
            setKycSubmissions(response.data || []);

            // Refresh customer data
            const customerResponse = await axios.get(`/api/admin/customers/${id}`);
            setCustomer(customerResponse.data);
        } catch (err: any) {
            console.error('Error processing KYC decision:', err);
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to process KYC decision',
                variant: 'destructive',
            });
        } finally {
            setProcessingDecision(null);
        }
    };

    // Handle Tier1 approval/rejection
    const handleTier1Decision = async (decision: 'approved' | 'rejected', reason?: string) => {
        try {
            setProcessingTier1Decision(true);
            await axios.post(`/api/admin/users/${id}/approve-tier1`, {
                decision,
                reason,
            });
            
            toast({
                title: `Tier 1 ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
                description: `User status has been updated.`,
            });

            // Refresh customer data
            const customerResponse = await axios.get(`/api/admin/customers/${id}`);
            setCustomer(customerResponse.data);

            setTier1RejectDialogOpen(false);
            setTier1RejectReason('');
        } catch (err: any) {
            console.error('Error processing tier1 decision:', err);
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to process tier1 decision',
                variant: 'destructive',
            });
        } finally {
            setProcessingTier1Decision(false);
        }
    };

    // Handle Force Logout
    const handleForceLogout = async () => {
        if (!confirm('Are you sure you want to force logout this user from all devices?')) {
            return;
        }

        try {
            setForceLogoutLoading(true);
            await axios.post(`/api/admin/customers/${id}/force-logout`);
            
            toast({
                title: 'Force Logout Successful',
                description: 'User has been logged out from all devices.',
            });
        } catch (err: any) {
            console.error('Error force logging out user:', err);
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to force logout user',
                variant: 'destructive',
            });
        } finally {
            setForceLogoutLoading(false);
        }
    };

    // Handle Change KYC Level
    const handleChangeKycLevel = async () => {
        try {
            setChangeKycLoading(true);
            await axios.post(`/api/admin/customers/${id}/change-kyc-level`, {
                level: kycLevel,
            });
            
            toast({
                title: 'KYC Level Updated',
                description: `KYC level has been changed to ${kycLevel}.`,
            });

            // Refresh customer data
            const customerResponse = await axios.get(`/api/admin/customers/${id}`);
            setCustomer(customerResponse.data);

            setKycLevelOpen(false);
        } catch (err: any) {
            console.error('Error changing KYC level:', err);
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to change KYC level',
                variant: 'destructive',
            });
        } finally {
            setChangeKycLoading(false);
        }
    };

    // Handle Adjust Limits
    const handleAdjustLimits = async () => {
        try {
            setAdjustLimitsLoading(true);
            await axios.post(`/api/admin/customers/${id}/adjust-limits`, {
                daily: limits.daily,
                fx: limits.fx,
                withdrawal: limits.withdrawal,
            });
            
            toast({
                title: 'Limits Updated',
                description: `Daily: $${limits.daily}, FX: $${limits.fx}, Withdrawal: $${limits.withdrawal}`,
            });

            // Refresh customer data
            const customerResponse = await axios.get(`/api/admin/customers/${id}`);
            setCustomer(customerResponse.data);

            setLimitsOpen(false);
        } catch (err: any) {
            console.error('Error adjusting limits:', err);
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to adjust limits',
                variant: 'destructive',
            });
        } finally {
            setAdjustLimitsLoading(false);
        }
    };

    // Handle Send Notification
    const handleSendNotification = async () => {
        if (!notificationTitle.trim() || !notificationMessage.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in both title and message',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSendNotificationLoading(true);
            const response = await axios.post(`/api/admin/customers/${id}/send-notification`, {
                title: notificationTitle,
                message: notificationMessage,
                type: 'ADMIN_NOTIFICATION',
            });
            
            toast({
                title: 'Notification Sent',
                description: response.data.message || 'Notification has been sent to the user.',
            });

            setNotificationOpen(false);
            setNotificationTitle('');
            setNotificationMessage('');
        } catch (err: any) {
            console.error('Error sending notification:', err);
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to send notification',
                variant: 'destructive',
            });
        } finally {
            setSendNotificationLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <ShieldCheck className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Customer Not Found</h2>
                <p className="text-muted-foreground">{error || 'The requested customer could not be found.'}</p>
                <Button asChild>
                    <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Link>
                </Button>
            </div>
        );
    }

    const status = kycStatusConfig[customer.kycStatus as KycStatus] || kycStatusConfig.unverified;
    const stats = computeStats(customer);
    
    // Format joined date
    const formatDate = (date: any) => {
        if (!date) return null;
        if (typeof date === 'string') return new Date(date).toLocaleDateString();
        if (date.toDate) return date.toDate().toLocaleDateString();
        if (date._seconds) return new Date(date._seconds * 1000).toLocaleDateString();
        return null;
    };
    
    // Determine actual KYC level from tier status
    const getActualKycLevel = (): string | null => {
        // First check if kycLevel is explicitly set
        if (customer.kycLevel) {
            return customer.kycLevel;
        }
        
        // Otherwise determine from tier status
        if (customer.kycProfile?.tiers) {
            if (customer.kycProfile.tiers.tier3?.status === 'approved') {
                return 'Advanced';
            } else if (customer.kycProfile.tiers.tier2?.status === 'approved') {
                return 'Full';
            } else if (customer.kycProfile.tiers.tier1?.status === 'approved') {
                return 'Basic';
            }
        }
        
        // Fallback to kycTier
        if (customer.kycTier === 'tier3') return 'Advanced';
        if (customer.kycTier === 'tier2') return 'Full';
        if (customer.kycTier === 'tier1') return 'Basic';
        
        return null;
    };
    
    // Helper to format sensitive data (mask SSN, show last 4 of BVN if needed)
    const formatSensitiveValue = (value: string | null | undefined, type: 'ssn' | 'bvn' | 'id' = 'id'): string | null => {
        if (!value) return null;
        if (type === 'ssn' && value.length > 4) {
            return `***-**-${value.slice(-4)}`;
        }
        return value;
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={customer.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
                             <Badge variant={status.variant} className={cn("capitalize", status.color.replace('text-','bg-').replace('-600','-500/20'))}>
                                {status.icon} {customer.kycStatus}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{customer.email}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => toast({ title: 'Reset Password', description: 'Password reset link sent to user.' })}><Repeat className="mr-2 h-4 w-4" />Reset Password</Button>
                    <Button variant="destructive" onClick={() => toast({ title: 'Account Suspended', description: 'User session will be revoked.' })}><Power className="mr-2 h-4 w-4" />Suspend</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                                                <CardHeader>
                                                        <CardTitle>Customer Profile</CardTitle>
                                                        <CardDescription>Core identity and KYC details</CardDescription>
                                                </CardHeader>
                                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4" /> User Type</p><div className="pl-5"><Badge variant="outline">{customer.userType}</Badge></div></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" /> Phone</p><p className="font-medium pl-5">{customer.phone || <span className="text-muted-foreground">Not provided</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><Globe className="h-4 w-4" /> Country</p><p className="font-medium pl-5">{customer.country || <span className="text-muted-foreground">Not set</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined</p><p className="font-medium pl-5">{formatDate(customer.joinedDate) || <span className="text-muted-foreground">Not available</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><Shield className="h-4 w-4" /> KYC Level</p><p className="font-medium pl-5">{getActualKycLevel() || <span className="text-muted-foreground">Not set</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><IdCard className="h-4 w-4"/> ID Type</p><p className="font-medium pl-5">{customer.kycIdType || <span className="text-muted-foreground">Not provided</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><IdCard className="h-4 w-4"/> ID Number</p><p className="font-medium pl-5 font-mono">{customer.kycIdNumber || <span className="text-muted-foreground">Not provided</span>}</p></div>
                                                        {customer.bvn && (
                                                            <div><p className="text-muted-foreground flex items-center gap-1"><KeyRound className="h-4 w-4"/> BVN</p><p className="font-medium pl-5 font-mono">{formatSensitiveValue(customer.bvn, 'bvn')}</p></div>
                                                        )}
                                                        {(customer.ssn || customer.ssnLast4) && (
                                                            <div><p className="text-muted-foreground flex items-center gap-1"><KeyRound className="h-4 w-4"/> SSN</p><p className="font-medium pl-5 font-mono">{formatSensitiveValue(customer.ssn || customer.ssnLast4, 'ssn')}</p></div>
                                                        )}
                                                        {(customer.address || customer.street || customer.city) && (
                                                            <div className="col-span-2 md:col-span-1"><p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4"/> Address</p><div className="pl-5 text-sm space-y-0.5">
                                                                {(customer.address?.street || customer.street) && (
                                                                    <p className="font-medium">{(customer.address?.street || customer.street)}</p>
                                                                )}
                                                                {(() => {
                                                                    const city = customer.address?.city || customer.city;
                                                                    const state = customer.address?.state || customer.state;
                                                                    const postalCode = customer.address?.postalCode || customer.zip;
                                                                    const addressLine = [city, state, postalCode].filter(Boolean).join(', ');
                                                                    return addressLine ? <p className="font-medium">{addressLine}</p> : null;
                                                                })()}
                                                                {(customer.address?.country || customer.country) && (
                                                                    <p className="text-muted-foreground">{customer.address?.country || customer.country}</p>
                                                                )}
                                                            </div></div>
                                                        )}
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><Activity className="h-4 w-4" /> Last Login</p><p className="font-medium pl-5">{customer.lastLoginAt ? new Date(toDate(customer.lastLoginAt)!).toLocaleString() : <span className="text-muted-foreground">Never</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><Globe className="h-4 w-4" /> Last IP</p><p className="font-medium pl-5 font-mono">{customer.lastLoginIp || <span className="text-muted-foreground">Not available</span>}</p></div>
                                                        <div><p className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4" /> Device</p><p className="font-medium pl-5">{customer.lastLoginDevice || <span className="text-muted-foreground">Not available</span>}</p></div>
                                                </CardContent>
                                                <Separator />
                                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {customer.businessInfo && (
                                                            <div>
                                                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4"/> Business Info</h4>
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <div><span className="text-muted-foreground">Registered Name</span><div className="font-medium">{customer.businessInfo.registeredName || '—'}</div></div>
                                                                    <div><span className="text-muted-foreground">Reg. Number</span><div className="font-medium">{customer.businessInfo.registrationNumber || '—'}</div></div>
                                                                    <div><span className="text-muted-foreground">Category</span><div className="font-medium">{customer.businessInfo.category || '—'}</div></div>
                                                                    <div><span className="text-muted-foreground">Contact</span><div className="font-medium">{customer.businessInfo.contactPerson || '—'}</div></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                )}
                    </Card>

                    {/* Tier1 Review Card - Show for tier1 pending users */}
                    {customer.kycTier === 'tier1' && 
                     (customer.kycStatus === 'tier1_pending_review' || customer.userType === 'Pending') &&
                     customer.kycProfile?.tiers?.tier1 && 
                     (customer.kycProfile.tiers.tier1.status === 'submitted' || customer.kycProfile.tiers.tier1.status === 'pending_review') && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IdCard className="h-5 w-5" />
                                    Tier 1 Registration Review
                                </CardTitle>
                                <CardDescription>
                                    Review and approve/reject tier1 user registration. No documents uploaded - only basic information provided.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                                        <Badge variant="secondary">
                                            {customer.kycProfile.tiers.tier1.status || 'submitted'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Submitted At</p>
                                        <p className="text-sm font-medium">
                                            {customer.kycProfile.tiers.tier1.submittedAt 
                                                ? (typeof customer.kycProfile.tiers.tier1.submittedAt === 'string' 
                                                    ? new Date(customer.kycProfile.tiers.tier1.submittedAt).toLocaleString()
                                                    : customer.kycProfile.tiers.tier1.submittedAt.toDate?.().toLocaleString() || 'N/A')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                    <p className="text-sm font-medium mb-3">Identity Information</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {customer.bvn && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">BVN (Bank Verification Number)</p>
                                                <p className="text-sm font-mono font-medium">{customer.bvn}</p>
                                            </div>
                                        )}
                                        {customer.kycProfile.tiers.tier1.additionalFields && Object.entries(customer.kycProfile.tiers.tier1.additionalFields).map(([key, value]) => (
                                            key !== 'bvn' && (
                                                <div key={key}>
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        {key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                    </p>
                                                    <p className="text-sm font-mono font-medium">{String(value)}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium mb-2">Requirements Met</p>
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                        {customer.kycProfile.tiers.tier1.requirements?.map((req: string, idx: number) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Separator />

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleTier1Decision('approved')}
                                        disabled={processingTier1Decision}
                                    >
                                        {processingTier1Decision ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                        )}
                                        Approve Tier 1
                                    </Button>
                                    <Dialog open={tier1RejectDialogOpen} onOpenChange={setTier1RejectDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                disabled={processingTier1Decision}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject Tier 1
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Reject Tier 1 Registration</DialogTitle>
                                                <DialogDescription>
                                                    Provide a reason for rejection. The user will be notified.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div>
                                                <textarea 
                                                    className="w-full border rounded-md p-2 min-h-[100px]" 
                                                    placeholder="Reason for rejection (e.g., Invalid BVN, Information mismatch, etc.)" 
                                                    value={tier1RejectReason} 
                                                    onChange={e => setTier1RejectReason(e.target.value)} 
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="secondary" onClick={() => { setTier1RejectDialogOpen(false); setTier1RejectReason(''); }}>
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    variant="destructive"
                                                    onClick={() => handleTier1Decision('rejected', tier1RejectReason)}
                                                    disabled={processingTier1Decision}
                                                >
                                                    {processingTier1Decision ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : null}
                                                    Reject
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* KYC Documents Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                KYC Documents
                            </CardTitle>
                            <CardDescription>Uploaded verification documents and submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingKyc ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : kycSubmissions.length > 0 ? (
                                <div className="space-y-4">
                                    {kycSubmissions.map((submission) => (
                                        <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold">Level: {submission.level}</p>
                                                        <Badge 
                                                            variant={
                                                                submission.status === 'approved' ? 'default' :
                                                                submission.status === 'rejected' ? 'destructive' :
                                                                submission.status === 'in_review' ? 'secondary' :
                                                                'outline'
                                                            }
                                                        >
                                                            {submission.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Country: {submission.countryCode} • 
                                                        Submitted: {new Date(submission.createdAt).toLocaleDateString()}
                                                    </p>
                                                    {submission.decidedAt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Decided: {new Date(submission.decidedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {submission.rejectionReason && (
                                                        <p className="text-sm text-destructive mt-1">
                                                            Reason: {submission.rejectionReason}
                                                        </p>
                                                    )}
                                                </div>
                                                {submission.status === 'submitted' || submission.status === 'in_review' ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleKycDecision(submission.id, 'approved', undefined, submission.level)}
                                                            disabled={processingDecision === submission.id}
                                                        >
                                                            {processingDecision === submission.id ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                            )}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {
                                                                const reason = prompt('Enter rejection reason:');
                                                                if (reason) {
                                                                    handleKycDecision(submission.id, 'rejected', reason);
                                                                }
                                                            }}
                                                            disabled={processingDecision === submission.id}
                                                        >
                                                            {processingDecision === submission.id ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                            )}
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-sm font-medium mb-2">Documents:</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {submission.documents?.map((doc: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{doc.name || doc.key}</p>
                                                                    {doc.size && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(doc.size / 1024 / 1024).toFixed(2)} MB
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(doc.signedUrl || doc.url, '_blank')}
                                                                className="ml-2 flex-shrink-0"
                                                            >
                                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>
                                        {customer.kycTier === 'tier1' && 
                                         (customer.kycStatus === 'tier1_pending_review' || customer.userType === 'Pending' || customer.userType === 'Tier 1')
                                         ? 'No document submissions. Tier 1 users only provide basic information (BVN, SSN, etc.) during registration.'
                                         : 'No KYC submissions found'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {customer.associatedAccounts && customer.associatedAccounts.length > 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Associated Accounts</CardTitle>
                                <CardDescription>This user owns or is a member of the following accounts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y divide-border">
                                {customer.associatedAccounts.map(account => (
                                    <div key={account.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-semibold">{account.name}</p>
                                                <p className="text-sm text-muted-foreground">{account.type} Account</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts/${account.id}`}>View Account</Link>
                                        </Button>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.transactions && customer.transactions.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customer.transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                            <TableCell><Badge variant="outline" className="capitalize">{tx.type}</Badge></TableCell>
                                            <TableCell><Badge variant="default" className="capitalize">{tx.status}</Badge></TableCell>
                                            <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No transactions found</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                                                        <Button variant="secondary">View All Transactions</Button>
                        </CardFooter>
                    </Card>

                                        <Card>
                                                <CardHeader>
                                                        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/> Analytics & Activity</CardTitle>
                                                        <CardDescription>Spending trends over the last 6 months</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                        {(() => {
                                                            const hasData = stats.chartData.some(d => d.income > 0 || d.expense > 0);
                                                            const hasTransactions = customer.transactions && customer.transactions.length > 0;
                                                            
                                                            if (!hasData && !hasTransactions) {
                                                                return (
                                                                    <div className="h-[300px] w-full flex flex-col items-center justify-center text-center p-4">
                                                                        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                                                        <h3 className="font-semibold text-lg mb-2">No Transaction Data</h3>
                                                                        <p className="text-muted-foreground text-sm max-w-md">
                                                                            This customer hasn't made any transactions yet. Spending trends will appear here once transaction activity begins.
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            
                                                            return (
                                                                <>
                                                                    <div className="w-full">
                                                                        <TransactionChart data={stats.chartData} />
                                                                    </div>
                                                                    {customer.topCounterparties && customer.topCounterparties.length > 0 && (
                                                                        <div className="mt-6 pt-6 border-t">
                                                                            <h4 className="font-semibold mb-3">Top Counterparties</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                {customer.topCounterparties.slice(0,5).map(cp => (
                                                                                    <div key={cp.name} className="flex justify-between items-center py-1">
                                                                                        <span className="text-muted-foreground">{cp.name}</span>
                                                                                        <span className="font-mono text-right">{cp.count} tx • {new Intl.NumberFormat('en-US', { style: 'currency', currency: cp.currency || 'USD' }).format(cp.volume)}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                </CardContent>
                                        </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                                                        <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5"/>Financial Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Total Spend</p>
                                                                <p className="text-xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(customer.totalSpend || 0)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">This Month Inflow</p>
                                                                <p className="text-xl font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.month.inflow)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">This Month Outflow</p>
                                                                <p className="text-xl font-bold text-red-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.month.outflow)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Lifetime Volume</p>
                                                                <p className="text-xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.lifetime.inflow + stats.lifetime.outflow)}</p>
                                                            </div>
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">Transactions</p>
                                                            <div className="flex gap-3 text-sm">
                                                                <Badge variant="default">Succeeded {stats.counts.succeeded}</Badge>
                                                                <Badge variant="secondary">Pending {stats.counts.pending}</Badge>
                                                                <Badge variant="destructive">Failed {stats.counts.failed}</Badge>
                                                            </div>
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                                <p className="text-sm text-muted-foreground mb-2">Wallet Balances</p>
                                                                {customer.wallets && customer.wallets.length > 0 ? (
                                                                <div className="space-y-2">
                                                                {customer.wallets.map(wallet => (
                                                                        <div key={wallet.currency} className="flex justify-between items-center">
                                                                                <span className="font-medium">{wallet.currency}</span>
                                                                                <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet.currency, maximumFractionDigits: 2 }).format(wallet.balance)}</span>
                                                                        </div>
                                                                ))}
                                                                </div>
                                                                ) : (
                                                                        <p className="text-sm text-muted-foreground">No wallets configured</p>
                                                                )}
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                                <p className="text-sm text-muted-foreground mb-2">Linked Payment Methods</p>
                                                                {customer.paymentMethods && customer.paymentMethods.length > 0 ? (
                                                                    <div className="space-y-2 text-sm">
                                                                        {customer.paymentMethods.map((pm, idx) => (
                                                                            <div key={pm.id || idx} className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    {pm.type === 'card' ? <CreditCard className="h-4 w-4"/> : pm.type === 'bank' ? <Landmark className="h-4 w-4"/> : <KeyRound className="h-4 w-4"/>}
                                                                                    <span className="font-medium">
                                                                                        {pm.type === 'card' && (pm.brand ? `${pm.brand} •••• ${pm.last4 || ''}` : 'Card')}
                                                                                        {pm.type === 'bank' && (pm.bankName ? `${pm.bankName} ${pm.accountNoMasked || ''}` : 'Bank')}
                                                                                        {pm.type !== 'card' && pm.type !== 'bank' && 'Virtual Account'}
                                                                                    </span>
                                                                                </div>
                                                                                <Badge variant="outline" className="capitalize">{pm.status || 'active'}</Badge>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">No payment methods</p>
                                                                )}
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">Active Services</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(customer.activeServices && customer.activeServices.length > 0 ? customer.activeServices : ['Virtual Card', 'API Access']).map(svc => (
                                                                    <Badge key={svc} variant="outline">{svc}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                        </CardContent>
                    </Card>
                                        <Card>
                        <CardHeader>
                                                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/>Risk & Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                                         <div>
                                                                <p className="text-sm text-muted-foreground">Internal Risk Score</p>
                                                                <p className="text-2xl font-bold">{customer.riskScore} / 100</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                                <div className="text-sm">
                                                                    <p className="text-muted-foreground mb-1">MFA Status</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch checked={!!customer.mfaEnabled} disabled />
                                                                        <span>{customer.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm">
                                                                    <p className="text-muted-foreground mb-1">Account Lock</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button size="sm" variant={customer.accountLocked ? 'secondary' : 'outline'} onClick={() => toast({ title: customer.accountLocked ? 'Unlock Account' : 'Lock Account', description: 'Action queued for processing.' })}>
                                                                            {customer.accountLocked ? <Unlock className="h-4 w-4 mr-2"/> : <Lock className="h-4 w-4 mr-2"/>}
                                                                            {customer.accountLocked ? 'Unlock' : 'Lock'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                        </div>
                                                        {customer.amlFlags && customer.amlFlags.length > 0 ? (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground mb-2">AML/KYC Flags</p>
                                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                                    {customer.amlFlags.map((f, i) => (<li key={i}>{f}</li>))}
                                                                </ul>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 className="h-4 w-4"/> No AML alerts</div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">Login History</p>
                                                            {customer.loginHistory && customer.loginHistory.length > 0 ? (
                                                                <div className="space-y-2 text-xs">
                                                                    {customer.loginHistory.slice(0,5).map((l, idx) => (
                                                                        <div key={idx} className="flex justify-between">
                                                                            <span>{toDate(l.timestamp)?.toLocaleString() || '—'}</span>
                                                                            <span className="text-muted-foreground">{l.ip} • {l.device || l.browser || ''}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No recent logins</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">Identity Verification Logs</p>
                                                            {customer.identityVerificationLogs && customer.identityVerificationLogs.length > 0 ? (
                                                                <div className="space-y-2 text-xs">
                                                                    {customer.identityVerificationLogs.slice(0,5).map((ev, idx) => (
                                                                        <div key={idx} className="flex justify-between">
                                                                            <span>{toDate(ev.timestamp)?.toLocaleString() || '—'}</span>
                                                                            <span className="text-muted-foreground">{ev.action}: {ev.result}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No identity log entries</p>
                                                            )}
                                                        </div>
                                                        <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: 'Flagged', description: 'User flagged for manual review.' })}><MessageSquareWarning className="mr-2 h-4 w-4"/>Flag for Review</Button>
                        </CardContent>
                    </Card>

                                        {customer.settlements && customer.settlements.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Recent Settlements</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2 text-sm">
                                                        {customer.settlements.slice(0,5).map((s) => (
                                                            <div key={s.id} className="flex justify-between">
                                                                <span className="text-muted-foreground">{toDate(s.date)?.toLocaleDateString() || '—'}</span>
                                                                <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(s.amount)} • <span className="capitalize">{s.status}</span></span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Admin Controls</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={handleForceLogout}
                                                        disabled={forceLogoutLoading}
                                                    >
                                                        {forceLogoutLoading ? (
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Power className="h-4 w-4 mr-2"/>
                                                        )}
                                                        Force Logout
                                                    </Button>
                                                    <Dialog open={kycLevelOpen} onOpenChange={setKycLevelOpen}>
                                                      <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Shield className="h-4 w-4 mr-2"/>
                                                            Change KYC Level
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent>
                                                        <DialogHeader>
                                                          <DialogTitle>Change KYC Level</DialogTitle>
                                                          <DialogDescription>Select the new KYC level to apply to this user.</DialogDescription>
                                                        </DialogHeader>
                                                        <div>
                                                          <label className="text-sm text-muted-foreground">Level</label>
                                                          <select 
                                                            className="mt-1 w-full border rounded-md h-10 px-3 bg-background" 
                                                            value={kycLevel} 
                                                            onChange={e => setKycLevel(e.target.value as any)}
                                                          >
                                                            {getAvailableKycLevels().map(level => (
                                                              <option key={level} value={level}>{level}</option>
                                                            ))}
                                                          </select>
                                                          {getAvailableKycLevels().length === 1 && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                              Only Basic level is available for Tier 1 users. Upgrade tier to unlock higher levels.
                                                            </p>
                                                          )}
                                                        </div>
                                                        <DialogFooter>
                                                          <Button variant="secondary" onClick={() => setKycLevelOpen(false)} disabled={changeKycLoading}>
                                                            Cancel
                                                          </Button>
                                                          <Button onClick={handleChangeKycLevel} disabled={changeKycLoading}>
                                                            {changeKycLoading ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : null}
                                                            Save
                                                          </Button>
                                                        </DialogFooter>
                                                      </DialogContent>
                                                    </Dialog>
                                                    <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
                                                      <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <ListChecks className="h-4 w-4 mr-2"/>
                                                            Adjust Limits
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent>
                                                        <DialogHeader>
                                                          <DialogTitle>Adjust Account Limits</DialogTitle>
                                                          <DialogDescription>Update the account limits for this user (in USD).</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-1 gap-3">
                                                          <div>
                                                            <label className="text-sm text-muted-foreground">Daily Transfer Limit (USD)</label>
                                                            <input 
                                                              type="number" 
                                                              className="mt-1 w-full border rounded-md h-10 px-3 bg-background" 
                                                              value={limits.daily} 
                                                              onChange={e => setLimits({ ...limits, daily: Number(e.target.value) })} 
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-sm text-muted-foreground">FX Limit (USD)</label>
                                                            <input 
                                                              type="number" 
                                                              className="mt-1 w-full border rounded-md h-10 px-3 bg-background" 
                                                              value={limits.fx} 
                                                              onChange={e => setLimits({ ...limits, fx: Number(e.target.value) })} 
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-sm text-muted-foreground">Withdrawal Cap (USD)</label>
                                                            <input 
                                                              type="number" 
                                                              className="mt-1 w-full border rounded-md h-10 px-3 bg-background" 
                                                              value={limits.withdrawal} 
                                                              onChange={e => setLimits({ ...limits, withdrawal: Number(e.target.value) })} 
                                                            />
                                                          </div>
                                                        </div>
                                                        <DialogFooter>
                                                          <Button variant="secondary" onClick={() => setLimitsOpen(false)} disabled={adjustLimitsLoading}>
                                                            Cancel
                                                          </Button>
                                                          <Button onClick={handleAdjustLimits} disabled={adjustLimitsLoading}>
                                                            {adjustLimitsLoading ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : null}
                                                            Save
                                                          </Button>
                                                        </DialogFooter>
                                                      </DialogContent>
                                                    </Dialog>
                                                    <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
                                                      <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Bell className="h-4 w-4 mr-2"/>
                                                            Send Notification
                                                        </Button>
                                                      </DialogTrigger>
                                                      <DialogContent>
                                                        <DialogHeader>
                                                          <DialogTitle>Send Notification</DialogTitle>
                                                          <DialogDescription>Send a notification to this user via email, push, and in-app channels.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-1 gap-3">
                                                          <div>
                                                            <label className="text-sm text-muted-foreground">Title</label>
                                                            <input 
                                                              type="text" 
                                                              className="mt-1 w-full border rounded-md h-10 px-3 bg-background" 
                                                              placeholder="Notification title"
                                                              value={notificationTitle} 
                                                              onChange={e => setNotificationTitle(e.target.value)} 
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-sm text-muted-foreground">Message</label>
                                                            <textarea 
                                                              className="mt-1 w-full border rounded-md p-3 bg-background min-h-[100px]" 
                                                              placeholder="Notification message"
                                                              value={notificationMessage} 
                                                              onChange={e => setNotificationMessage(e.target.value)} 
                                                            />
                                                          </div>
                                                        </div>
                                                        <DialogFooter>
                                                          <Button variant="secondary" onClick={() => { setNotificationOpen(false); setNotificationTitle(''); setNotificationMessage(''); }} disabled={sendNotificationLoading}>
                                                            Cancel
                                                          </Button>
                                                          <Button onClick={handleSendNotification} disabled={sendNotificationLoading}>
                                                            {sendNotificationLoading ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : null}
                                                            Send
                                                          </Button>
                                                        </DialogFooter>
                                                      </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>System Metadata</CardTitle>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${customer.id}/audit`}>View Audit Trail</Link>
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-muted-foreground">Customer ID</span><span className="font-mono">{customer.id}</span></div>
                                                {customer.metadata?.customerRef && (<div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{customer.metadata.customerRef}</span></div>)}
                                                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{customer.metadata?.createdAt ? toDate(customer.metadata.createdAt)?.toLocaleString() : formatDate(customer.joinedDate)}</span></div>
                                                {customer.metadata?.createdBy && (<div className="flex justify-between"><span className="text-muted-foreground">Created By</span><span>{customer.metadata.createdBy}</span></div>)}
                                                {customer.metadata?.lastModifiedAt && (<div className="flex justify-between"><span className="text-muted-foreground">Last Modified</span><span>{toDate(customer.metadata.lastModifiedAt)?.toLocaleString()}</span></div>)}
                                                {customer.metadata?.lastModifiedBy && (<div className="flex justify-between"><span className="text-muted-foreground">Last Modified By</span><span>{customer.metadata.lastModifiedBy}</span></div>)}
                                                {customer.metadata?.apiKeys && customer.metadata.apiKeys.length > 0 && (
                                                    <div className="pt-2">
                                                        <p className="text-muted-foreground">API Keys</p>
                                                        <div className="mt-1 space-y-1">
                                                            {customer.metadata.apiKeys.map((k, idx) => (
                                                                <div key={idx} className="flex justify-between text-xs">
                                                                    <span>{k.label || 'Key'} • {k.maskedKey}</span>
                                                                    <span className="capitalize">{k.status || 'active'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {customer.metadata?.webhooks && customer.metadata.webhooks.length > 0 && (
                                                    <div className="pt-2">
                                                        <p className="text-muted-foreground">Webhooks</p>
                                                        <div className="mt-1 space-y-1 text-xs">
                                                            {customer.metadata.webhooks.map((w, idx) => (
                                                                <div key={idx} className="flex justify-between">
                                                                    <span className="truncate max-w-[60%]" title={w.url}>{w.url}</span>
                                                                    <span className="capitalize">{w.status || 'active'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                </div>
            </div>
        </>
    );
}
