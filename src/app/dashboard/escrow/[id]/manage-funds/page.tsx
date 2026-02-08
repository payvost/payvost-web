
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock, CircleDollarSign, AlertCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Dummy data for a single agreement - in a real app, you'd fetch this by ID
const agreementDetails = {
    id: 'ESC-84321',
    title: 'Website Development for Acme Corp',
    currency: 'USD',
    financials: {
        total: 5000,
        funded: 1500,
        milestones: [
            { id: 'ms_1', description: 'Project Kick-off & UI/UX Design', amount: 1500, status: 'Funded' },
            { id: 'ms_2', description: 'Frontend Development & Revisions', amount: 2000, status: 'Awaiting Funding' },
            { id: 'ms_3', description: 'Backend Integration & Final Delivery', amount: 1500, status: 'Pending' },
        ],
    },
};

const milestoneStatusInfo = {
    'Funded': { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Funded', variant: 'default' as const },
    'Awaiting Funding': { icon: <Clock className="h-4 w-4 text-yellow-500" />, text: 'Awaiting Funding', variant: 'secondary' as const },
    'Pending': { icon: <Clock className="h-4 w-4 text-gray-400" />, text: 'Pending', variant: 'outline' as const },
    'Released': { icon: <CheckCircle className="h-4 w-4 text-blue-500" />, text: 'Released', variant: 'secondary' as const },
}


export default function ManageFundsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const { user, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const agreement = agreementDetails;

    // Load user data to check tier 3 status
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoadingUser(false);
            return;
        }

        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                setUserData(doc.data());
            }
            setLoadingUser(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setLoadingUser(false);
        });

        return () => unsub();
    }, [user, authLoading]);

    // Check if user has tier 3 access
    const hasTier3Access = userData?.kycProfile?.tiers?.tier3?.status === 'approved' || 
                           userData?.kycTier === 'tier3' || 
                           userData?.userType === 'Tier 3';

    const handleAction = (action: string, milestone: any) => {
        toast({
            title: `Action: ${action}`,
            description: `Triggered "${action}" for milestone: ${milestone.description}`,
        });
    }

    // Show loading state while checking tier
    if (authLoading || loadingUser) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Skeleton className="h-12 w-full max-w-md" />
                    </div>
                </main>
            </DashboardLayout>
        );
    }

    // Show access denied if user doesn't have tier 3
    if (!hasTier3Access) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Card className="max-w-2xl mx-auto mt-8">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-destructive/10 rounded-lg">
                                    <Lock className="h-6 w-6 text-destructive" />
                                </div>
                                <div>
                                    <CardTitle>Access Restricted</CardTitle>
                                    <CardDescription>
                                        Escrow services are only available to Tier 3 users
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="destructive">
                                <Lock className="h-4 w-4" />
                                <AlertTitle>Tier 3 Verification Required</AlertTitle>
                                <AlertDescription>
                                    Escrow services require Tier 3: Verified Pro status. To access escrow services, you need to complete the enhanced due diligence verification process.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => router.push('/dashboard/escrow')}
                                className="flex-1"
                            >
                                Back to Escrow
                            </Button>
                            <Button 
                                onClick={() => router.push('/dashboard/profile')}
                                className="flex-1"
                            >
                                View Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/dashboard/escrow">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Manage Funds</h1>
                        <p className="text-sm text-muted-foreground">{agreement.title} ({agreement.id})</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Total Funded</CardTitle>
                            <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.currency }).format(agreement.financials.funded)}</p>
                            <p className="text-xs text-muted-foreground">of {new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.currency }).format(agreement.financials.total)} total</p>
                        </CardContent>
                    </Card>
                     <Card className="border-yellow-500/50 bg-yellow-500/5">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-yellow-800 dark:text-yellow-300">Next Action Required</CardTitle>
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                           <p className="font-semibold">Fund Milestone 2: Frontend Development</p>
                           <p className="text-sm text-muted-foreground mt-1">The buyer needs to deposit funds for the next phase of the project.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Milestone Breakdown</CardTitle>
                        <CardDescription>Manage funding and releases for each milestone.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Milestone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {agreement.financials.milestones.map((milestone) => {
                                    const msInfo = milestoneStatusInfo[milestone.status as keyof typeof milestoneStatusInfo];
                                    return (
                                        <TableRow key={milestone.id}>
                                            <TableCell className="font-medium">{milestone.description}</TableCell>
                                            <TableCell>
                                                <Badge variant={msInfo.variant} className="capitalize flex items-center gap-1.5">
                                                    {msInfo.icon}{msInfo.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.currency }).format(milestone.amount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {milestone.status === 'Awaiting Funding' && (
                                                    <Button size="sm" onClick={() => handleAction('Fund', milestone)}>Fund Now</Button>
                                                )}
                                                {milestone.status === 'Funded' && (
                                                    <Button size="sm" variant="secondary" onClick={() => handleAction('Release', milestone)}>Request Release</Button>
                                                )}
                                                {milestone.status === 'Released' && (
                                                    <span className="text-xs text-muted-foreground">Completed</span>
                                                )}
                                                 {milestone.status === 'Pending' && (
                                                    <Button size="sm" variant="outline" disabled>Awaiting Prior Milestone</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </main>
        </DashboardLayout>
    )
}
