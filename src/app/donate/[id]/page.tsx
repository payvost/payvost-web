
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';


export default function DonationPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    const [campaign, setCampaign] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [donationAmount, setDonationAmount] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchCampaign = async () => {
            setLoading(true);
            const docRef = doc(db, "donations", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setCampaign(docSnap.data());
            } else {
                console.log("No such document!");
            }
            setLoading(false);
        };

        fetchCampaign();
    }, [id]);

    const handleDonationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Thank you for your donation!",
            description: `Your contribution of $${donationAmount} is greatly appreciated.`
        });
    }
    
    if (loading) {
        return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>
    }

    if (!campaign) {
        return (
             <div className="flex flex-col min-h-screen">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center text-center p-4">
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="h-16 w-16 text-destructive" />
                        <h1 className="text-3xl font-bold">Campaign Not Found</h1>
                        <p className="text-muted-foreground">The donation campaign you are looking for does not exist or has been removed.</p>
                    </div>
                </main>
            </div>
        );
    }

    const progress = campaign.goal > 0 ? (campaign.raisedAmount / campaign.goal) * 100 : 0;

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Image and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden">
                           <div className="relative aspect-video w-full">
                                <Image src={campaign.bannerImage} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 50vw" className="object-cover" />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold tracking-tight">{campaign.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p>{campaign.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Donation Form */}
                    <div className="lg:col-span-1 sticky top-20">
                        <Card>
                             <CardHeader className="text-center">
                                <p className="text-3xl font-bold">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: campaign.currency }).format(campaign.raisedAmount)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    raised of {new Intl.NumberFormat('en-US', { style: 'currency', currency: campaign.currency }).format(campaign.goal || 0)} goal
                                </p>
                                <Progress value={progress} className="mt-2"/>
                            </CardHeader>
                            <form onSubmit={handleDonationSubmit}>
                                <CardContent className="space-y-6">
                                     <Separator />
                                     <div>
                                        <Label className="font-semibold">Select an amount to give</Label>
                                         <ToggleGroup type="single" className="grid grid-cols-3 gap-2 mt-2" onValueChange={(value) => setDonationAmount(value)}>
                                            {campaign.suggestedAmounts?.map((amount: number) => (
                                                <ToggleGroupItem key={amount} value={String(amount)} className="w-full h-12 text-lg">
                                                    ${amount}
                                                </ToggleGroupItem>
                                            ))}
                                        </ToggleGroup>
                                    </div>
                                    {campaign.allowCustomAmount && (
                                        <div className="space-y-2">
                                            <Label htmlFor="custom-amount">Or enter a custom amount</Label>
                                            <div className="relative">
                                                 <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
                                                 <Input 
                                                    id="custom-amount" 
                                                    type="number" 
                                                    placeholder="5.00" 
                                                    className="pl-7"
                                                    value={donationAmount}
                                                    onChange={e => setDonationAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" type="submit" size="lg" disabled={!donationAmount || Number(donationAmount) <= 0}>
                                        <Heart className="mr-2 h-5 w-5" /> Donate Now
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
