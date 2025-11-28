'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileDown, Search, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Shield, Activity, Target } from 'lucide-react';
import { AdminTransactionOverviewChart } from '@/components/admin-transaction-overview-chart';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

interface RiskMetric {
    id: string;
    category: string;
    riskScore: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    status: 'High' | 'Medium' | 'Low';
    lastUpdated: string;
}

const sampleRiskMetrics: RiskMetric[] = [
    { id: 'metric_1', category: 'Transaction Risk', riskScore: 72, trend: 'up', change: 5.2, status: 'High', lastUpdated: '2024-08-15 10:30' },
    { id: 'metric_2', category: 'Customer Onboarding Risk', riskScore: 45, trend: 'down', change: -3.1, status: 'Low', lastUpdated: '2024-08-15 10:25' },
    { id: 'metric_3', category: 'Geographic Risk', riskScore: 68, trend: 'up', change: 2.8, status: 'Medium', lastUpdated: '2024-08-15 10:20' },
    { id: 'metric_4', category: 'Velocity Risk', riskScore: 55, trend: 'stable', change: 0.1, status: 'Medium', lastUpdated: '2024-08-15 10:15' },
    { id: 'metric_5', category: 'Device Risk', riskScore: 38, trend: 'down', change: -1.5, status: 'Low', lastUpdated: '2024-08-15 10:10' },
    { id: 'metric_6', category: 'Behavioral Risk', riskScore: 62, trend: 'up', change: 4.3, status: 'Medium', lastUpdated: '2024-08-15 10:05' },
];

const riskConfig: Record<string, { className: string; color: string }> = {
    High: { className: 'bg-red-600/20 text-red-800 border-red-600/30', color: 'bg-red-600' },
    Medium: { className: 'bg-orange-500/20 text-orange-800 border-orange-500/30', color: 'bg-orange-500' },
    Low: { className: 'bg-green-500/20 text-green-800 border-green-500/30', color: 'bg-green-500' },
};

const getRiskLevel = (score: number): keyof typeof riskConfig => {
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
};

export default function RiskAssessmentPage() {
    const router = useRouter();
    const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null);

    const overallRiskScore = 58; // Calculated average
    const overallRiskLevel = getRiskLevel(overallRiskScore);

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Risk Assessment</h2>
                    <p className="text-muted-foreground">Comprehensive risk analysis and scoring across all categories.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><Target className="mr-2 h-4 w-4"/>Configure Thresholds</Button>
                    <Button><FileDown className="mr-2 h-4 w-4"/>Export Report</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallRiskScore}</div>
                        <div className="mt-2">
                            <Progress value={overallRiskScore} className="h-2" />
                        </div>
                        <Badge variant="outline" className={cn("mt-2", riskConfig[overallRiskLevel].className)}>
                            {overallRiskLevel} Risk
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High-Risk Categories</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Trends</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2.1%</div>
                        <p className="text-xs text-muted-foreground">Average increase this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assessments Today</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,247</div>
                        <p className="text-xs text-muted-foreground">Automated risk evaluations</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Risk Overview</TabsTrigger>
                    <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
                    <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Score Distribution</CardTitle>
                                <CardDescription>Breakdown of risk scores across all categories</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AdminTransactionOverviewChart />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Category Status</CardTitle>
                                <CardDescription>Current risk levels by category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {sampleRiskMetrics.map((metric) => {
                                        const riskLevel = getRiskLevel(metric.riskScore);
                                        const risk = riskConfig[riskLevel];
                                        return (
                                            <div key={metric.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{metric.category}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={cn(risk.className)}>
                                                            {riskLevel}
                                                        </Badge>
                                                        <span className="text-sm font-mono">{metric.riskScore}</span>
                                                    </div>
                                                </div>
                                                <Progress value={metric.riskScore} className="h-2" />
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Last updated: {metric.lastUpdated}</span>
                                                    <div className="flex items-center gap-1">
                                                        {metric.trend === 'up' ? (
                                                            <TrendingUp className="h-3 w-3 text-red-500" />
                                                        ) : metric.trend === 'down' ? (
                                                            <TrendingDown className="h-3 w-3 text-green-500" />
                                                        ) : (
                                                            <Activity className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                        <span className={cn(
                                                            metric.trend === 'up' ? 'text-red-500' : 
                                                            metric.trend === 'down' ? 'text-green-500' : 
                                                            'text-muted-foreground'
                                                        )}>
                                                            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="metrics" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Detailed Risk Metrics</CardTitle>
                                    <CardDescription>Comprehensive risk assessment data</CardDescription>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search metrics..."
                                        className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Risk Score</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Trend</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleRiskMetrics.map((metric) => {
                                        const riskLevel = getRiskLevel(metric.riskScore);
                                        const risk = riskConfig[riskLevel];
                                        return (
                                            <TableRow key={metric.id} className="cursor-pointer" onClick={() => setSelectedMetric(metric.id)}>
                                                <TableCell className="font-medium">{metric.category}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24">
                                                            <Progress value={metric.riskScore} className="h-2" />
                                                        </div>
                                                        <span className="font-mono text-sm">{metric.riskScore}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(risk.className)}>
                                                        {riskLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {metric.trend === 'up' ? (
                                                            <TrendingUp className="h-4 w-4 text-red-500" />
                                                        ) : metric.trend === 'down' ? (
                                                            <TrendingDown className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span className={cn(
                                                            "text-sm",
                                                            metric.trend === 'up' ? 'text-red-500' : 
                                                            metric.trend === 'down' ? 'text-green-500' : 
                                                            'text-muted-foreground'
                                                        )}>
                                                            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{metric.lastUpdated}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem>Configure Rules</DropdownMenuItem>
                                                            <DropdownMenuItem>Export Data</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Trend Analysis</CardTitle>
                            <CardDescription>Historical risk assessment trends over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminTransactionOverviewChart />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}

