
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, DocumentData, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lock, Landmark, CreditCard, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

const accountDetails: { [key: string]: any } = {
    USD: { beneficiary: 'Payvost Inc.', accountNumber: '0123456789', routingNumber: '987654321', bankName: 'Global Citizen Bank', address: '123 Finance Street, New York, NY 10001, USA' },
    NGN: { beneficiary: 'Payvost Nigeria Ltd.', accountNumber: '9876543210', bankName: 'Providus Bank', address: '1 Payvost Close, Lagos, Nigeria' },
    GBP: { beneficiary: 'Payvost UK Ltd.', accountNumber: '12345678', sortCode: '20-00-00', bankName: 'Barclays UK', address: '1 Churchill Place, London, E14 5HP, UK' },
    EUR: { beneficiary: 'Payvost Europe', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', bankName: 'Commerzbank', address: 'Kaiserplatz, 60311 Frankfurt am Main, Germany' },
};


export default function PaymentPage() {
    const params = useParams();
    const id = params.id as string;
    const [request, setRequest] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [payerEmail, setPayerEmail] = useState('');
    const [bankTransferState, setBankTransferState] = useState<'idle' | 'copied' | 'confirming' | 'confirmed'>('idle');
    const { toast } = useToast();

    useEffect(() => {
        if (!id) return;
        const fetchRequest = async () => {
            setLoading(true);
            const docRef = doc(db, "paymentRequests", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'Active') {
                    setRequest(data);
                } else {
                    setRequest(null); // Explicitly set to null if not active
                }
            } else {
                console.log("No such document!");
                setRequest(null);
            }
            setLoading(false);
        };

        fetchRequest();
    }, [id]);
    
    const bankDetails = request ? accountDetails[request.currency] || accountDetails.USD : {};

    const detailsToCopy = Object.entries(bankDetails)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}`)
        .join('\n');
    
    const handleCopy = () => {
        navigator.clipboard.writeText(detailsToCopy);
        toast({
            title: "Copied to Clipboard!",
            description: `Bank details for your ${request?.currency} payment have been copied.`,
        });
        setBankTransferState('copied');
    };

    const handleBankTransferConfirmation = async () => {
        if (!payerEmail) {
             toast({ title: "Email required", description: "Please enter your email address before confirming.", variant: "destructive" });
             return;
        }
        setBankTransferState('confirming');
         try {
            // In a real app, this would trigger a backend process to watch for the transfer.
            // For now, we simulate and save a pending transaction.
            const paymentsCollectionRef = collection(db, "paymentRequests", id, "payments");
            await addDoc(paymentsCollectionRef, {
                payerEmail: payerEmail,
                amount: request?.numericAmount,
                currency: request?.currency,
                status: 'Pending Verification',
                method: 'Bank Transfer',
                createdAt: serverTimestamp(),
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            setBankTransferState('confirmed');
        } catch (error) {
            console.error("Error confirming bank transfer:", error);
            toast({ title: "Error", description: "Could not confirm payment. Please try again.", variant: 'destructive'});
            setBankTransferState('copied');
        }
    }

    const formatCurrencyDisplay = (amount: number, currencyCode: string) => {
        if (!currencyCode) {
            return amount ? amount.toFixed(2) : '';
        }
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
            }).format(amount);
        } catch (e) {
            return `${currencyCode} ${amount ? amount.toFixed(2) : ''}`;
        }
    };

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
                        <p className="text-muted-foreground">This payment link is invalid or has been deactivated.</p>
                    </div>
                </main>
            </div>
        );
    }
    
    const displayAmount = request.currency && request.numericAmount
        ? formatCurrencyDisplay(request.numericAmount, request.currency)
        : request.amount;

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <SiteHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                 <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">You've been requested to pay</CardTitle>
                        <CardDescription>{request.description}</CardDescription>
                         <p className="text-4xl font-bold pt-4">{displayAmount}</p>
                    </CardHeader>
                    <Tabs defaultValue="card" className="w-full">
                         <div className="px-6 flex justify-center">
                            <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto">
                                <TabsTrigger value="card"><CreditCard className="mr-2"/>Card</TabsTrigger>
                                <TabsTrigger value="bank"><Landmark className="mr-2"/>Bank Transfer</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="card">
                             <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email-card">Your Email</Label>
                                    <Input id="email-card" type="email" placeholder="john.doe@example.com" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name-on-card">Name on Card</Label>
                                    <Input id="name-on-card" placeholder="John Doe" />
                                </div>
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
                                    Pay {displayAmount}
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    Powered by Payvost. Your payment is secure.
                                </p>
                            </CardFooter>
                        </TabsContent>
                        <TabsContent value="bank">
                             <CardContent className="space-y-4 pt-6">
                                 {bankTransferState !== 'confirmed' ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="email-bank">Your Email</Label>
                                            <Input id="email-bank" type="email" placeholder="john.doe@example.com" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} />
                                        </div>
                                        <p className="text-sm text-muted-foreground text-center">Make a local bank transfer to the details below to complete this payment.</p>
                                        <div className="space-y-3 rounded-md border p-4 text-sm">
                                            {Object.entries(bankDetails).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className="font-semibold">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                 ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                                        <h3 className="text-xl font-bold">Payment Initiated</h3>
                                        <p className="text-muted-foreground mt-2">We have been notified of your transfer. Your payment will be marked as complete once the funds are verified.</p>
                                    </div>
                                 )}
                            </CardContent>
                             <CardFooter className="flex-col gap-4">
                                {bankTransferState === 'idle' && (
                                     <Button className="w-full" variant="outline" onClick={handleCopy}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Account Details
                                    </Button>
                                )}
                                <AnimatePresence>
                                {bankTransferState === 'copied' && (
                                    <motion.div initial={{opacity: 0, y:10}} animate={{opacity: 1, y:0}} className="w-full">
                                        <Button className="w-full" onClick={handleBankTransferConfirmation}>
                                            I've Sent the Money
                                        </Button>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                                {bankTransferState === 'confirming' && (
                                    <Button className="w-full" disabled>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Confirming...
                                    </Button>
                                )}
                                <p className="text-xs text-muted-foreground text-center">
                                   Please use the payment description as the narration for your transfer.
                                </p>
                            </CardFooter>
                        </TabsContent>
                    </Tabs>
                </Card>
            </main>
        </div>
    );
}
