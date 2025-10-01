
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
import { AlertCircle, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PaymentPage() {
    const params = useParams();
    const id = params.id as string;
    const [request, setRequest] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchRequest = async () => {
            setLoading(true);
            const docRef = doc(db, "paymentRequests", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setRequest(docSnap.data());
            } else {
                console.log("No such document!");
            }
            setLoading(false);
        };

        fetchRequest();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                 <SiteHeader />
                 <main className="flex-1 flex items-center justify-center p-4">
                     <Card className="w-full max-w-md">
                        <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                        <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
                     </Card>
                 </main>
            </div>
        )
    }

    if (!request) {
        return (
             <div className="flex flex-col min-h-screen">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center text-center p-4">
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="h-16 w-16 text-destructive" />
                        <h1 className="text-3xl font-bold">Payment Link Not Found</h1>
                        <p className="text-muted-foreground">This payment link is invalid or has expired.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <SiteHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                 <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">You've been requested to pay</CardTitle>
                        <CardDescription>{request.description}</CardDescription>
                         <p className="text-4xl font-bold pt-4">{request.amount}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Separator />
                        <div className="space-y-2">
                             <Label htmlFor="card-number">Card Details</Label>
                             <Input id="card-number" placeholder="Card Number" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="MM / YY" />
                            <Input placeholder="CVC" />
                        </div>
                    </CardContent>
                     <CardFooter className="flex-col gap-4">
                        <Button className="w-full" size="lg">
                            <Lock className="mr-2 h-4 w-4" />
                            Pay {request.amount}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Powered by Payvost. Your payment is secure.
                        </p>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
