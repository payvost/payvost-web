'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export default function GeneralLedgerPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">General Ledger</h2>
                    <p className="text-muted-foreground">View your complete accounting ledger and transaction history.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Ledger</CardTitle>
                    <CardDescription>Complete record of all financial transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">General Ledger Coming Soon</h3>
                        <p className="text-sm text-muted-foreground">
                            This feature will provide a comprehensive view of all your accounting entries.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

