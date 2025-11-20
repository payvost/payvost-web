
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const webhookLogs = [
  { id: 'wh_log_1', event: 'payment.succeeded', url: 'https://api.merchant-a.com/webhook', status: 'Success', statusCode: 200, attempt: 1, timestamp: '2024-08-15 10:30:15 UTC', payload: { id: 'evt_123', amount: 1000 } },
  { id: 'wh_log_2', event: 'payout.failed', url: 'https://api.merchant-b.com/webhook', status: 'Failed', statusCode: 500, attempt: 3, timestamp: '2024-08-15 11:05:00 UTC', payload: { id: 'evt_124', reason: 'Insufficient funds' } },
  { id: 'wh_log_3', event: 'customer.created', url: 'https://api.merchant-c.com/webhook', status: 'Success', statusCode: 200, attempt: 1, timestamp: '2024-08-15 09:45:30 UTC', payload: { id: 'cus_abc', email: 'test@example.com' } },
];

const statusConfig = {
    Success: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, variant: 'default' as const },
    Failed: { icon: <XCircle className="h-4 w-4 text-red-500" />, variant: 'destructive' as const },
    Pending: { icon: <Clock className="h-4 w-4 text-yellow-500" />, variant: 'secondary' as const },
};


export default function WebhooksLogsPage() {
    const [selectedLog, setSelectedLog] = React.useState(webhookLogs[0]);

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Webhooks & Logs</h2>
                    <p className="text-muted-foreground">Monitor all incoming and outgoing webhook events.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card>
                         <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by event, URL, or payload content..."
                                        className="w-full rounded-lg bg-background pl-8"
                                    />
                                </div>
                                <DateRangePicker />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>URL Endpoint</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {webhookLogs.map(log => (
                                        <TableRow key={log.id} onClick={() => setSelectedLog(log)} className="cursor-pointer">
                                            <TableCell className="font-mono text-xs">{log.event}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {statusConfig[log.status as keyof typeof statusConfig].icon}
                                                    <span>{log.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs truncate max-w-xs">{log.url}</TableCell>
                                            <TableCell>{log.timestamp}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                         <CardHeader>
                            <CardTitle>Log Details</CardTitle>
                             <CardDescription>ID: {selectedLog.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                 <Badge variant={statusConfig[selectedLog.status as keyof typeof statusConfig].variant}>{selectedLog.status} ({selectedLog.statusCode})</Badge>
                                 <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Retry Webhook</Button>
                            </div>
                            <Separator />
                            <div className="text-sm">
                                <p className="text-muted-foreground">Event Type</p>
                                <p className="font-mono">{selectedLog.event}</p>
                            </div>
                             <div className="text-sm">
                                <p className="text-muted-foreground">Endpoint URL</p>
                                <p className="font-mono break-all">{selectedLog.url}</p>
                            </div>
                             <div className="text-sm">
                                <p className="text-muted-foreground">Payload</p>
                                <CodeBlock code={JSON.stringify(selectedLog.payload, null, 2)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

const CodeBlock = ({ code }: { code: string }) => (
    <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-x-auto">
        <code>{code}</code>
    </pre>
);
