
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Percent, HandCoins, UsersRound, MessageSquareWarning } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HealthScoreGauge } from '@/components/health-score-gauge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const kpiMetrics = [
    { title: 'Revenue Growth', value: '+12.5%', status: 'good', icon: <TrendingUp/> },
    { title: 'Acceptance Rate', value: '98.2%', status: 'good', icon: <CheckCircle/> },
    { title: 'Chargeback Rate', value: '0.15%', status: 'warning', icon: <AlertCircle/> },
    { title: 'Churn Rate', value: '2.1%', status: 'good', icon: <TrendingDown/> },
    { title: 'Dispute Rate', value: '0.05%', status: 'good', icon: <MessageSquareWarning/> },
    { title: 'New Customers', value: '52', status: 'good', icon: <UsersRound/> },
];

const smartAlerts = [
    { title: 'Chargeback Rate Increase', description: 'Your chargeback rate has increased by 30% this week compared to the industry average of 0.08%.', level: 'high' },
    { title: 'Failed Payments from UK', description: 'Payments from the United Kingdom have a 15% higher failure rate this month.', level: 'medium' },
];

const statusColors: { [key: string]: string } = {
    good: 'bg-green-500/10 text-green-700',
    warning: 'bg-yellow-500/10 text-yellow-700',
    bad: 'bg-red-500/10 text-red-700',
};

export default function HealthScorePage() {
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Health Score</h2>
                    <p className="text-muted-foreground">A real-time score of your business's performance and risk.</p>
                </div>
                 <div className="flex items-center space-x-2">
                     <Select defaultValue="industry-avg">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="industry-avg">vs. Industry Average</SelectItem>
                            <SelectItem value="last-month">vs. Last Month</SelectItem>
                            <SelectItem value="last-quarter">vs. Last Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="text-center">
                            <CardTitle>Overall Health Score</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <HealthScoreGauge score={85} />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
                     {kpiMetrics.map(metric => (
                        <Card key={metric.title}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                   {metric.icon} {metric.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{metric.value}</p>
                                <Badge className={cn("mt-1 text-xs", statusColors[metric.status])}>Good</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Smart Alerts & Recommendations</CardTitle>
                    <CardDescription>Areas where your business can improve, based on our analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {smartAlerts.map(alert => (
                        <div key={alert.title} className={cn("p-4 border rounded-lg", alert.level === 'high' ? 'border-red-500/50 bg-red-500/5' : 'border-yellow-500/50 bg-yellow-500/5') }>
                            <div className="flex items-center gap-2">
                                <AlertCircle className={cn("h-5 w-5", alert.level === 'high' ? 'text-red-600' : 'text-yellow-600')}/>
                                <h4 className="font-semibold">{alert.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 pl-7">{alert.description}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </>
    );
}
