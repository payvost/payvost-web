
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, GitCommit, GitPullRequest, GitBranch, Zap, CheckCircle, XCircle, Clock, GitCommitVertical, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const featureFlags = [
    { id: 'ff_1', name: 'New Dashboard UI', enabled: true },
    { id: 'ff_2', name: 'Crypto Payouts (Beta)', enabled: false },
    { id: 'ff_3', name: 'In-app Chat Support', enabled: true },
    { id: 'ff_4', name: 'AI Fraud Detection', enabled: true },
];

const deploymentHistory = [
    { id: 'dep_1', version: '2.5.1', date: '2024-08-15 14:30 UTC', status: 'Success', deployedBy: 'Admin User', branch: 'main' },
    { id: 'dep_2', version: '2.5.0', date: '2024-08-14 10:00 UTC', status: 'Success', deployedBy: 'Admin User', branch: 'main' },
    { id: 'dep_3', version: '2.4.9', date: '2024-08-13 18:00 UTC', status: 'Failed', deployedBy: 'Jane Doe', branch: 'hotfix/payout-bug' },
    { id: 'dep_4', version: '2.4.8', date: '2024-08-13 12:00 UTC', status: 'Success', deployedBy: 'Admin User', branch: 'main' },
];

const environments = [
    { name: 'Production', status: 'Live', version: '2.5.1', lastDeploy: '2024-08-15' },
    { name: 'Staging', status: 'Live', version: '2.6.0-rc1', lastDeploy: '2024-08-15' },
    { name: 'Development', status: 'Live', version: '2.6.0-dev', lastDeploy: '2024-08-15' },
];

const statusVariant: { [key: string]: 'default' | 'destructive' } = {
  Success: 'default',
  Failed: 'destructive',
};

const getStatusIcon = (status: string) => {
    if (status === 'Success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'Failed') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
}

export default function ReleaseManagementPage() {
    const { toast } = useToast();

    const handleRollback = (version: string) => {
        toast({
            title: "Rollback Initiated",
            description: `Attempting to roll back to version ${version}.`,
        });
    }
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Release Management</h2>
                    <p className="text-muted-foreground">Manage feature flags, deployments, and environments.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button>Deploy to Production</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/>Feature Flags</CardTitle>
                            <CardDescription>Toggle features on or off in real-time.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {featureFlags.map(flag => (
                                <div key={flag.id} className="flex items-center justify-between">
                                    <Label htmlFor={`flag-${flag.id}`}>{flag.name}</Label>
                                    <Switch id={`flag-${flag.id}`} defaultChecked={flag.enabled} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5"/>Environments</CardTitle>
                            <CardDescription>Status of your deployment environments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {environments.map(env => (
                                <div key={env.name} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{env.name}</p>
                                        <p className="text-xs text-muted-foreground">Version: {env.version}</p>
                                    </div>
                                    <Badge variant="default" className="bg-green-500/20 text-green-700">{env.status}</Badge>
                                </div>
                           ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><GitCommitVertical className="h-5 w-5"/>Deployment History</CardTitle>
                            <CardDescription>Log of all recent deployments to production.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deploymentHistory.map(dep => (
                                        <TableRow key={dep.id}>
                                            <TableCell>
                                                <div className="font-medium">{dep.version}</div>
                                                <div className="text-xs text-muted-foreground">{dep.deployedBy} on {dep.branch}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(dep.status)}
                                                    <span>{dep.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{dep.date}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem>View Logs</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-orange-500" onClick={() => handleRollback(dep.version)}><RefreshCw className="mr-2 h-4 w-4" />Rollback to this version</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

