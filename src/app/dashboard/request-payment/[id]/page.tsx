
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart2, CheckCircle, Copy, Eye, Users, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkAnalyticsChart } from '@/components/link-analytics-chart';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { useToast } from '@/hooks/use-toast';

const recentPayments = [
    { id: 'txn_1', customer: 'liam@example.com', amount: 50.00, date: '2024-08-15' },
    { id: 'txn_2', customer: 'olivia@example.com', amount: 50.00, date: '2024-08-15' },
];

export default function PaymentLinkDetailsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const params = useParams();
    const id = params.id as string;
    const [linkDetails, setLinkDetails] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!id) return;

        const unsub = onSnapshot(doc(db, "paymentRequests", id), (doc) => {
            if (doc.exists()) {
                setLinkDetails({ id: doc.id, ...doc.data() });
            }
            setLoading(false);
        });

        return () => unsub();
    }, [id]);

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        toast({
          title: 'Copied to Clipboard!',
          description: 'The payment link has been copied.',
        });
    };

    if (loading) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex-1 p-4 lg:p-6">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <Skeleton className="h-20 w-full mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </main>
            </DashboardLayout>
        );
    }
    
    if (!linkDetails) {
        return (
             <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex-1 p-4 lg:p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Not Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>The payment link you are looking for could not be found.</p>
                        </CardContent>
                    </Card>
                </main>
             </DashboardLayout>
        )
    }

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/dashboard/request-payment">
                            <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold md:text-2xl">{linkDetails.description}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant={linkDetails.status === 'Paid' ? 'default' : 'secondary'}>{linkDetails.status}</Badge>
                                <span>ID: {linkDetails.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline">Deactivate Link</Button>
                        <Button>Edit Link</Button>
                    </div>
                </div>
                
                <Card className="mb-2">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Payment Link URL:</span>
                        <span className="font-mono text-sm text-muted-foreground">{linkDetails.link}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => copyLink(linkDetails.link)}><Copy className="mr-2 h-4 w-4" />Copy Link</Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <BarChart2 className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">$0.00</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <Card className="xl:col-span-3">
                    <CardHeader>
                        <CardTitle>Page Views vs Payments</CardTitle>
                        <CardDescription>Daily comparison of page views and successful payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2 h-[200px]">
                        <LinkAnalyticsChart />
                    </CardContent>
                </Card>
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Sales Funnel</CardTitle>
                        <CardDescription>From page view to successful payment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Eye className="h-6 w-6 text-muted-foreground mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Page Views</p>
                                    <p className="text-sm text-muted-foreground">The link was viewed.</p>
                                </div>
                                <p className="font-bold text-lg">0</p>
                            </div>
                             <div className="flex items-center">
                                <Users className="h-6 w-6 text-muted-foreground mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Payments Initiated</p>
                                    <p className="text-sm text-muted-foreground">The payment form was submitted.</p>
                                </div>
                                <p className="font-bold text-lg">0</p>
                            </div>
                             <div className="flex items-center">
                                <CheckCircle className="h-6 w-6 text-green-500 mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Payments Successful</p>
                                    <p className="text-sm text-muted-foreground">Payment was successfully captured.</p>
                                </div>
                                <p className="font-bold text-lg">0</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Recent Payments</CardTitle>
                            <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Export</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPayments.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.customer}</TableCell>
                                        <TableCell>{p.date}</TableCell>
                                        <TableCell className="text-right font-mono">${p.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </DashboardLayout>
    );
}
