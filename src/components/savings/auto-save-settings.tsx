
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap } from 'lucide-react';

export function AutoSaveSettings() {
    // In a real app, this state would come from user settings
    const isAutoSaveEnabled = false;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Auto-Save</CardTitle>
                <CardDescription>Automatically save a fixed amount from your wallet based on a schedule you set.</CardDescription>
            </CardHeader>
            <CardContent>
                {isAutoSaveEnabled ? (
                    <div className="space-y-4">
                        <p className="text-sm">Current Plan: <strong>$50.00 weekly</strong> from your USD wallet.</p>
                         <Button variant="outline" className="w-full">Modify Plan</Button>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <p>Auto-Save is currently disabled.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <div className="flex items-center justify-between w-full">
                    <Label htmlFor="autosave-switch" className="text-sm font-medium">Enable Auto-Save</Label>
                    <Switch id="autosave-switch" checked={isAutoSaveEnabled} />
                </div>
            </CardFooter>
        </Card>
    );
}
