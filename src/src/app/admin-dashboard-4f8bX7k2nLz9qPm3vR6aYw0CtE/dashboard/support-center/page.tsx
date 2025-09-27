
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Mail, Clock, CheckSquare } from 'lucide-react';
import type { SupportTicket, SupportTicketStatus } from '@/types/support-ticket';
import { useRouter } from 'next/navigation';

const sampleTickets: SupportTicket[] = [
  { id: 'tkt_1', subject: 'Transfer not received', customerName: 'Liam Johnson', status: 'Open', priority: 'High', assigneeName: 'Support Staff', createdAt: '2024-08-15', updatedAt: '2024-08-15' },
  { id: 'tkt_2', subject: 'How to create a virtual card?', customerName: 'Olivia Smith', status: 'Pending', priority: 'Medium', assigneeName: 'Support Staff', createdAt: '2024-08-14', updatedAt: '2024-08-14' },
  { id: 'tkt_3', subject: 'Password Reset Issue', customerName: 'Noah Williams', status: 'Open', priority: 'Urgent', assigneeName: 'Unassigned', createdAt: '2024-08-15', updatedAt: '2024-08-15' },
  { id: 'tkt_4', subject: 'Question about fees', customerName: 'Emma Brown', status: 'Resolved', priority: 'Low', assigneeName: 'Admin User', createdAt: '2024-08-13', updatedAt: '2024-08-14' },
  { id: 'tkt_5', subject: 'Feature Request: Dark Mode', customerName: 'James Jones', status: 'Closed', priority: 'Low', assigneeName: 'Admin User', createdAt: '2024-08-10', updatedAt: '2024-08-11' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Open: 'default',
  Pending: 'secondary',
  Resolved: 'outline',
  Closed: 'outline',
};

const priorityVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
  Urgent: 'destructive',
};

export default function SupportCenterPage() {
    const router = useRouter();

    const renderTicketsTable = (tickets: SupportTicket[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.map(ticket => (
                    <TableRow key={ticket.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/support-center/${ticket.id}`)} className="cursor-pointer">
                        <TableCell className="font-medium">{ticket.customerName}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell><Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge></TableCell>
                        <TableCell><Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge></TableCell>
                        <TableCell>{ticket.assigneeName}</TableCell>
                        <TableCell>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Ticket</DropdownMenuItem>
                                    <DropdownMenuItem>Assign to me</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Support Center</h2>
                    <p className="text-muted-foreground">Manage customer support tickets and inquiries.</p>
                </div>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Create Ticket</Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Tickets</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">tickets awaiting assignment</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tickets</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-muted-foreground">awaiting customer response</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.5 hours</div>
                        <p className="text-xs text-muted-foreground">in the last 24 hours</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <Tabs defaultValue="unassigned">
                        <TabsList>
                            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
                            <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
                            <TabsTrigger value="all-open">All Open</TabsTrigger>
                            <TabsTrigger value="closed">Closed</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    {renderTicketsTable(sampleTickets)}
                </CardContent>
                 <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-5</strong> of <strong>25</strong> tickets
                    </div>
                </CardFooter>
            </Card>

        </>
    );
}
