
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, ShieldCheck, FileUp, MessageSquareWarning, BarChart2, Users, FileText, Download, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { BusinessAccountData, BusinessVerificationStatus } from '@/types/business-account';

const businessDetails: BusinessAccountData = {
    id: 'biz_1',
    businessName: 'Tech Innovators Inc.',
    sector: 'Technology',
    onboardingDate: '2024-08-10',
    country: 'United States',
    countryCode: 'US',
    verificationStatus: 'Verified',
    kycTier: 'Tier 3',
    contactEmail: 'contact@techinnovators.com',
    paymentVolume: 1250000,
    disputeRatio: 0.2,
    owner: {
        id: 'usr_1',
        name: 'Liam Johnson',
    },
    activityLog: [
        { action: 'KYC Tier 3 Approved', date: '2024-08-12', actor: 'Admin' },
        { action: 'Document Uploaded: Certificate of Incorporation', date: '2024-08-11', actor: 'System' },
        { action: 'Account Created', date: '2024-08-10', actor: 'System' },
    ],
    documents: [
        { name: 'Certificate of Incorporation', status: 'Approved', url: '#' },
        { name: 'Utility Bill', status: 'Approved', url: '#' },
    ]
};

const statusConfig: Record<BusinessVerificationStatus, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Verified: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-green-600', variant: 'default' },
    Pending: { icon: <Clock className="h-5 w-5" />, color: 'text-yellow-600', variant: 'secondary' },
    Rejected: { icon: <XCircle className="h-5 w-5" />, color: 'text-red-600', variant: 'destructive' },
    Restricted: { icon: <AlertTriangle className="h-5 w-5" />, color: 'text-orange-600', variant: 'destructive' },
};

interface BusinessDetailsPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function BusinessDetailsPage({ params }: BusinessDetailsPageProps) {
    const business = businessDetails; // Fetch by params.id in real app
    const status = statusConfig[business.verificationStatus];

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{business.businessName}</h2>
                             <Badge variant={status.variant} className={cn("capitalize", status.color.replace('text-','bg-').replace('-600','-500/20'))}>
                                {status.icon} {business.verificationStatus}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">ID: {business.id}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline">Suspend</Button>
                    <Button>Upgrade KYC</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Business Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-muted-foreground">Owner</p><Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${business.owner.id}`} className="font-medium text-primary hover:underline flex items-center gap-1"><User className="h-4 w-4" />{business.owner.name}</Link></div>
                            <div><p className="text-muted-foreground">Sector</p><p className="font-medium">{business.sector}</p></div>
                            <div><p className="text-muted-foreground">Country</p><p className="font-medium">{business.country}</p></div>
                            <div><p className="text-muted-foreground">Onboarded</p><p className="font-medium">{business.onboardingDate}</p></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-4">
                                {business.activityLog.map((item, index) => (
                                    <li key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-primary mt-1"></div>
                                            {index < business.activityLog.length - 1 && <div className="h-full w-px bg-border"></div>}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{item.action}</p>
                                            <p className="text-sm text-muted-foreground">By {item.actor} on {new Date(item.date).toUTCString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Uploaded Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {business.documents.map((doc, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{doc.name}</TableCell>
                                            <TableCell><Badge variant={doc.status === 'Approved' ? 'default' : 'destructive'}>{doc.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Download</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter>
                             <Button variant="secondary"><FileUp className="mr-2 h-4 w-4" />Request New Document</Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5"/>Key Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Payment Volume (30d)</p>
                                <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(business.paymentVolume)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Dispute Ratio</p>
                                <p className="text-2xl font-bold">{business.disputeRatio}%</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start"><MessageSquareWarning className="mr-2 h-4 w-4"/>Flag for Review</Button>
                            <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4"/>Manage Team</Button>
                            <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4"/>View Invoices</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
