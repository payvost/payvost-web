
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, Clock, FileText, Handshake, MessageSquare, ShieldCheck, ShieldQuestion, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Dummy data for a single agreement - in a real app, you'd fetch this by ID
const agreementDetails = {
    id: 'ESC-84321',
    title: 'Website Development for Acme Corp',
    status: 'In Escrow',
    parties: {
        buyer: { name: 'Acme Corp', email: 'buyer@acme.com' },
        seller: { name: 'You (Payvost Inc.)', email: 'you@qwibik.com' },
    },
    financials: {
        total: { amount: 5000, currency: 'USD' },
        milestones: [
            { id: 'ms_1', description: 'Project Kick-off & UI/UX Design', amount: 1500, status: 'Funded' },
            { id: 'ms_2', description: 'Frontend Development & Revisions', amount: 2000, status: 'Awaiting Funding' },
            { id: 'ms_3', description: 'Backend Integration & Final Delivery', amount: 1500, status: 'Pending' },
        ],
    },
    scope: 'Complete development of a 5-page marketing website with a CMS backend. Includes two rounds of revisions for the design phase and final deployment to Acme Corp\'s server.',
    timeline: [
        { status: 'In Escrow', date: '2024-08-11T10:00:00Z', description: 'Buyer funded the first milestone.' },
        { status: 'Agreement Started', date: '2024-08-10T09:00:00Z', description: 'Agreement created and accepted by all parties.' },
    ]
};

type Status = 'In Escrow' | 'Agreement Started' | 'Funded';

const statusInfo = {
    'In Escrow': { icon: <ShieldCheck className="h-5 w-5 text-green-500" />, variant: 'default' as const },
    'Agreement Started': { icon: <Handshake className="h-5 w-5 text-blue-500" />, variant: 'secondary' as const },
};

const milestoneStatusInfo = {
    'Funded': { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Funded' },
    'Awaiting Funding': { icon: <Clock className="h-4 w-4 text-yellow-500" />, text: 'Awaiting Funding' },
    'Pending': { icon: <Clock className="h-4 w-4 text-gray-400" />, text: 'Pending' },
}

export default function AgreementDetailsPage({ params }: { params: { id: string } }) {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const { user, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const agreement = agreementDetails;
    const currentStatusInfo = statusInfo[agreement.status as keyof typeof statusInfo];

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
                        <h1 className="text-lg font-semibold md:text-2xl">{agreement.title}</h1>
                        <p className="text-sm text-muted-foreground">Agreement ID: {agreement.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle>Agreement Details</CardTitle>
                                    <CardDescription>Overview of the escrow agreement.</CardDescription>
                                </div>
                                <Badge variant={currentStatusInfo.variant} className="capitalize flex items-center gap-1 text-lg">
                                    {currentStatusInfo.icon} {agreement.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold">Buyer</h4>
                                        <p>{agreement.parties.buyer.name}</p>
                                        <p className="text-sm text-muted-foreground">{agreement.parties.buyer.email}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Seller</h4>
                                        <p>{agreement.parties.seller.name}</p>
                                        <p className="text-sm text-muted-foreground">{agreement.parties.seller.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Scope of Work</h4>
                                    <p className="text-sm text-muted-foreground">{agreement.scope}</p>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Payment Milestones</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {agreement.financials.milestones.map((milestone) => {
                                            const msInfo = milestoneStatusInfo[milestone.status as keyof typeof milestoneStatusInfo];
                                            return (
                                            <TableRow key={milestone.id}>
                                                <TableCell className="font-medium">{milestone.description}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        {msInfo.icon}
                                                        <span>{msInfo.text}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.financials.total.currency }).format(milestone.amount)}</TableCell>
                                            </TableRow>
                                            )
                                        })}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-end mt-4">
                                        <p className="font-bold text-lg">Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.financials.total.currency }).format(agreement.financials.total.amount)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <Button className="w-full justify-start"><ShieldCheck className="mr-2 h-4 w-4" /> Release Next Milestone</Button>
                                <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> Download Agreement PDF</Button>
                                <Button variant="destructive-outline" className="w-full justify-start"><ShieldQuestion className="mr-2 h-4 w-4" /> Raise a Dispute</Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {agreement.timeline.map((item, index) => (
                                         <li key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="h-3 w-3 rounded-full bg-primary mt-1"></div>
                                                {index < agreement.timeline.length - 1 && <div className="h-full w-px bg-border"></div>}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.status}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{new Date(item.date).toLocaleString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}
