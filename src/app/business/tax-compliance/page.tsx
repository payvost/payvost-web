'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText } from 'lucide-react';

export default function TaxCompliancePage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tax & Compliance</h2>
                    <p className="text-muted-foreground">Manage tax obligations and ensure regulatory compliance.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tax & Compliance</CardTitle>
                    <CardDescription>Track tax obligations and maintain compliance records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Tax & Compliance Coming Soon</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage tax calculations, generate tax reports, and ensure compliance with local regulations.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

