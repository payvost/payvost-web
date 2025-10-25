
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CircleArrowUp } from 'lucide-react';

export function RoundUpSettings() {
     // In a real app, this state would come from user settings
    const isRoundUpEnabled = false;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CircleArrowUp className="h-5 w-5"/> Round-Ups</CardTitle>
                <CardDescription>Round up your card transactions to the nearest dollar and save the spare change.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isRoundUpEnabled ? (
                    <div className="space-y-2">
                        <p className="font-semibold text-lg text-green-500">$12.34</p>
                        <p className="text-sm text-muted-foreground">Saved this month from round-ups.</p>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <p>Round-Ups are currently disabled.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <div className="flex items-center justify-between w-full">
                    <Label htmlFor="roundup-switch" className="text-sm font-medium">Enable Round-Ups</Label>
                    <Switch id="roundup-switch" checked={isRoundUpEnabled} />
                </div>
            </CardFooter>
        </Card>
    );
}
