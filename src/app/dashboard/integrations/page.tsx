
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Puzzle,
  KeyRound,
  Webhook,
  FileText,
  Book,
  Search,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  PlusCircle,
  FileCode2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';


const integrations = [
  { name: 'Shopify', slug: 'shopify', category: 'E-commerce', logo: 'https://placehold.co/40x40.png', hint: 'shopify logo', description: 'Sync payments from your Shopify store.' },
  { name: 'WooCommerce', slug: 'woocommerce', category: 'E-commerce', logo: 'https://placehold.co/40x40.png', hint: 'woocommerce logo', description: 'Integrate with your WordPress e-commerce site.' },
  { name: 'QuickBooks', slug: 'quickbooks', category: 'Accounting', logo: 'https://placehold.co/40x40.png', hint: 'quickbooks logo', description: 'Automate your bookkeeping and accounting.' },
  { name: 'Xero', slug: 'xero', category: 'Accounting', logo: 'https://placehold.co/40x40.png', hint: 'xero logo', description: 'Connect your Xero account for easy reconciliation.' },
  { name: 'Slack', slug: 'slack', category: 'Productivity', logo: 'https://placehold.co/40x40.png', hint: 'slack logo', description: 'Get notifications for payments and disputes in Slack.' },
  { name: 'Google Analytics', slug: 'google-analytics', category: 'Analytics', logo: 'https://placehold.co/40x40.png', hint: 'analytics logo', description: 'Track payment events and conversions.' },
];

const webhooks = [
    { id: 'wh_1', url: 'https://api.example.com/webhook', status: 'enabled', events: 5 },
    { id: 'wh_2', url: 'https://staging.example.com/webhook', status: 'disabled', events: 2 },
    { id: 'wh_3', url: 'https://dev.myapp.com/qwibik/events', status: 'failed', events: 8 },
];

const apiLogs = [
    { id: 'req_1', method: 'POST', endpoint: '/v1/charges', status: 200, date: '2024-08-15 14:30:15 UTC' },
    { id: 'req_2', method: 'GET', endpoint: '/v1/balance', status: 200, date: '2024-08-15 14:29:55 UTC' },
    { id: 'req_3', method: 'POST', endpoint: '/v1/customers', status: 400, date: '2024-08-15 14:28:10 UTC' },
    { id: 'req_4', method: 'GET', endpoint: '/v1/charges/ch_123', status: 200, date: '2024-08-15 14:27:05 UTC' },
];


export default function IntegrationsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [secretKeyVisible, setSecretKeyVisible] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to Clipboard', description: `${label} has been copied.` });
  };
  

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Integrations & Developer</h1>
        </div>
        
        <Tabs defaultValue="marketplace">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="marketplace"><Puzzle className="mr-2 h-4 w-4" /> Marketplace</TabsTrigger>
            <TabsTrigger value="api-keys"><KeyRound className="mr-2 h-4 w-4" /> API Keys</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="mr-2 h-4 w-4" /> Webhooks</TabsTrigger>
            <TabsTrigger value="logs"><FileText className="mr-2 h-4 w-4" /> Logs</TabsTrigger>
            <TabsTrigger value="docs"><Book className="mr-2 h-4 w-4" /> SDKs & Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>App Marketplace</CardTitle>
                    <CardDescription>Connect Payvost Remit with your favorite tools and services.</CardDescription>
                     <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-6.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search integrations..." className="pl-8 w-full md:w-1/3" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {integrations.map(app => (
                            <Card key={app.name} className="flex flex-col">
                                <CardHeader className="flex-row gap-4 items-center">
                                    <img src={app.logo} data-ai-hint={app.hint} alt={app.name} className="h-10 w-10 rounded-md" />
                                    <div>
                                        <CardTitle className="text-lg">{app.name}</CardTitle>
                                        <Badge variant="outline" className="mt-1">{app.category}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{app.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild>
                                        <Link href={`/dashboard/integrations/${app.slug}`}>Connect</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage API keys for authenticating your requests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold">Publishable Key</h3>
                        <p className="text-sm text-muted-foreground mb-2">This key is intended to be used in your client-side code.</p>
                        <div className="flex gap-2">
                            <Input readOnly value="pk_test_************************1234" className="font-mono"/>
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard('pk_test_************************1234', 'Publishable Key')}><Copy className="h-4 w-4"/></Button>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold">Secret Key</h3>
                        <p className="text-sm text-muted-foreground mb-2">This key should be kept confidential and only used on your server.</p>
                         <div className="flex gap-2">
                            <Input readOnly value={secretKeyVisible ? 'sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345' : 'sk_test_************************wxyz'} className="font-mono"/>
                            <Button variant="outline" size="icon" onClick={() => setSecretKeyVisible(prev => !prev)}>{secretKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4"/>}</Button>
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard('sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345', 'Secret Key')}><Copy className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button variant="destructive">Roll Secret Key</Button>
                </CardFooter>
             </Card>
          </TabsContent>
          
          <TabsContent value="webhooks" className="mt-6">
             <Card>
                <CardHeader className="flex justify-between items-center">
                    <div>
                        <CardTitle>Webhooks</CardTitle>
                        <CardDescription>Receive real-time notifications of events in your account.</CardDescription>
                    </div>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Endpoint</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Endpoint URL</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Events</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {webhooks.map(wh => (
                                <TableRow key={wh.id}>
                                    <TableCell className="font-mono">{wh.url}</TableCell>
                                    <TableCell><Badge variant={wh.status === 'enabled' ? 'default' : wh.status === 'disabled' ? 'secondary' : 'destructive'} className="capitalize">{wh.status}</Badge></TableCell>
                                    <TableCell>{wh.events} events</TableCell>
                                    <TableCell>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Enable/Disable</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
             <Card>
                 <CardHeader>
                    <CardTitle>API Logs</CardTitle>
                    <CardDescription>A list of the most recent API requests made to your account.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Endpoint</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {apiLogs.map(log => (
                                <TableRow key={log.id} className="font-mono text-xs">
                                    <TableCell>{log.date}</TableCell>
                                    <TableCell><Badge variant="outline" className={log.method === 'POST' ? 'border-green-500' : 'border-blue-500'}>{log.method}</Badge></TableCell>
                                    <TableCell>{log.endpoint}</TableCell>
                                    <TableCell className="text-right"><Badge variant={log.status === 200 ? 'default' : 'destructive'}>{log.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                         </TableBody>
                    </Table>
                 </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>SDKs & Documentation</CardTitle>
                    <CardDescription>Get started with our developer tools.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Book className="h-5 w-5"/>API Reference</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Explore our complete API reference documentation.</p></CardContent>
                        <CardFooter><Button variant="outline">View Docs</Button></CardFooter>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileCode2 className="h-5 w-5"/>SDKs</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Integrate with our official libraries for your backend.</p></CardContent>
                        <CardFooter className="flex gap-2">
                           <Button variant="secondary" size="sm">Node.js</Button>
                           <Button variant="secondary" size="sm">Python</Button>
                           <Button variant="secondary" size="sm">PHP</Button>
                        </CardFooter>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Puzzle className="h-5 w-5"/>UI Components</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Use our pre-built components for a quick integration.</p></CardContent>
                         <CardFooter><Button variant="outline">Learn More</Button></CardFooter>
                    </Card>
                </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </main>
    </DashboardLayout>
  );
}
