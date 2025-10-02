
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, MapPin, Ticket, Plus, Minus, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function PublicEventPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    const [event, setEvent] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!id) return;
        const fetchEvent = async () => {
            setLoading(true);
            const docRef = doc(db, "events", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setEvent(docSnap.data());
            } else {
                console.log("No such document!");
            }
            setLoading(false);
        };

        fetchEvent();
    }, [id]);

    const handleQuantityChange = (tierName: string, delta: number) => {
        setTicketQuantities(prev => {
            const currentQuantity = prev[tierName] || 0;
            const newQuantity = Math.max(0, currentQuantity + delta);
            return { ...prev, [tierName]: newQuantity };
        });
    };
    
    const totalCost = event?.tickets.reduce((acc: number, tier: any) => {
        const quantity = ticketQuantities[tier.name] || 0;
        return acc + (quantity * tier.price);
    }, 0) || 0;

    const totalTickets = Object.values(ticketQuantities).reduce((sum, q) => sum + q, 0);

    const handleCheckout = () => {
        // In a real app, this would redirect to a payment gateway
        toast({
            title: "Proceeding to Checkout",
            description: `You are purchasing ${totalTickets} ticket(s) for a total of $${totalCost.toFixed(2)}.`,
        });
    }

    if (loading) {
        return (
             <div className="flex flex-col min-h-screen">
                <SiteHeader />
                 <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <div className="lg:col-span-1 sticky top-20">
                            <Skeleton className="h-[450px] w-full" />
                        </div>
                    </div>
                 </main>
            </div>
        )
    }

    if (!event) {
        return (
             <div className="flex flex-col min-h-screen">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center text-center p-4">
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="h-16 w-16 text-destructive" />
                        <h1 className="text-3xl font-bold">Event Not Found</h1>
                        <p className="text-muted-foreground">The event you are looking for does not exist or may have been canceled.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Image and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden">
                            {event.bannerImage && (
                                <div className="relative aspect-video w-full">
                                    <Image src={event.bannerImage} alt={event.eventName} layout="fill" objectFit="cover" />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold tracking-tight">{event.eventName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        <span>{format(event.eventDate.toDate(), 'PPP')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: event.description || "<p>No description available.</p>" }} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Ticket Form */}
                    <div className="lg:col-span-1 sticky top-20 space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Ticket className="h-6 w-6"/> Get Your Tickets</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {event.tickets.map((tier: any) => (
                                    <div key={tier.name} className="p-4 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{tier.name}</p>
                                            <p className="text-sm font-bold text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency }).format(tier.price)}</p>
                                            <p className="text-xs text-muted-foreground">{tier.quantity} tickets available</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(tier.name, -1)}><Minus className="h-4 w-4"/></Button>
                                            <span className="font-bold w-6 text-center">{ticketQuantities[tier.name] || 0}</span>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(tier.name, 1)}><Plus className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                            <Separator />
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency }).format(totalCost)}</span>
                                </div>
                                <Button className="w-full" size="lg" disabled={totalCost <= 0} onClick={handleCheckout}>
                                    <CreditCard className="mr-2 h-5 w-5" /> Checkout
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
