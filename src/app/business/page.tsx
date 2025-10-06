
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, CheckCircle, Users, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const kpiCards = [
    { title: "Total Volume", value: "$125,000", change: "+15.2% vs last month", icon: <LineChart className="h-4 w-4 text-muted-foreground" /> },
    { title: "Successful Payouts", value: "420", change: "+35 vs last month", icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active Customers", value: "87", change: "+5 new this month", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Pending Invoices", value: "4", change: "$12,500 outstanding", icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
];


export default function BusinessDashboardPage() {
    const loading = false; // Set to true to see skeleton state

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Dashboard</h2>
                    <p className="text-muted-foreground">A high-level view of your business's performance.</p>
                </div>
            </div>

             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map(item => (
                    <Card key={item.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                            {item.icon}
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <>
                                    <Skeleton className="h-8 w-3/4 mb-1" />
                                    <Skeleton className="h-4 w-1/2" />
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{item.value}</div>
                                    <p className="text-xs text-muted-foreground">{item.change}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    )
}
