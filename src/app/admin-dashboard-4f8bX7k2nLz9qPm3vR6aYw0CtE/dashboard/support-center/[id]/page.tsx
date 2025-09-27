
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, MessageSquare, Send, CheckSquare, Clock, UserCog, AlertCircle, Briefcase, Mail, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { SupportTicket, TicketMessage } from '@/types/support-ticket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const ticketDetails: SupportTicket & { customer: any; messages: TicketMessage[] } = {
    id: 'tkt_1',
    subject: 'Transfer not received',
    customerName: 'Liam Johnson',
    status: 'Open',
    priority: 'High',
    assigneeName: 'Support Staff',
    createdAt: '2024-08-15',
    updatedAt: '2024-08-15',
    customer: {
        id: 'usr_1',
        name: 'Liam Johnson',
        email: 'liam@example.com',
        userType: 'Business Owner',
        kycStatus: 'Verified'
    },
    messages: [
        { id: 'msg_1', author: 'Liam Johnson', content: 'Hi, I sent a transfer of $250 to John Doe yesterday and it still shows as processing. Can you check on this?', timestamp: '2024-08-15 10:30 UTC', type: 'public_reply' },
        { id: 'msg_2', author: 'Support Staff', content: 'Investigating transaction txn_1a2b3c. Looks like a delay with the payout partner. Re-initiating payout.', timestamp: '2024-08-15 11:00 UTC', type: 'internal_note' },
        { id: 'msg_3', author: 'Support Staff', content: 'Hello Liam, thank you for your patience. We identified a small delay with our payout partner and have re-initiated the transfer. It should reflect in the recipient\'s account within the next 30 minutes. We apologize for the inconvenience.', timestamp: '2024-08-15 11:05 UTC', type: 'public_reply' },
    ]
};

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2).toUpperCase();
}


export default function TicketDetailsPage({ params }: { params: { id: string } }) {
    const ticket = ticketDetails;

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/support-center">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{ticket.subject}</h2>
                        <p className="text-muted-foreground">Ticket ID: {ticket.id}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline">Merge Ticket</Button>
                    <Button>Close Ticket</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             {ticket.messages.map((msg) => (
                                <div key={msg.id} className="flex gap-4">
                                     <Avatar>
                                        <AvatarImage src={`https://placehold.co/100x100.png`} />
                                        <AvatarFallback>{getInitials(msg.author)}</AvatarFallback>
                                    </Avatar>
                                    <div className={`p-4 rounded-lg w-full ${msg.type === 'internal_note' ? 'bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800/60' : 'bg-muted/50'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold">{msg.author}</p>
                                            <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                                        </div>
                                        <p className="text-sm">{msg.content}</p>
                                        {msg.type === 'internal_note' && <Badge variant="secondary" className="mt-2">Internal Note</Badge>}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <Tabs defaultValue="reply">
                            <CardHeader>
                                <TabsList>
                                    <TabsTrigger value="reply"><Send className="mr-2 h-4 w-4" />Reply to Customer</TabsTrigger>
                                    <TabsTrigger value="internal-note"><MessageSquare className="mr-2 h-4 w-4" />Add Internal Note</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                             <CardContent>
                                <Textarea placeholder="Type your message here..." rows={6} />
                            </CardContent>
                             <CardFooter className="justify-end">
                                <Button>Send Message</Button>
                            </CardFooter>
                        </Tabs>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2"><Label>Status</Label><Select defaultValue={ticket.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label>Priority</Label><Select defaultValue={ticket.priority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label>Assignee</Label><Select defaultValue={ticket.assigneeName}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Unassigned">Unassigned</SelectItem><SelectItem value="Support Staff">Support Staff</SelectItem><SelectItem value="Admin User">Admin User</SelectItem></SelectContent></Select></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>Customer Info</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{ticket.customer.name}</p></div>
                            <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{ticket.customer.email}</p></div>
                             <div><p className="text-sm text-muted-foreground">User Type</p><div><Badge variant="secondary">{ticket.customer.userType}</Badge></div></div>
                             <div><p className="text-sm text-muted-foreground">KYC Status</p><div><Badge>{ticket.customer.kycStatus}</Badge></div></div>
                        </CardContent>
                        <CardFooter>
                           <Button variant="outline" className="w-full" asChild>
                             <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${ticket.customer.id}`}>View Full Profile</Link>
                           </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
