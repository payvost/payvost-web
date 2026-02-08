
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Shield, BarChart, MessageSquareWarning, FileDown, ShieldCheck, Check, X, UserX, AlertTriangle, Fingerprint, MapPin, TabletSmartphone, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { Dispute } from '@/types/dispute';

const caseDetails: Dispute = {
    id: 'CASE-48292',
    transactionId: 'txn_1a2b3c4d',
    customerName: 'John Doe',
    amount: 150.00,
    currency: 'USD',
    reason: 'Product not received',
    status: 'Needs response',
    dueBy: '2024-08-20',
    evidence: [
        { name: 'order_confirmation.pdf', url: '#', uploadedBy: 'John Doe', date: '2024-08-18' },
        { name: 'email_thread.png', url: '#', uploadedBy: 'John Doe', date: '2024-08-18' },
    ],
    log: [
        { user: 'John Doe', action: 'Dispute opened', date: '2024-08-18' },
        { user: 'System', action: 'Case assigned to agent: Sarah', date: '2024-08-18' },
    ]
};

const statusConfig = {
    'Needs response': 'destructive',
    'Under review': 'secondary',
    'Won': 'default',
    'Lost': 'outline',
};

export default function CaseDetailsPage() {
    const caseData = caseDetails; // Fetch by params.id in real app

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/dispute-resolution">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-3xl font-bold tracking-tight">Case {caseData.id}</h2>
                              <Badge variant={statusConfig[caseData.status] as any}>{caseData.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">Due By: {caseData.dueBy}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline">Request More Info</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Case Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{caseData.customerName}</p></div>
                            <div><p className="text-muted-foreground">Transaction ID</p><p className="font-mono text-primary hover:underline">{caseData.transactionId}</p></div>
                            <div><p className="text-muted-foreground">Disputed Amount</p><p className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: caseData.currency }).format(caseData.amount)}</p></div>
                             <div><p className="text-muted-foreground">Reason</p><p className="font-medium">{caseData.reason}</p></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Communication & Actions</CardTitle>
                            <CardDescription>Respond to the customer and submit evidence.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Textarea placeholder="Type your response to the customer..." rows={4} />
                             <div className="p-4 mt-4 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Drag and drop evidence or click to upload</p>
                                <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="secondary">Save as Draft</Button>
                            <Button>Submit Evidence</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Case History & Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-4">
                                {caseData.log.map((item, index) => (
                                    <li key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-primary mt-1"></div>
                                            {index < caseData.log.length - 1 && <div className="h-full w-px bg-border"></div>}
                                        </div>
                                        <div>
                                            <p><span className="font-semibold">{item.user}</span> {item.action}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(item.date).toUTCString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Case Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start"><Check className="mr-2 h-4 w-4"/>Accept Dispute & Refund</Button>
                            <Button variant="outline" className="w-full justify-start"><X className="mr-2 h-4 w-4"/>Challenge Dispute</Button>
                            <Button variant="outline" className="w-full justify-start"><MessageSquareWarning className="mr-2 h-4 w-4" />Escalate to Partner</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Evidence Locker</CardTitle>
                             <CardDescription>Files submitted by both parties.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>File</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {caseData.evidence.map((doc, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="font-medium">{doc.name}</div>
                                                <div className="text-xs text-muted-foreground">by {doc.uploadedBy}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />Download</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

