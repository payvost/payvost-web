
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Search, ShieldAlert, BadgeInfo, FileWarning, ListFilter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { ComplianceAlert, AlertReason, AlertStatus } from '@/types/compliance-alert';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const sampleAlerts: ComplianceAlert[] = [
    { id: 'case_001', userId: 'usr_4', userName: 'Emma Brown', reason: 'Sanctions List Match', riskLevel: 'Critical', status: 'Pending Review', date: '2024-08-15', source: 'Sanctions Screening' },
    { id: 'case_002', userId: 'usr_1', userName: 'Liam Johnson', reason: 'Unusual Transaction Pattern', riskLevel: 'High', status: 'Pending Review', date: '2024-08-14', source: 'Transaction Monitoring' },
    { id: 'case_003', userId: 'usr_5', userName: 'James Jones', reason: 'High-Risk Jurisdiction', riskLevel: 'Medium', status: 'Under Review', date: '2024-08-14', source: 'Onboarding' },
    { id: 'case_004', userId: 'usr_3', userName: 'Noah Williams', reason: 'Structuring', riskLevel: 'High', status: 'Pending Review', date: '2024-08-13', source: 'Transaction Monitoring' },
    { id: 'case_005', userId: 'usr_2', userName: 'Olivia Smith', reason: 'Velocity Check', riskLevel: 'Low', status: 'Closed - Safe', date: '2024-08-12', source: 'Transaction Monitoring' },
];

const riskConfig: Record<ComplianceAlert['riskLevel'], { className: string }> = {
    Critical: { className: 'bg-red-600/20 text-red-800 border-red-600/30' },
    High: { className: 'bg-orange-500/20 text-orange-800 border-orange-500/30' },
    Medium: { className: 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30' },
    Low: { className: 'bg-green-500/20 text-green-800 border-green-500/30' },
};

export default function ComplianceRiskPage() {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compliance Center</h2>
                    <p className="text-muted-foreground">Monitor, investigate, and manage compliance alerts.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Export Reports</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cases Pending Review</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">New alerts requiring attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High-Risk Alerts</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">Critical or High risk alerts open</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sanctions Matches</CardTitle>
                        <BadgeInfo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Potential match found in sanctions lists</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by case ID, user name, or reason..."
                                className="w-full rounded-lg bg-background pl-8"
                            />
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by Risk Level</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem>Critical</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>High</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Medium</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Low</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Case / User</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Risk Level</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleAlerts.map((alert) => {
                                const risk = riskConfig[alert.riskLevel];
                                return (
                                <TableRow key={alert.id} onClick={() => router.push(`/admin-panel/dashboard/compliance-risk/${alert.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="font-medium">{alert.id}</div>
                                        <Link href={`/admin-panel/dashboard/customers/${alert.userId}`} className="text-sm text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {alert.userName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div>{alert.reason}</div>
                                        <div className="text-xs text-muted-foreground">{alert.source}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(risk.className)}>{alert.riskLevel}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={alert.status === 'Pending Review' ? 'destructive' : 'secondary'}>{alert.status}</Badge>
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
                                                <DropdownMenuItem>View Case</DropdownMenuItem>
                                                <DropdownMenuItem>Mark as Reviewed</DropdownMenuItem>
                                                <DropdownMenuItem>Escalate</DropdownMenuItem>
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
