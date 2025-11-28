'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Search, AlertCircle, FileDown, RefreshCw, ShieldAlert, Globe, ListFilter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SanctionsMatch {
    id: string;
    userId: string;
    userName: string;
    matchType: 'Exact' | 'Partial' | 'Fuzzy';
    listName: string;
    matchedName: string;
    country: string;
    riskLevel: 'Critical' | 'High' | 'Medium';
    status: 'Pending Review' | 'False Positive' | 'Confirmed Match' | 'Cleared';
    screenedAt: string;
    lastUpdated: string;
}

const sampleMatches: SanctionsMatch[] = [
    { 
        id: 'match_001', 
        userId: 'usr_4', 
        userName: 'Emma Brown', 
        matchType: 'Exact', 
        listName: 'OFAC SDN', 
        matchedName: 'Emma Brown', 
        country: 'US', 
        riskLevel: 'Critical', 
        status: 'Pending Review', 
        screenedAt: '2024-08-15 10:30', 
        lastUpdated: '2024-08-15 10:30' 
    },
    { 
        id: 'match_002', 
        userId: 'usr_7', 
        userName: 'Ahmed Hassan', 
        matchType: 'Partial', 
        listName: 'UN Consolidated List', 
        matchedName: 'Ahmed H. Hassan', 
        country: 'SY', 
        riskLevel: 'High', 
        status: 'Pending Review', 
        screenedAt: '2024-08-14 15:20', 
        lastUpdated: '2024-08-14 15:20' 
    },
    { 
        id: 'match_003', 
        userId: 'usr_9', 
        userName: 'Maria Rodriguez', 
        matchType: 'Fuzzy', 
        listName: 'EU Sanctions', 
        matchedName: 'Maria R. Rodriguez', 
        country: 'ES', 
        riskLevel: 'Medium', 
        status: 'False Positive', 
        screenedAt: '2024-08-13 09:15', 
        lastUpdated: '2024-08-13 14:30' 
    },
    { 
        id: 'match_004', 
        userId: 'usr_12', 
        userName: 'John Smith', 
        matchType: 'Partial', 
        listName: 'UK Sanctions', 
        matchedName: 'John A. Smith', 
        country: 'GB', 
        riskLevel: 'High', 
        status: 'Cleared', 
        screenedAt: '2024-08-12 11:45', 
        lastUpdated: '2024-08-12 16:20' 
    },
];

const riskConfig: Record<SanctionsMatch['riskLevel'], { className: string }> = {
    Critical: { className: 'bg-red-600/20 text-red-800 border-red-600/30' },
    High: { className: 'bg-orange-500/20 text-orange-800 border-orange-500/30' },
    Medium: { className: 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30' },
};

const statusConfig: Record<SanctionsMatch['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
    'Pending Review': { variant: 'destructive', icon: <Clock className="h-3 w-3" /> },
    'False Positive': { variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
    'Confirmed Match': { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    'Cleared': { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function SanctionsScreeningPage() {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sanctions Screening</h2>
                    <p className="text-muted-foreground">Monitor and manage sanctions list matches and screening results.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Refresh Lists</Button>
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Export Report</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">Pending review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Screened Today</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,847</div>
                        <p className="text-xs text-muted-foreground">Automated screenings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lists Monitored</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Active sanctions lists</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2h ago</div>
                        <p className="text-xs text-muted-foreground">List synchronization</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="matches">
                <TabsList>
                    <TabsTrigger value="matches">Active Matches</TabsTrigger>
                    <TabsTrigger value="history">Screening History</TabsTrigger>
                    <TabsTrigger value="lists">Sanctions Lists</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by user, list, or country..."
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
                                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem>Pending Review</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>False Positive</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Confirmed Match</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Cleared</DropdownMenuCheckboxItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Filter by Risk Level</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem>Critical</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>High</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Medium</DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User / Match</TableHead>
                                        <TableHead>List</TableHead>
                                        <TableHead>Match Type</TableHead>
                                        <TableHead>Risk Level</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Screened At</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleMatches.map((match) => {
                                        const risk = riskConfig[match.riskLevel];
                                        const status = statusConfig[match.status];
                                        return (
                                            <TableRow 
                                                key={match.id} 
                                                onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/compliance-risk/${match.id}`)} 
                                                className="cursor-pointer"
                                            >
                                                <TableCell>
                                                    <div className="font-medium">{match.userName}</div>
                                                    <Link 
                                                        href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${match.userId}`} 
                                                        className="text-sm text-primary hover:underline" 
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {match.userId}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Matched: {match.matchedName}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{match.listName}</div>
                                                    <div className="text-xs text-muted-foreground">{match.country}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        match.matchType === 'Exact' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        match.matchType === 'Partial' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }>
                                                        {match.matchType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(risk.className)}>
                                                        {match.riskLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                                                        {status.icon}
                                                        {match.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {match.screenedAt}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                aria-haspopup="true" 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem>Mark as False Positive</DropdownMenuItem>
                                                            <DropdownMenuItem>Confirm Match</DropdownMenuItem>
                                                            <DropdownMenuItem>Escalate Case</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Screening History</CardTitle>
                            <CardDescription>Complete history of all sanctions screening activities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Screening history will be displayed here</p>
                                <p className="text-sm mt-2">Filter and search through all past screening results</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="lists" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Sanctions Lists</CardTitle>
                            <CardDescription>Manage and monitor the sanctions lists being screened against</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>List Name</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>Entries</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">OFAC SDN</TableCell>
                                        <TableCell>US Treasury</TableCell>
                                        <TableCell>2024-08-15 08:00</TableCell>
                                        <TableCell>12,458</TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-green-500">Active</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Refresh List</DropdownMenuItem>
                                                    <DropdownMenuItem>Configure</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">UN Consolidated List</TableCell>
                                        <TableCell>United Nations</TableCell>
                                        <TableCell>2024-08-15 07:30</TableCell>
                                        <TableCell>8,234</TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-green-500">Active</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Refresh List</DropdownMenuItem>
                                                    <DropdownMenuItem>Configure</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">EU Sanctions</TableCell>
                                        <TableCell>European Union</TableCell>
                                        <TableCell>2024-08-15 06:45</TableCell>
                                        <TableCell>5,891</TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-green-500">Active</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Refresh List</DropdownMenuItem>
                                                    <DropdownMenuItem>Configure</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}

