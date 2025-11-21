
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Percent, HandCoins, UsersRound, MessageSquareWarning } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HealthScoreGauge } from '@/components/health-score-gauge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface HealthScoreData {
    overallScore: number;
    metrics: Array<{
        title: string;
        value: string;
        status: 'good' | 'warning' | 'bad';
    }>;
    alerts: Array<{
        title: string;
        description: string;
        level: 'high' | 'medium' | 'low';
    }>;
}

const statusColors: { [key: string]: string } = {
    good: 'bg-green-500/10 text-green-700',
    warning: 'bg-yellow-500/10 text-yellow-700',
    bad: 'bg-red-500/10 text-red-700',
};

const metricIcons: { [key: string]: React.ReactNode } = {
    'Revenue Growth': <TrendingUp/>,
    'Acceptance Rate': <CheckCircle/>,
    'Chargeback Rate': <AlertCircle/>,
    'Churn Rate': <TrendingDown/>,
    'Dispute Rate': <MessageSquareWarning/>,
    'New Customers': <UsersRound/>,
};

export default function HealthScorePage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [healthData, setHealthData] = useState<HealthScoreData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [comparisonMode, setComparisonMode] = useState('industry-avg');

    useEffect(() => {
        if (!user && !authLoading) {
            setLoading(false);
            return;
        }

        const fetchHealthScore = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/business/health-score?comparison=${comparisonMode}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch health score data');
                }

                const data = await response.json();
                setHealthData(data);
            } catch (err) {
                console.error('Error fetching health score data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load health score');
                // Fallback to mock data
                setHealthData({
                    overallScore: 85,
                    metrics: [
                        { title: 'Revenue Growth', value: '+12.5%', status: 'good' },
                        { title: 'Acceptance Rate', value: '98.2%', status: 'good' },
                        { title: 'Chargeback Rate', value: '0.15%', status: 'warning' },
                        { title: 'Churn Rate', value: '2.1%', status: 'good' },
                        { title: 'Dispute Rate', value: '0.05%', status: 'good' },
                        { title: 'New Customers', value: '52', status: 'good' },
                    ],
                    alerts: [
                        { title: 'Chargeback Rate Increase', description: 'Your chargeback rate has increased by 30% this week compared to the industry average of 0.08%.', level: 'high' },
                        { title: 'Failed Payments from UK', description: 'Payments from the United Kingdom have a 15% higher failure rate this month.', level: 'medium' },
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHealthScore();
        }
    }, [user, authLoading, comparisonMode]);
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Health Score</h2>
                    <p className="text-muted-foreground">A real-time score of your business's performance and risk.</p>
                </div>
                 <div className="flex items-center space-x-2">
                     <Select value={comparisonMode} onValueChange={setComparisonMode}>
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
                            {loading ? (
                                <Skeleton className="h-48 w-48 rounded-full" />
                            ) : (
                                <HealthScoreGauge score={healthData?.overallScore || 0} />
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
                     {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-20 mb-2" />
                                    <Skeleton className="h-5 w-16" />
                                </CardContent>
                            </Card>
                        ))
                    ) : healthData ? (
                        healthData.metrics.map(metric => (
                            <Card key={metric.title}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                       {metricIcons[metric.title]} {metric.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{metric.value}</p>
                                    <Badge className={cn("mt-1 text-xs", statusColors[metric.status])}>
                                        {metric.status === 'good' ? 'Good' : metric.status === 'warning' ? 'Warning' : 'Bad'}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))
                    ) : null}
                </div>
            </div>
            
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Smart Alerts & Recommendations</CardTitle>
                    <CardDescription>Areas where your business can improve, based on our analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))
                    ) : healthData ? (
                        healthData.alerts.map(alert => (
                            <div key={alert.title} className={cn("p-4 border rounded-lg", alert.level === 'high' ? 'border-red-500/50 bg-red-500/5' : alert.level === 'medium' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-blue-500/50 bg-blue-500/5') }>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className={cn("h-5 w-5", alert.level === 'high' ? 'text-red-600' : alert.level === 'medium' ? 'text-yellow-600' : 'text-blue-600')}/>
                                    <h4 className="font-semibold">{alert.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 pl-7">{alert.description}</p>
                            </div>
                        ))
                    ) : null}
                </CardContent>
            </Card>
        </>
    );
}
