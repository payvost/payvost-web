
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, CheckCircle, Shield, SlidersHorizontal, Activity } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { PayoutPartner } from '@/types/payout-partner';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const samplePartners: PayoutPartner[] = [
    { id: 'partner_1', name: 'Stripe', type: 'Global', capabilities: ['Card Payouts', 'ACH'], status: 'Active', successRate: 99.8, lastValidated: '2024-08-15' },
    { id: 'partner_2', name: 'Wise', type: 'Global', capabilities: ['Bank Transfers'], status: 'Active', successRate: 99.5, lastValidated: '2024-08-14' },
    { id: 'partner_3', name: 'Paystack', type: 'Regional (Africa)', capabilities: ['Bank Transfers', 'Mobile Money'], status: 'Active', successRate: 98.9, lastValidated: '2024-08-15' },
    { id: 'partner_4', name: 'Local Bank AG', type: 'Local (DE)', capabilities: ['SEPA Transfers'], status: 'Inactive', successRate: 99.9, lastValidated: '2024-07-20' },
    { id: 'partner_5', name: 'Fintech Provider UK', type: 'Regional (Europe)', capabilities: ['Bank Transfers'], status: 'Issues Detected', successRate: 92.3, lastValidated: '2024-08-12' },
];

const statusConfig: { [key in PayoutPartner['status']]: string } = {
    Active: 'bg-green-500/20 text-green-700',
    Inactive: 'bg-gray-500/20 text-gray-700',
    'Issues Detected': 'bg-yellow-500/20 text-yellow-700',
};

export default function BankIntegrationsPage() {
    const { toast } = useToast();

    const handleValidate = (partnerName: string) => {
        toast({
            title: `Validating ${partnerName}...`,
            description: 'API credentials check initiated. Please wait a moment.',
        });
        setTimeout(() => {
             toast({
                title: `${partnerName} Validated!`,
                description: 'The API connection was successful.',
            });
        }, 2000);
    }
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Bank & Payout Integrations</h2>
                    <p className="text-muted-foreground">Manage connections to third-party payment and payout providers.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4"/>Routing Rules</Button>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/>Add New Partner</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground">Currently processing payouts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payout Volume (30d)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,450,830.20</div>
                        <p className="text-xs text-muted-foreground">+18.2% from last month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Success Rate</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.2%</div>
                        <p className="text-xs text-muted-foreground">Weighted average across all partners</p>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Connected Partners</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead>Capabilities</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Success Rate (30d)</TableHead>
                                <TableHead className="text-center">Enabled</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {samplePartners.map((partner) => (
                                <TableRow key={partner.id}>
                                    <TableCell>
                                        <div className="font-medium">{partner.name}</div>
                                        <div className="text-sm text-muted-foreground">{partner.type}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {partner.capabilities.map(cap => <Badge key={cap} variant="secondary">{cap}</Badge>)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(statusConfig[partner.status])}>{partner.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{partner.successRate}%</TableCell>
                                    <TableCell className="text-center">
                                        <Switch defaultChecked={partner.status === 'Active'} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleValidate(partner.name)}>Validate API</DropdownMenuItem>
                                                <DropdownMenuItem>View Settlements</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
