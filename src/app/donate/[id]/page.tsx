
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, DocumentData, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Heart, Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, BadgeCheck, User, Copy, CreditCard, Landmark, CheckCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Mock rates for client-side progress update simulation
const mockRatesToUsd: Record<string, number> = {
    USD: 1,
    NGN: 1 / 1450,
    EUR: 1.08,
    GBP: 1.27,
};

const mockRatesFromUsd: Record<string, number> = {
    NGN: 1450,
    EUR: 0.92,
    GBP: 0.79,
    USD: 1,
};

export default function DonationPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    const [campaign, setCampaign] = useState<DocumentData | null>(null);
    const [creator, setCreator] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [donationAmount, setDonationAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [donationSubmitted, setDonationSubmitted] = useState(false);
    
    const manualPaymentDetails = campaign?.manualPaymentDetails || {};
    const availableCurrenciesForManualPayment = Object.keys(manualPaymentDetails).filter(
        curr => manualPaymentDetails[curr] && Object.values(manualPaymentDetails[curr]).some(val => val)
    );


    useEffect(() => {
        if (!id) return;
        const fetchCampaignAndCreator = async () => {
            setLoading(true);
            const campaignDocRef = doc(db, "donations", id);
            const campaignDocSnap = await getDoc(campaignDocRef);

            if (campaignDocSnap.exists()) {
                const campaignData = campaignDocSnap.data();
                setCampaign(campaignData);

                if (campaignData.userId) {
                    const userDocRef = doc(db, "users", campaignData.userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setCreator(userDocSnap.data());
                    }
                }
            } else {
                console.log("No such document!");
            }
            setLoading(false);
        };

        fetchCampaignAndCreator();
    }, [id]);
    
    const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
        const url = window.location.href;
        const text = `Support this cause: ${campaign?.title}`;
        let shareUrl = '';

        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(campaign?.title || '')}&summary=${encodeURIComponent(campaign?.description.substring(0,100) || '')}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                toast({ title: "Link Copied!", description: "You can now share this campaign link." });
                return;
        }
        window.open(shareUrl, '_blank');
    };

    const handleCopyDetails = (currency: string) => {
        const details = manualPaymentDetails[currency];
        const detailsText = Object.entries(details)
            .filter(([, value]) => value) // Filter out empty fields
            .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: ${value}`)
            .join('\n');
        navigator.clipboard.writeText(detailsText);
        toast({ title: `Copied ${currency} Details`});
    }

    const handleDonationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaign || !donationAmount) return;

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate payment processing

        const amount = Number(donationAmount);
        const amountInUsd = amount * (mockRatesToUsd[campaign.currency] || 1);
        
        try {
            const campaignDocRef = doc(db, "donations", id);
            await updateDoc(campaignDocRef, {
                raisedAmount: increment(amountInUsd)
            });

            // Optimistically update local state for immediate feedback
            setCampaign(prev => prev ? ({...prev, raisedAmount: prev.raisedAmount + amountInUsd}) : null);

            toast({
                title: "Thank you for your donation!",
                description: `Your contribution of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: campaign.currency }).format(amount)} is greatly appreciated.`
            });
            
            setDonationSubmitted(true);

        } catch (error) {
            console.error("Error updating donation amount: ", error);
             toast({ title: "Donation Error", description: "Could not process donation. Please try again.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    }

    const renderEquivalents = () => {
        const amount = parseFloat(donationAmount);
        if (isNaN(amount) || amount <= 0 || !campaign?.currency) return null;

        const baseAmountInUsd = amount * (mockRatesToUsd[campaign.currency] || 0);

        const otherCurrencies = ['USD', 'NGN', 'EUR', 'GBP'].filter(c => c !== campaign.currency);

        const equivalents = otherCurrencies.map(curr => {
            const convertedValue = baseAmountInUsd * (mockRatesFromUsd[curr] || 0);
            return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertedValue)}`;
        }).join(' | ');

        return (
            <div className="text-xs text-muted-foreground text-center mt-2">
                Approx. {equivalents}
            </div>
        );
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
    const getInitials = (name: string) => {
        if (!name) return "";
        const names = name.split(' ');
        if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden">
                            {campaign.bannerImage && (
                                <div className="relative aspect-video w-full">
                                    <Image src={campaign.bannerImage} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 50vw" className="object-cover" />
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <Badge variant="secondary">{campaign.category}</Badge>
                                    {campaign.tags?.map((tag: string) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight">{campaign.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: campaign.description }} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 sticky top-20 space-y-6">
                        <Card>
                             <CardHeader className="text-center">
                                <p className="text-3xl font-bold">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(campaign.raisedAmount)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    raised of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(campaign.goal || 0)} goal
                                </p>
                                <Progress value={progress} className="mt-2"/>
                            </CardHeader>
                            {donationSubmitted ? (
                                <CardContent className="text-center py-10">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                                    <h3 className="text-xl font-bold">Thank You!</h3>
                                    <p className="text-muted-foreground mt-2">Your generous support makes a difference.</p>
                                </CardContent>
                            ) : (
                                <form onSubmit={handleDonationSubmit}>
                                    <CardContent className="space-y-4">
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Select an amount ({campaign.currency})</Label>
                                            <ToggleGroup type="single" className="grid grid-cols-3 gap-2" onValueChange={(value) => setDonationAmount(value)} value={donationAmount}>
                                                {campaign.suggestedAmounts?.map((amount: number) => (
                                                    <ToggleGroupItem key={amount} value={String(amount)} className="w-full h-12 text-lg">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: campaign.currency, minimumFractionDigits: 0 }).format(amount)}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        </div>
                                        {campaign.allowCustomAmount && (
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-amount">Or enter a custom amount</Label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: campaign.currency }).formatToParts(1).find(p => p.type === 'currency')?.value}</span>
                                                    <Input id="custom-amount" type="number" placeholder="5.00" className="pl-7" value={donationAmount} onChange={e => setDonationAmount(e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                        {renderEquivalents()}
                                        <Separator/>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Payment method</h4>
                                            {availableCurrenciesForManualPayment.length > 0 ? (
                                                    <Tabs defaultValue={availableCurrenciesForManualPayment[0]} className='w-full'>
                                                        <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${availableCurrenciesForManualPayment.length}, 1fr)`}}>
                                                            {availableCurrenciesForManualPayment.map(curr => <TabsTrigger key={curr} value={curr}>{curr}</TabsTrigger>)}
                                                        </TabsList>
                                                        {availableCurrenciesForManualPayment.map(curr => (
                                                            <TabsContent key={curr} value={curr}>
                                                                <div className='mt-4 space-y-3 rounded-md border p-4 text-sm'>
                                                                    {Object.entries(manualPaymentDetails[curr]).filter(([, value]) => value).map(([key, value]) => (
                                                                        <div key={key} className='flex justify-between'><span className='text-muted-foreground'>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span><span className='font-semibold'>{value as string}</span></div>
                                                                    ))}
                                                                </div>
                                                                <Button type="button" variant="outline" className="w-full mt-2" onClick={() => handleCopyDetails(curr)}><Copy className="mr-2 h-4 w-4" />Copy {curr} Details</Button>
                                                            </TabsContent>
                                                        ))}
                                                    </Tabs>
                                                ) : (
                                                    <p className="text-center text-sm text-muted-foreground p-4">No bank details provided for manual payment.</p>
                                                )}
                                                 <Button className="w-full mt-4" size="lg" type="submit" disabled={!donationAmount || Number(donationAmount) <= 0 || isSubmitting || availableCurrenciesForManualPayment.length === 0}>
                                                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                                                    I've Made The Transfer
                                                </Button>
                                        </div>
                                    </CardContent>
                                </form>
                             )}
                        </Card>
                        
                        {creator && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Created By</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-4">
                                     <Avatar className="h-12 w-12">
                                        <AvatarImage src={creator.photoURL || undefined} />
                                        <AvatarFallback>{getInitials(creator.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{creator.name}</p>
                                        {typeof creator.kycStatus === 'string' && creator.kycStatus.toLowerCase() === 'verified' && (
                                            <Badge variant="default" className="mt-1 bg-green-500/20 text-green-700">
                                                <BadgeCheck className="mr-1 h-3 w-3"/> Verified Creator
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Share this Campaign</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-4 gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}><Twitter className="h-5 w-5"/></Button>
                                <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}><Facebook className="h-5 w-5"/></Button>
                                <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}><Linkedin className="h-5 w-5"/></Button>
                                <Button variant="outline" size="icon" onClick={() => handleShare('copy')}><LinkIcon className="h-5 w-5"/></Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
