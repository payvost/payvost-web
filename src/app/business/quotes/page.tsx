
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Search, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const sampleQuotes = [
    { id: 'Q-2024-001', client: 'Stark Industries', amount: '$15,000.00', status: 'Sent', issueDate: '2024-08-15' },
    { id: 'Q-2024-002', client: 'Wayne Enterprises', amount: '$8,200.00', status: 'Accepted', issueDate: '2024-08-14' },
    { id: 'Q-2024-003', client: 'Acme Inc.', amount: '$3,500.00', status: 'Draft', issueDate: '2024-08-16' },
    { id: 'Q-2024-004', client: 'Cyberdyne Systems', amount: '$25,000.00', status: 'Declined', issueDate: '2024-08-10' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Sent: 'secondary',
  Accepted: 'default',
  Draft: 'outline',
  Declined: 'destructive',
};

export default function QuoteBuilderPage() {
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quote Builder</h2>
                    <p className="text-muted-foreground">Create, send, and manage your business quotes.</p>
                </div>
                 <Button><PlusCircle className="mr-2 h-4 w-4"/>Create New Quote</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Quotes</CardTitle>
                            <CardDescription>Manage all your business quotes.</CardDescription>
                        </div>
                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by client or quote #..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Quote #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleQuotes.map((quote) => (
                            <TableRow key={quote.id}>
                                <TableCell className="font-medium">{quote.id}</TableCell>
                                <TableCell>{quote.client}</TableCell>
                                <TableCell>{quote.amount}</TableCell>
                                <TableCell>{quote.issueDate}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[quote.status]}>{quote.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View</DropdownMenuItem>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Convert to Invoice</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{sampleQuotes.length}</strong> of <strong>{sampleQuotes.length}</strong> quotes
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
