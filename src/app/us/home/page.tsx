
'use client';

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg text-center">
                     <CardContent className="p-12">
                        <Clock className="h-16 w-16 mx-auto text-primary mb-4" />
                        <h1 className="text-3xl font-bold">Coming Soon!</h1>
                        <p className="text-muted-foreground mt-2">Our services for the United States are launching soon.</p>
                        <Button asChild className="mt-6">
                            <Link href="/">Back to Global Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
