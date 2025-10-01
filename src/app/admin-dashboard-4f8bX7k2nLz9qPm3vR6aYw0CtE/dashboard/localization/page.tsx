
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2, Globe, Languages, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const initialLanguages = [
    { id: 'lang_1', name: 'English (US)', code: 'en-US', status: 'Active', rtl: false },
    { id: 'lang_2', name: 'Spanish (Spain)', code: 'es-ES', status: 'Active', rtl: false },
    { id: 'lang_3', name: 'French (France)', code: 'fr-FR', status: 'Active', rtl: false },
    { id: 'lang_4', name: 'Arabic (Egypt)', code: 'ar-EG', status: 'Inactive', rtl: true },
];

const initialRegions = [
    { id: 'reg_1', name: 'Africa', defaultCurrency: 'NGN', defaultTimezone: 'WAT' },
    { id: 'reg_2', name: 'Europe', defaultCurrency: 'EUR', defaultTimezone: 'CET' },
];

export default function LocalizationPage() {
    const { toast } = useToast();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Localization Settings</h2>
                    <p className="text-muted-foreground">Manage regional languages, currencies, and time zones.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5"/>Supported Languages</CardTitle>
                            <CardDescription>Enable or disable languages available to your users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Language</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>RTL</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialLanguages.map(lang => (
                                        <TableRow key={lang.id}>
                                            <TableCell>
                                                <div className="font-medium">{lang.name}</div>
                                                <div className="text-xs text-muted-foreground">{lang.code}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Switch defaultChecked={lang.status === 'Active'} />
                                            </TableCell>
                                             <TableCell>
                                                <Switch defaultChecked={lang.rtl} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/>Regional Overrides</CardTitle>
                            <CardDescription>Set specific default currencies and time zones for different regions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Region</TableHead>
                                        <TableHead>Default Currency</TableHead>
                                        <TableHead>Default Time Zone</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialRegions.map(region => (
                                        <TableRow key={region.id}>
                                            <TableCell className="font-medium">{region.name}</TableCell>
                                            <TableCell>{region.defaultCurrency}</TableCell>
                                            <TableCell>{region.defaultTimezone}</TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5"/>Platform Defaults</CardTitle>
                            <CardDescription>Set the global default settings for new users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Default Language</Label>
                                <Select defaultValue="en-US">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en-US">English (US)</SelectItem>
                                        <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Currency</Label>
                                <Select defaultValue="USD">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Time Zone</Label>
                                 <Select defaultValue="UTC">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                        <SelectItem value="PST">PST (Pacific)</SelectItem>
                                        <SelectItem value="EST">EST (Eastern)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter><Button className="w-full">Save Defaults</Button></CardFooter>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Add New Language</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lang-name">Language Name</Label>
                                <Input id="lang-name" placeholder="e.g., German" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lang-code">Language Code</Label>
                                <Input id="lang-code" placeholder="e.g., de-DE" />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="rtl-switch" />
                                <Label htmlFor="rtl-switch">Enable Right-to-Left (RTL)</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Add Language</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
