
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
import { AlertCircle, Heart, Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, BadgeCheck, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


export default function DonationPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    const [campaign, setCampaign] = useState<DocumentData | null>(null);
    const [creator, setCreator] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [donationAmount, setDonationAmount] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchCampaignAndCreator = async () => {
            setLoading(true);
            const campaignDocRef = doc(db, "donations", id);
            const campaignDocSnap = await getDoc(campaignDocRef);

            if (campaignDocSnap.exists()) {
                const campaignData = campaignDocSnap.data();
                setCampaign(campaignData);

                // Fetch creator data
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

    const handleDonationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Thank you for your donation!",
            description: `Your contribution of $${donationAmount} is greatly appreciated.`
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
                    {/* Left Column: Image and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden">
                            {campaign.bannerImage && (
                                <div className="relative aspect-video w-full">
                                    <Image src={campaign.bannerImage} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 50vw" className="object-cover" />
                                </div>
                            )}
                            {campaign.gallery && campaign.gallery.length > 0 && (
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                        {campaign.gallery.map((imgUrl: string, index: number) => (
                                            <div key={index} className="relative aspect-square">
                                                <Image src={imgUrl} alt={`Gallery image ${index+1}`} layout="fill" objectFit="cover" className="rounded-md hover:opacity-80 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
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

                    {/* Right Column: Donation Form */}
                    <div className="lg:col-span-1 sticky top-20 space-y-6">
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
                                        {creator.kycStatus === 'Verified' && (
                                            <Badge variant="default" className="mt-1 bg-green-500/20 text-green-700">
                                                <BadgeCheck className="mr-1 h-3 w-3"/> Verified
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
