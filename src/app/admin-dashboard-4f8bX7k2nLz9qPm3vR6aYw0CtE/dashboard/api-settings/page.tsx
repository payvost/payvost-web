
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Eye, EyeOff, RefreshCcw, PlusCircle, MoreHorizontal, Globe, CheckCircle, AlertTriangle, BarChart, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminTransactionOverviewChart } from '@/components/admin-transaction-overview-chart';

const webhooks = [
    { id: 'wh_1', url: 'https://api.merchant-a.com/webhook', status: 'enabled', events: 5 },
    { id: 'wh_2', url: 'https://staging.merchant-b.com/webhook', status: 'disabled', events: 2 },
    { id: 'wh_3', url: 'https://api.merchant-c.com/qwibik/events', status: 'failed', events: 8 },
];

export default function ApiSettingsPage() {
    const [liveSecretKeyVisible, setLiveSecretKeyVisible] = useState(false);
    const [testSecretKeyVisible, setTestSecretKeyVisible] = useState(false);
    const { toast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to Clipboard', description: `${label} has been copied.` });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">API Settings</h2>
                    <p className="text-muted-foreground">Manage API keys, webhooks, and monitor API usage.</p>
                </div>
            </div>

            <Tabs defaultValue="api-keys">
                <TabsList>
                    <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                    <TabsTrigger value="api-usage">API Usage</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="api-keys" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Live API Keys</CardTitle>
                                <CardDescription>Use these keys for production-level transactions.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Publishable Key</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value="pk_live_************************abcd" className="font-mono"/>
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard('pk_live_************************abcd', 'Live Publishable Key')}><Copy className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div>
                                    <Label>Secret Key</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={liveSecretKeyVisible ? 'sk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345' : 'sk_live_************************wxyz'} className="font-mono"/>
                                        <Button variant="outline" size="icon" onClick={() => setLiveSecretKeyVisible(prev => !prev)}>{liveSecretKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4"/>}</Button>
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard('sk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345', 'Live Secret Key')}><Copy className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button variant="destructive"><RefreshCcw className="mr-2 h-4 w-4"/>Roll Live Key</Button>
                            </CardFooter>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Test API Keys</CardTitle>
                                <CardDescription>Use these keys for testing and development.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div>
                                    <Label>Publishable Key</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value="pk_test_************************1234" className="font-mono"/>
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard('pk_test_************************1234', 'Test Publishable Key')}><Copy className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <div>
                                    <Label>Secret Key</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={testSecretKeyVisible ? 'sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345' : 'sk_test_************************wxyz'} className="font-mono"/>
                                        <Button variant="outline" size="icon" onClick={() => setTestSecretKeyVisible(prev => !prev)}>{testSecretKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4"/>}</Button>
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard('sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345', 'Test Secret Key')}><Copy className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button variant="destructive-outline"><RefreshCcw className="mr-2 h-4 w-4"/>Roll Test Key</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="api-usage" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">API Uptime (24h)</CardTitle>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">99.99%</div>
                                <p className="text-xs text-muted-foreground">Last incident: 3 days ago</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Success Rate (24h)</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">98.2%</div>
                                <p className="text-xs text-muted-foreground">4,231 successful requests</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Error Rate (24h)</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1.8%</div>
                                <p className="text-xs text-muted-foreground">78 failed requests</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Latency</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">120ms</div>
                                <p className="text-xs text-muted-foreground">P95 latency is 250ms</p>
                            </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>API Call Volume (Last 6 Months)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <AdminTransactionOverviewChart />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="webhooks" className="mt-6">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <div>
                                <CardTitle>Webhook Endpoints</CardTitle>
                                <CardDescription>Manage endpoints that receive events from your account.</CardDescription>
                            </div>
                            <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Endpoint</Button>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Endpoint URL</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Subscribed Events</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {webhooks.map(wh => (
                                        <TableRow key={wh.id}>
                                            <TableCell className="font-mono">{wh.url}</TableCell>
                                            <TableCell><Badge variant={wh.status === 'enabled' ? 'default' : wh.status === 'disabled' ? 'secondary' : 'destructive'} className="capitalize">{wh.status}</Badge></TableCell>
                                            <TableCell>{wh.events} events</TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}

