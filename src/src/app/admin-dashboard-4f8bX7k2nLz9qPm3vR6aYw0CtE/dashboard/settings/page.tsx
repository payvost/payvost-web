'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { KeyRound, Shield, Clock, Wifi, BellRing, Lock, Save, Cog, Zap, FileText, History, GitCompareArrows } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


const termsVersions = [
    { version: 'v2.1', status: 'Published', date: '2024-08-01', editor: 'Admin User' },
    { version: 'v2.0', status: 'Archived', date: '2024-01-15', editor: 'Admin User' },
];

const privacyVersions = [
    { version: 'v1.2', status: 'Published', date: '2024-05-25', editor: 'Admin User' },
    { version: 'v1.1', status: 'Archived', date: '2023-12-10', editor: 'Admin User' },
];

export default function AdminSettingsPage() {
    const { toast } = useToast();

    const handleSaveChanges = (section: string) => {
        toast({
            title: "Settings Saved",
            description: `Your ${section} settings have been updated.`,
        });
    };

     const handlePublish = (docName: string) => {
        toast({
            title: "Document Published",
            description: `A new version of the ${docName} has been published.`
        })
    }

    const renderLegalDocManager = (docName: string, versions: typeof termsVersions, content: string) => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit {docName}</CardTitle>
                        <CardDescription>Current version: {versions[0].version}. Make changes below to create a new version.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea defaultValue={content} rows={25} />
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline">Save as Draft</Button>
                        <Button onClick={() => handlePublish(docName)}><Save className="mr-2 h-4 w-4"/>Publish New Version</Button>
                    </CardFooter>
                </Card>
            </div>
             <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Version History</CardTitle>
                        <CardDescription>Review and manage past versions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {versions.map(v => (
                                    <TableRow key={v.version}>
                                        <TableCell>
                                            <div className="font-medium">{v.version}</div>
                                            <div className="text-xs text-muted-foreground">{v.date}</div>
                                        </TableCell>
                                        <TableCell><Badge variant={v.status === 'Published' ? 'default' : 'secondary'}>{v.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Content</DropdownMenuItem>
                                                    <DropdownMenuItem>Compare to Current</DropdownMenuItem>
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
    )

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
                    <p className="text-muted-foreground">Manage global platform configurations and policies.</p>
                </div>
            </div>

            <Tabs defaultValue="security">
                <TabsList className="mb-4">
                    <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
                    <TabsTrigger value="config"><Cog className="mr-2 h-4 w-4" />Platform Config</TabsTrigger>
                    <TabsTrigger value="legal"><FileText className="mr-2 h-4 w-4" />Legal Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="security">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>Multi-Factor Authentication</CardTitle>
                                    <CardDescription>Strengthen security by requiring a second form of verification for all admin users.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Enforce MFA for all users</Label>
                                            <p className="text-sm text-muted-foreground">All team members will be required to set up MFA on their next login.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => handleSaveChanges('MFA')}>Save MFA Settings</Button>
                                </CardFooter>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Session Management</CardTitle>
                                    <CardDescription>Control how long users can stay logged in.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="session-expiry">Session Expiry (minutes)</Label>
                                        <Input id="session-expiry" type="number" defaultValue="240" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="idle-timeout">Idle Timeout (minutes)</Label>
                                        <Input id="idle-timeout" type="number" defaultValue="30" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => handleSaveChanges('Session')}>Save Session Settings</Button>
                                </CardFooter>
                            </Card>
                        </div>
                         <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5"/>IP Whitelisting</CardTitle>
                                    <CardDescription>Restrict access to the admin panel from specific IP addresses.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Label htmlFor="ip-list">Whitelisted IP Addresses</Label>
                                    <Textarea id="ip-list" placeholder="Enter one IP address per line..." rows={5} />
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => handleSaveChanges('IP Whitelist')}>Save IP List</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="config">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/>Feature Flags</CardTitle>
                            <CardDescription>Enable or disable major features across the platform in real-time.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4"><Label>New Dashboard UI</Label><Switch /></div>
                             <div className="flex items-center justify-between rounded-lg border p-4"><Label>Crypto Payouts (Beta)</Label><Switch /></div>
                             <div className="flex items-center justify-between rounded-lg border p-4"><Label>In-app Chat Support</Label><Switch defaultChecked /></div>
                        </CardContent>
                        <CardFooter><Button onClick={() => handleSaveChanges('Feature Flag')}>Save Feature Flags</Button></CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="legal">
                     {renderLegalDocManager(
                        'Terms of Service', 
                        termsVersions, 
                        'This is the current content of the Terms of Service. By using our service, you agree to these terms...'
                    )}
                </TabsContent>
            </Tabs>
        </>
    );
}