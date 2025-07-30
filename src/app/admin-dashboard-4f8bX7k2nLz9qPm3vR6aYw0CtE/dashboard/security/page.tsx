
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { KeyRound, Shield, Clock, Wifi, BellRing, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function SecuritySettingsPage() {
    const { toast } = useToast();

    const handleSaveChanges = (section: string) => {
        toast({
            title: "Settings Saved",
            description: `Your ${section} settings have been updated.`,
        });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Security Settings</h2>
                    <p className="text-muted-foreground">Manage platform-wide security policies and settings.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* MFA Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>Multi-Factor Authentication</CardTitle>
                            <CardDescription>Strengthen security by requiring a second form of verification for all admin users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enforce MFA for all users</Label>
                                    <p className="text-sm text-muted-foreground">All team members will be required to set up MFA on their next login.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm mb-2">Allowed Authentication Methods</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between"><Label>Authenticator App (TOTP)</Label><Switch defaultChecked /></div>
                                    <div className="flex items-center justify-between"><Label>SMS Text Message</Label><Switch defaultChecked /></div>
                                    <div className="flex items-center justify-between"><Label>Security Key (WebAuthn)</Label><Switch /></div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSaveChanges('MFA')}>Save MFA Settings</Button>
                        </CardFooter>
                    </Card>

                    {/* Session Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Session Management</CardTitle>
                            <CardDescription>Control how long users can stay logged in.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="session-expiry">Session Expiry (minutes)</Label>
                                    <Input id="session-expiry" type="number" defaultValue="240" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idle-timeout">Idle Timeout (minutes)</Label>
                                    <Input id="idle-timeout" type="number" defaultValue="30" />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="remember-device" />
                                <Label htmlFor="remember-device">Allow "Remember this device" option to bypass MFA for 30 days.</Label>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button onClick={() => handleSaveChanges('Session')}>Save Session Settings</Button>
                        </CardFooter>
                    </Card>

                    {/* Encryption Policy */}
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/>Data Encryption</CardTitle>
                            <CardDescription>Our policies for protecting data at rest and in transit.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p><strong>Encryption at Rest:</strong> All sensitive customer data stored in our databases is encrypted using industry-standard AES-256 encryption.</p>
                            <p><strong>Encryption in Transit:</strong> All data transmitted between our servers and your browser is protected using TLS 1.2 or higher.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* IP Whitelisting */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5"/>IP Whitelisting</CardTitle>
                            <CardDescription>Restrict access to the admin panel from specific IP addresses.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="ip-list">Whitelisted IP Addresses</Label>
                            <Textarea id="ip-list" placeholder="Enter one IP address per line (e.g., 203.0.113.5) or CIDR block (e.g. 203.0.113.0/24)." rows={5} />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSaveChanges('IP Whitelist')}>Save IP List</Button>
                        </CardFooter>
                    </Card>

                    {/* Security Alerting */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5"/>Security Alerting</CardTitle>
                            <CardDescription>Get notified about important security events.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="alert-email">Notification Email</Label>
                                <Input id="alert-email" type="email" defaultValue="security@payvost.com" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="breach-alerts" defaultChecked />
                                <Label htmlFor="breach-alerts">Notify on potential data breaches</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="failed-logins" defaultChecked />
                                <Label htmlFor="failed-logins">Notify on repeated failed login attempts</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSaveChanges('Alerting')}>Save Alert Settings</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
