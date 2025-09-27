
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, Store, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { BusinessAccountData, BusinessVerificationStatus, BusinessKycTier } from '@/types/business-account';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const sampleBusinesses: BusinessAccountData[] = [
    { id: 'biz_1', businessName: 'Tech Innovators Inc.', sector: 'Technology', onboardingDate: '2024-08-10', country: 'United States', countryCode: 'US', verificationStatus: 'Verified', kycTier: 'Tier 3', contactEmail: '', paymentVolume: 0, disputeRatio: 0, activityLog: [], documents: [], owner: { id: 'usr_1', name: 'Liam Johnson' } },
    { id: 'biz_2', businessName: 'Global Foods Ltd.', sector: 'E-commerce', onboardingDate: '2024-07-22', country: 'Nigeria', countryCode: 'NG', verificationStatus: 'Pending', kycTier: 'Tier 1', contactEmail: '', paymentVolume: 0, disputeRatio: 0, activityLog: [], documents: [], owner: { id: 'usr_2', name: 'Olivia Smith' } },
    { id: 'biz_3', businessName: 'Creative Designs Co.', sector: 'Design Agency', onboardingDate: '2024-06-15', country: 'United Kingdom', countryCode: 'GB', verificationStatus: 'Verified', kycTier: 'Tier 2', contactEmail: '', paymentVolume: 0, disputeRatio: 0, activityLog: [], documents: [], owner: { id: 'usr_3', name: 'Noah Williams' } },
    { id: 'biz_4', businessName: 'HealthFirst Pharma', sector: 'Healthcare', onboardingDate: '2024-08-01', country: 'Canada', countryCode: 'CA', verificationStatus: 'Restricted', kycTier: 'Tier 1', contactEmail: '', paymentVolume: 0, disputeRatio: 0, activityLog: [], documents: [], owner: { id: 'usr_4', name: 'Emma Brown' } },
    { id: 'biz_5', businessName: 'QuickLogistics', sector: 'Logistics', onboardingDate: '2024-05-30', country: 'Ghana', countryCode: 'GH', verificationStatus: 'Rejected', kycTier: 'Tier 1', contactEmail: '', paymentVolume: 0, disputeRatio: 0, activityLog: [], documents: [], owner: { id: 'usr_5', name: 'James Jones' } },
];

const statusConfig: Record<BusinessVerificationStatus, { color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Verified: { color: 'text-green-600', variant: 'default' },
    Pending: { color: 'text-yellow-600', variant: 'secondary' },
    Rejected: { color: 'text-red-600', variant: 'destructive' },
    Restricted: { color: 'text-orange-600', variant: 'destructive' },
};

export default function BusinessAccountsPage() {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Accounts</h2>
                    <p className="text-muted-foreground">Manage and monitor all registered businesses.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Configure Tiers</Button>
                    <Button onClick={() => {}}><PlusCircle className="mr-2 h-4 w-4" />Onboard New Business</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,254</div>
                        <p className="text-xs text-muted-foreground">+52 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                        <BadgeInfo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42</div>
                        <p className="text-xs text-muted-foreground">Awaiting document review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High-Risk Accounts</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">Flagged for unusual activity</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by business name or owner..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>KYC Tier</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleBusinesses.map((biz) => {
                                const status = statusConfig[biz.verificationStatus];
                                return (
                                <TableRow key={biz.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts/${biz.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <img src={`/flags/${biz.countryCode}.png`} alt={biz.country} className="h-4 w-6 object-cover rounded-sm"/>
                                            <div>
                                                <div className="font-medium">{biz.businessName}</div>
                                                <div className="text-sm text-muted-foreground">{biz.sector}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${biz.owner.id}`} className="hover:underline text-primary" onClick={(e) => e.stopPropagation()}>{biz.owner.name}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant} className={cn('capitalize', status.color.replace('text-','bg-').replace('-600','-500/20'))}>{biz.verificationStatus}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{biz.kycTier}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Suspend Account</DropdownMenuItem>
                                                <DropdownMenuItem>Upgrade KYC</DropdownMenuItem>
                                                <DropdownMenuItem>Request Documents</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
