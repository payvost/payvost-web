'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart } from 'lucide-react';

export default function FinancialReportsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
                    <p className="text-muted-foreground">Generate and download comprehensive financial reports.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Create custom financial reports for your business.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Financial Reports Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate profit & loss statements, balance sheets, cash flow reports, and more.
                        </p>
                        <Button>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

