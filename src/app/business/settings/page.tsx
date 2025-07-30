
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessProfileSettings } from '@/components/business-profile-settings';
import { Building, ShieldCheck, Users, Banknote, FileText, Cog, ArrowRight, KeyRound, BookOpen, LifeBuoy, Trash2, Database, Bell, AlertTriangle, DollarSign, XCircle, ShieldQuestion, Webhook } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BusinessTeamSettings } from '@/components/business-team-settings';
import { BusinessFinancialSettings } from '@/components/business-financial-settings';
import { BusinessInvoiceSettings } from '@/components/business-invoice-settings';
import { BusinessSecuritySettings } from '@/components/business-security-settings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const integrations = [
  { name: 'QuickBooks', category: 'Accounting', logo: 'https://placehold.co/40x40.png', hint: 'quickbooks logo', description: 'Sync invoices, payments, and reconcile transactions automatically.' },
  { name: 'Xero', category: 'Accounting', logo: 'https://placehold.co/40x40.png', hint: 'xero logo', description: 'Keep your financial records up-to-date with seamless Xero integration.' },
  { name: 'Slack', category: 'Communication', logo: 'https://placehold.co/40x40.png', hint: 'slack logo', description: 'Get real-time notifications for important events in your Slack channels.' },
  { name: 'HubSpot', category: 'CRM', logo: 'https://placehold.co/40x40.png', hint: 'hubspot logo', description: 'Link payments and invoices to customer records in HubSpot.' },
  { name: 'Salesforce', category: 'CRM', logo: 'https://placehold.co/40x40.png', hint: 'salesforce logo', description: 'Enhance your sales workflow with integrated payment data.' },
  { name: 'Zapier', category: 'Automation', logo: 'https://placehold.co/40x40.png', hint: 'zapier logo', description: 'Connect Payvost to thousands of other apps with Zapier.' },
];

export default function BusinessSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Business Settings</h2>
                <p className="text-muted-foreground">Manage your business profile, team, and operational settings.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
                            <TabsTrigger value="profile"><Building className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
                            <TabsTrigger value="team"><Users className="mr-2 h-4 w-4"/>Team</TabsTrigger>
                            <TabsTrigger value="financial"><Banknote className="mr-2 h-4 w-4"/>Financial</TabsTrigger>
                            <TabsTrigger value="invoicing"><FileText className="mr-2 h-4 w-4"/>Invoicing</TabsTrigger>
                            <TabsTrigger value="security"><ShieldCheck className="mr-2 h-4 w-4"/>Security</TabsTrigger>
                            <TabsTrigger value="integrations"><Cog className="mr-2 h-4 w-4"/>Integrations</TabsTrigger>
                        </TabsList>
                        <TabsContent value="profile">
                            <BusinessProfileSettings />
                        </TabsContent>
                        <TabsContent value="team">
                           <BusinessTeamSettings />
                        </TabsContent>
                        <TabsContent value="financial">
                             <BusinessFinancialSettings />
                        </TabsContent>
                         <TabsContent value="invoicing">
                             <BusinessInvoiceSettings />
                        </TabsContent>
                         <TabsContent value="security">
                            <BusinessSecuritySettings />
                        </TabsContent>
                         <TabsContent value="integrations">
                             <Card>
                                <CardHeader>
                                    <CardTitle>App Marketplace</CardTitle>
                                    <CardDescription>Connect your Payvost account to other business tools to automate your workflow.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {integrations.map(app => (
                                        <div key={app.name} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <img src={app.logo} data-ai-hint={app.hint} alt={app.name} className="h-10 w-10 rounded-md" />
                                                <div>
                                                    <h4 className="font-semibold">{app.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{app.description}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline">Connect</Button>
                                        </div>
                                    ))}
                                </CardContent>
                             </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                 <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                             <CardDescription>Manage how you receive alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Low Balance</Label>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><DollarSign className="h-4 w-4"/>Payment Received</Label>
                                <Switch defaultChecked/>
                            </div>
                             <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><XCircle className="h-4 w-4"/>Payout Failed</Label>
                                <Switch defaultChecked/>
                            </div>
                             <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><ShieldQuestion className="h-4 w-4"/>Disputes Initiated</Label>
                                <Switch defaultChecked/>
                            </div>
                             <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><Webhook className="h-4 w-4"/>Webhook Events</Label>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Developer Settings</CardTitle>
                            <CardDescription>Manage your API keys and webhooks for integrations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Button variant="outline" className="w-full justify-between" asChild>
                                <Link href="/dashboard/integrations?tab=api-keys">
                                    <span>API Keys</span>
                                    <KeyRound className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link href="/dashboard/integrations?tab=webhooks">
                                    <span>Webhooks</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Support &amp; Documentation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/dashboard/integrations?tab=docs"><BookOpen className="mr-2 h-4 w-4"/> Developer Docs</Link>
                            </Button>
                             <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/dashboard/support"><LifeBuoy className="mr-2 h-4 w-4"/> Contact Support</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Account Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive-outline" className="w-full justify-start">
                                <Trash2 className="mr-2 h-4 w-4"/> Close Business Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
