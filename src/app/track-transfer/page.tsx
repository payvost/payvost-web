
'use client';

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { ArrowRight, Search, CheckCircle, Clock, Package, Plane, Banknote } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Status = "Initiated" | "Processing" | "In Transit" | "Ready for Pickup" | "Completed" | "Pending" | "Paid" | "Failed";

const statusMap: Record<string, Status> = {
    Pending: "Processing",
    Paid: "Completed",
    Completed: "Completed",
    Failed: "Failed"
};


const timelineSteps: { status: Status, icon: React.ReactNode, description: string }[] = [
    { status: 'Initiated', icon: <Package className="h-5 w-5" />, description: 'Your transfer has been successfully initiated.' },
    { status: 'Processing', icon: <Clock className="h-5 w-5" />, description: 'Your funds are being processed by our system.' },
    { status: 'In Transit', icon: <Plane className="h-5 w-5" />, description: 'The funds are on their way to the destination country.' },
    { status: 'Ready for Pickup', icon: <Banknote className="h-5 w-5" />, description: 'Funds are available for pickup by the recipient.' },
    { status: 'Completed', icon: <CheckCircle className="h-5 w-5" />, description: 'The recipient has successfully received the funds.' },
]

export default function TrackTransferPage() {
    const [trackingId, setTrackingId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
    const { toast } = useToast();

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) {
            toast({ title: "Error", description: "Please enter a tracking ID.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setCurrentStatus(null);
        
        try {
            const docRef = doc(db, "paymentRequests", trackingId.trim());
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Map Firestore status ('Pending', 'Paid') to timeline status ('Processing', 'Completed')
                const timelineStatus = statusMap[data.status] || 'Initiated';
                setCurrentStatus(timelineStatus);
            } else {
                 toast({
                    title: "Not Found",
                    description: "No transaction found with that tracking ID.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error fetching transaction:", error);
            toast({
                title: "Error",
                description: "Could not fetch transaction details. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const currentStepIndex = currentStatus ? timelineSteps.findIndex(step => step.status === currentStatus) : -1;

    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1 flex items-center justify-center p-4 bg-muted/40">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                         <div className="mx-auto w-fit p-3 bg-primary/10 rounded-full mb-4">
                            <Search className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl">Track Your Transfer</CardTitle>
                        <CardDescription>Enter your tracking ID to see the latest status of your transfer.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleTrack}>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Enter your tracking ID (e.g., TXN12345678)"
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                />
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                    {currentStatus && (
                         <CardFooter>
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full pt-6 border-t"
                                >
                                     <ul className="space-y-8 relative">
                                        {/* Dotted line */}
                                        <div className="absolute left-4 top-0 h-full w-0.5 border-l-2 border-dashed border-border -z-10"></div>
                                        
                                        {timelineSteps.map((step, index) => {
                                            const isActive = index <= currentStepIndex;
                                            return (
                                                <li key={step.status} className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
                                                        isActive ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border text-muted-foreground"
                                                    )}>
                                                        {isActive ? <CheckCircle className="h-5 w-5" /> : step.icon}
                                                    </div>
                                                    <div>
                                                        <p className={cn(
                                                            "font-semibold",
                                                            isActive ? "text-foreground" : "text-muted-foreground"
                                                        )}>{step.status}</p>
                                                        <p className="text-sm text-muted-foreground">{step.description}</p>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </motion.div>
                            </AnimatePresence>
                        </CardFooter>
                    )}
                </Card>
            </main>
        </div>
    )
}
