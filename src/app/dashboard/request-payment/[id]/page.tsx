
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData, collection, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart2, CheckCircle, Copy, Eye, Users, FileDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkAnalyticsChart } from '@/components/link-analytics-chart';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function PaymentLinkDetailsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [linkDetails, setLinkDetails] = useState<DocumentData | null>(null);
    const [payments, setPayments] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        if (!id) return;

        const linkUnsub = onSnapshot(doc(db, "paymentRequests", id), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.status === 'Deleted') {
                    setRequest(null);
                } else {
                    setLinkDetails({ id: doc.id, ...data });
                }
            } else {
                setLinkDetails(null);
            }
            setLoading(false);
        });

        const paymentsQuery = query(collection(db, "paymentRequests", id, "payments"), orderBy("createdAt", "desc"));
        const paymentsUnsub = onSnapshot(paymentsQuery, (snapshot) => {
            const fetchedPayments: DocumentData[] = [];
            snapshot.forEach((doc) => {
                fetchedPayments.push({ id: doc.id, ...doc.data() });
            });
            setPayments(fetchedPayments);
        });

        return () => {
            linkUnsub();
            paymentsUnsub();
        };
    }, [id]);

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        toast({
          title: 'Copied to Clipboard!',
          description: 'The payment link has been copied.',
        });
    };
    
    const handleDeactivate = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, 'paymentRequests', id);
            await updateDoc(docRef, {
                status: linkDetails?.status === 'Active' ? 'Inactive' : 'Active',
            });
            toast({
                title: 'Status Updated',
                description: `The payment link is now ${linkDetails?.status === 'Active' ? 'Inactive' : 'Active'}.`,
            });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update link status.', variant: 'destructive'});
        }
    }
    
    const handleDelete = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, 'paymentRequests', id);
            await deleteDoc(docRef);
            toast({
                title: 'Link Deleted',
                description: 'The payment link has been permanently deleted.',
            });
            router.push('/dashboard/request-payment');
        } catch (error) {
             toast({ title: 'Error', description: 'Could not delete the link.', variant: 'destructive'});
        } finally {
            setShowDeleteDialog(false);
        }
    }

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

    const totalRevenue = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);

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
                                <Badge variant={linkDetails.status === 'Paid' || linkDetails.status === 'Active' ? 'default' : 'secondary'}>{linkDetails.status}</Badge>
                                <span>ID: {linkDetails.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline">
                                    {linkDetails.status === 'Active' ? 'Deactivate Link' : 'Activate Link'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will {linkDetails.status === 'Active' ? 'deactivate' : 'activate'} the payment link. 
                                        {linkDetails.status === 'Active' ? ' Users will no longer be able to make payments.' : ' Users will be able to make payments again.'}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeactivate}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button>Edit Link</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Edit Campaign</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setShowDeleteDialog(true);}}>
                                    <Trash2 className="mr-2 h-4 w-4"/>Delete
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                        </DropdownMenu>
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
                            <div className="text-2xl font-bold">
                                {linkDetails.currency ? new Intl.NumberFormat('en-US', { style: 'currency', currency: linkDetails.currency }).format(totalRevenue) : totalRevenue.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{linkDetails.views || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'Completed').length}</div>
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
                                <p className="font-bold text-lg">{linkDetails.views || 0}</p>
                            </div>
                             <div className="flex items-center">
                                <Users className="h-6 w-6 text-muted-foreground mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Payments Initiated</p>
                                    <p className="text-sm text-muted-foreground">The payment form was submitted.</p>
                                </div>
                                <p className="font-bold text-lg">{payments.length}</p>
                            </div>
                             <div className="flex items-center">
                                <CheckCircle className="h-6 w-6 text-green-500 mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Payments Successful</p>
                                    <p className="text-sm text-muted-foreground">Payment was successfully captured.</p>
                                </div>
                                <p className="font-bold text-lg">{payments.filter(p => p.status === 'Completed').length}</p>
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
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No payments received yet.</TableCell>
                                    </TableRow>
                               ) : (
                                payments.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.payerEmail}</TableCell>
                                        <TableCell>{format(p.createdAt.toDate(), 'PPP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={p.status === 'Completed' ? 'default' : p.status === 'Pending Verification' ? 'secondary' : 'destructive'}>
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {linkDetails.currency ? new Intl.NumberFormat('en-US', { style: 'currency', currency: linkDetails.currency }).format(p.amount) : p.amount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this payment link and all of its data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </main>
        </DashboardLayout>
    );
}

    