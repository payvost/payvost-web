
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileDown, ListFilter, MoreHorizontal, Search, AlertCircle, Bug, ServerCrash } from 'lucide-react';
import type { ErrorLog } from '@/types/error-log';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const sampleErrors: ErrorLog[] = [
  { id: 'err_1', type: 'APIError', message: "502 Bad Gateway from Payout Partner API", severity: 'Critical', count: 12, lastSeen: '2024-08-15 10:30 UTC', status: 'Unresolved' },
  { id: 'err_2', type: 'FrontendException', message: "TypeError: Cannot read properties of null (reading 'user')", severity: 'High', count: 88, lastSeen: '2024-08-15 11:00 UTC', status: 'Unresolved' },
  { id: 'err_3', type: 'DatabaseError', message: "Timeout: Connection to replica DB failed after 30s", severity: 'Medium', count: 5, lastSeen: '2024-08-14 09:15 UTC', status: 'Resolved' },
  { id: 'err_4', type: 'AuthenticationError', message: "Invalid JWT signature for user: usr_123", severity: 'Low', count: 25, lastSeen: '2024-08-15 08:00 UTC', status: 'Ignored' },
  { id: 'err_5', type: 'ValidationError', message: "Invalid 'amount' field in /v1/transfer", severity: 'Medium', count: 150, lastSeen: '2024-08-15 11:15 UTC', status: 'Unresolved' },
];


const severityConfig: Record<ErrorLog['severity'], { color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Critical: { color: 'text-red-600', variant: 'destructive' },
    High: { color: 'text-orange-600', variant: 'destructive' },
    Medium: { color: 'text-yellow-600', variant: 'secondary' },
    Low: { color: 'text-gray-600', variant: 'outline' },
};

export default function ErrorTrackingPage() {
    const router = useRouter();

    const renderErrorsTable = (data: ErrorLog[]) => (
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Error</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((err) => {
                const config = severityConfig[err.severity];
                return (
                    <TableRow key={err.id}>
                        <TableCell>
                            <div className="font-medium">{err.message}</div>
                            <div className="text-xs text-muted-foreground">{err.type} - {err.id}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={config.variant} className={cn("capitalize", config.color.replace('text-','bg-').replace('-600','-500/20'))}>{err.severity}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{err.count}</TableCell>
                        <TableCell>{err.lastSeen}</TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                                    <DropdownMenuItem>Ignore</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
    );

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Error Tracking</h2>
                    <p className="text-muted-foreground">Monitor and resolve system and application errors.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Alerting Rules</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Errors (24h)</CardTitle>
                        <Bug className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42</div>
                        <p className="text-xs text-muted-foreground">+5 since last hour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Occurrences (24h)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,254</div>
                        <p className="text-xs text-muted-foreground">across all error types</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unresolved Errors</CardTitle>
                        <ServerCrash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">3 critical errors need attention</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="unresolved">
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                        <TabsTrigger value="ignored">Ignored</TabsTrigger>
                    </TabsList>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by message or type..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                        <DateRangePicker />
                    </div>
                </div>

                 <Card className="mt-4">
                    <CardContent className="p-0">
                         <TabsContent value="unresolved">
                            {renderErrorsTable(sampleErrors.filter(e => e.status === 'Unresolved'))}
                        </TabsContent>
                         <TabsContent value="resolved">
                            {renderErrorsTable(sampleErrors.filter(e => e.status === 'Resolved'))}
                        </TabsContent>
                         <TabsContent value="ignored">
                            {renderErrorsTable(sampleErrors.filter(e => e.status === 'Ignored'))}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </>
    )
}
