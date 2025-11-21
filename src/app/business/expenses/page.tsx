'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';

export default function ExpensesPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Expenses & Bills</h2>
                    <p className="text-muted-foreground">Track and manage your business expenses and bills.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Expenses & Bills</CardTitle>
                    <CardDescription>Manage your business expenses and recurring bills.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Expense Tracking Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Track your business expenses, upload receipts, and manage recurring bills.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

