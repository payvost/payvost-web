'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Zap } from 'lucide-react';

export default function AccountingAutomationPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Accounting Automation</h2>
                    <p className="text-muted-foreground">Automate your accounting workflows and bookkeeping tasks.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Automation Settings</CardTitle>
                    <CardDescription>Configure automated accounting processes and integrations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Accounting Automation Coming Soon</h3>
                        <p className="text-sm text-muted-foreground">
                            Set up automated rules for categorizing transactions, generating reports, and syncing with accounting software.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

