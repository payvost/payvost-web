
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, DocumentData, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart2, CheckCircle, Eye, Users, FileDown, Ticket } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EventAnalyticsChart } from '@/components/event-analytics-chart';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { format } from 'date-fns';

export default function EventStatsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const params = useParams();
    const id = params.id as string;
    const [eventDetails, setEventDetails] = useState<DocumentData | null>(null);
    const [ticketsSold, setTicketsSold] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const eventUnsub = onSnapshot(doc(db, "events", id), (doc) => {
            if (doc.exists()) {
                setEventDetails({ id: doc.id, ...doc.data() });
            } else {
                setEventDetails(null);
            }
            setLoading(false);
        });

        // In a real app, you might have a subcollection for tickets sold
        // For now, we'll use mock data.
        setTicketsSold([
            { id: 'tkt_1', buyerEmail: 'attendee1@example.com', tier: 'General Admission', purchaseDate: new Date(), amount: 25.00 },
            { id: 'tkt_2', buyerEmail: 'attendee2@example.com', tier: 'VIP', purchaseDate: new Date(), amount: 75.00 },
        ]);

        return () => {
            eventUnsub();
        };
    }, [id]);

    const totalRevenue = ticketsSold.reduce((sum, p) => sum + p.amount, 0);
    const totalTicketsSold = ticketsSold.length;
    const totalTicketsAvailable = eventDetails?.tickets.reduce((sum: number, t: any) => sum + t.quantity, 0) || 0;

    if (loading) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex-1 p-4 lg:p-6">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <Skeleton className="h-20 w-full mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </main>
            </DashboardLayout>
        );
    }

    if (!eventDetails) {
         return (
             <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex-1 p-4 lg:p-6 text-center">
                    <h1 className="text-2xl font-bold">Event Not Found</h1>
                    <p className="text-muted-foreground">The event you are looking for does not exist.</p>
                </main>
             </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                 <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/dashboard/request-payment?tab=event-tickets">
                            <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold md:text-2xl">{eventDetails.eventName} - Stats</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary">Live</Badge>
                                <span>ID: {eventDetails.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline">Edit Event</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <BarChart2 className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: eventDetails.currency }).format(totalRevenue)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTicketsSold} / {totalTicketsAvailable}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{eventDetails.views || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                 <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    <Card className="xl:col-span-3">
                        <CardHeader>
                            <CardTitle>Sales Over Time</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2 h-[200px]">
                            <EventAnalyticsChart />
                        </CardContent>
                    </Card>
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Sales Funnel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Eye className="h-6 w-6 text-muted-foreground mr-4"/>
                                    <div className="flex-1"><p className="font-medium">Page Views</p></div>
                                    <p className="font-bold text-lg">{eventDetails.views || 0}</p>
                                </div>
                                <div className="flex items-center">
                                    <Users className="h-6 w-6 text-muted-foreground mr-4"/>
                                    <div className="flex-1"><p className="font-medium">Checkouts Initiated</p></div>
                                    <p className="font-bold text-lg">{totalTicketsSold + 5}</p>
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle className="h-6 w-6 text-green-500 mr-4"/>
                                    <div className="flex-1"><p className="font-medium">Tickets Purchased</p></div>
                                    <p className="font-bold text-lg">{totalTicketsSold}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Recent Ticket Purchases</CardTitle>
                            <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Export</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Ticket Tier</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {ticketsSold.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No tickets sold yet.</TableCell>
                                    </TableRow>
                               ) : (
                                ticketsSold.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.buyerEmail}</TableCell>
                                        <TableCell><Badge variant="outline">{t.tier}</Badge></TableCell>
                                        <TableCell>{format(t.purchaseDate, 'PPP')}</TableCell>
                                        <TableCell className="text-right font-mono">
                                             {new Intl.NumberFormat('en-US', { style: 'currency', currency: eventDetails.currency }).format(t.amount)}
                                        </TableCell>
                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </DashboardLayout>
    );
}
