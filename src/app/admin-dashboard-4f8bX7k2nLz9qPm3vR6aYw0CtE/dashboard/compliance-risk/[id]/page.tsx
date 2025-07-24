
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Shield, BarChart, MessageSquareWarning, FileDown, ShieldCheck, Check, X, UserX, AlertTriangle, Fingerprint, MapPin, TabletSmartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ComplianceAlert } from '@/types/compliance-alert';

const caseDetails: ComplianceAlert & { user: any; transactions: any[] } = {
    id: 'case_002', 
    userId: 'usr_1', 
    userName: 'Liam Johnson', 
    reason: 'Unusual Transaction Pattern', 
    riskLevel: 'High', 
    status: 'Pending Review', 
    date: '2024-08-14', 
    source: 'Transaction Monitoring',
    details: {
        description: 'User sent 5 transactions of $999.00 each within a 1-hour window to different new beneficiaries in a high-risk jurisdiction.',
        matchedRule: 'Rule-7: Rapid Successive Transactions Below Threshold',
        geoData: { ip: '102.89.33.15', country: 'Nigeria (NG)', city: 'Lagos' },
        device: { id: 'fp_xyz123abc', type: 'Android Browser' },
    },
    user: {
        name: 'Liam Johnson',
        email: 'liam@example.com',
        userType: 'Business Owner',
        kycStatus: 'Verified'
    },
    transactions: [
        { id: 'txn_1', type: 'outflow', amount: 999, currency: 'USD', status: 'succeeded', date: '2024-08-14 10:30' },
        { id: 'txn_2', type: 'outflow', amount: 999, currency: 'USD', status: 'succeeded', date: '2024-08-14 10:45' },
        { id: 'txn_3', type: 'outflow', amount: 999, currency: 'USD', status: 'succeeded', date: '2024-08-14 11:00' },
    ]
};

const riskConfig: Record<ComplianceAlert['riskLevel'], { className: string }> = {
    Critical: { className: 'bg-red-600/20 text-red-800' },
    High: { className: 'bg-orange-500/20 text-orange-800' },
    Medium: { className: 'bg-yellow-500/20 text-yellow-800' },
    Low: { className: 'bg-green-500/20 text-green-800' },
};


export default function CaseDetailsPage({ params }: { params: { id: string } }) {
    const caseData = caseDetails; // Fetch by params.id in real app
    const risk = riskConfig[caseData.riskLevel];

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-panel/dashboard/compliance-risk">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Case Details</h2>
                        <p className="text-muted-foreground">ID: {caseData.id}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export SAR</Button>
                    <Button><MessageSquareWarning className="mr-2 h-4 w-4"/>Escalate Case</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle>Case Summary: {caseData.reason}</CardTitle>
                                <CardDescription>Flagged by {caseData.source} on {caseData.date}</CardDescription>
                            </div>
                            <Badge variant="destructive">{caseData.status}</Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{caseData.details.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">Matched Rule: {caseData.details.matchedRule}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Relevant Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                    {caseData.transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                            <TableCell><Badge variant="outline" className="capitalize">{tx.type}</Badge></TableCell>
                                            <TableCell><Badge variant="default" className="capitalize">{tx.status}</Badge></TableCell>
                                            <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Geo & Device Data</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground"/><div><p className="text-muted-foreground">Location</p><p className="font-medium">{caseData.details.geoData.city}, {caseData.details.geoData.country}</p></div></div>
                            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-muted-foreground"/><div><p className="text-muted-foreground">IP Address</p><p className="font-mono">{caseData.details.geoData.ip}</p></div></div>
                            <div className="flex items-center gap-2"><TabletSmartphone className="h-5 w-5 text-muted-foreground"/><div><p className="text-muted-foreground">Device</p><p className="font-medium">{caseData.details.device.type}</p></div></div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>Customer Info</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{caseData.user.name}</p></div>
                            <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{caseData.user.email}</p></div>
                             <div><p className="text-sm text-muted-foreground">User Type</p><div><Badge variant="secondary">{caseData.user.userType}</Badge></div></div>
                             <div><p className="text-sm text-muted-foreground">KYC Status</p><div><Badge>{caseData.user.kycStatus}</Badge></div></div>
                        </CardContent>
                        <CardFooter>
                           <Button variant="outline" className="w-full" asChild>
                             <Link href={`/admin-panel/dashboard/customers/${caseData.userId}`}>View Full Profile</Link>
                           </Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/>Risk Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="text-center">
                                <p className="text-sm text-muted-foreground">Risk Level</p>
                                <p className={cn("text-2xl font-bold", risk.className.replace('bg-','text-').replace('/20',''))}>{caseData.riskLevel}</p>
                           </div>
                           <Separator />
                           <h4 className="font-semibold text-sm">Case Actions</h4>
                           <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="justify-start"><Check className="mr-2 h-4 w-4"/>Mark as Safe</Button>
                            <Button variant="outline" className="justify-start"><X className="mr-2 h-4 w-4"/>Confirm Fraud</Button>
                            <Button variant="destructive-outline" className="col-span-2 justify-start"><UserX className="mr-2 h-4 w-4"/>Suspend User Account</Button>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
