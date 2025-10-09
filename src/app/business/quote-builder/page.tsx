
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function QuoteBuilderPage() {
  return (
    <>
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Quote Builder</h2>
                <p className="text-muted-foreground">Create, send, and manage quotes for your clients.</p>
            </div>
            <div className="flex items-center space-x-2">
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Create New Quote</Button>
            </div>
        </div>
        <Card className="h-96">
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
                <h3 className="text-2xl font-bold tracking-tight">Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-2">The Quote Builder is under construction. Stay tuned!</p>
            </CardContent>
        </Card>
    </>
  );
}
