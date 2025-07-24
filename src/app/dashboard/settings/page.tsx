
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Mail,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Percent,
  Users,
  Building,
  Briefcase,
  Sun,
  Moon,
  Type,
  Contrast,
  Globe,
  FileText,
  LifeBuoy,
  MessageCircleQuestion,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function SettingsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how we contact you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between p-4 rounded-lg border">
                  <div className='space-y-1'>
                    <Label htmlFor="email-notifications" className="flex items-center"><Mail className="mr-2 h-4 w-4" /> Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive updates about transactions and account security via email.</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-start justify-between p-4 rounded-lg border">
                  <div className='space-y-1'>
                    <Label htmlFor="sms-notifications" className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> SMS Notifications</Label>
                    <p className="text-xs text-muted-foreground">Get critical alerts via text message.</p>
                  </div>
                  <Switch id="sms-notifications" />
                </div>
                <div className="flex items-start justify-between p-4 rounded-lg border">
                  <div className='space-y-1'>
                    <Label htmlFor="in-app-notifications" className="flex items-center"><Bell className="mr-2 h-4 w-4" /> In-App Notifications</Label>
                    <p className="text-xs text-muted-foreground">Get real-time alerts within the dashboard.</p>
                  </div>
                  <Switch id="in-app-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Transaction Alerts</Label>
                        <div className="flex items-center space-x-2">
                            <Switch id="toggle-trans-alerts" defaultChecked/>
                            <Label htmlFor="toggle-trans-alerts" className="text-xs text-muted-foreground">Enable/Disable</Label>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label className="text-sm font-semibold">Promotions</Label>
                        <div className="flex items-center space-x-2">
                            <Switch id="toggle-promo" />
                            <Label htmlFor="toggle-promo" className="text-xs text-muted-foreground">Enable/Disable</Label>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label className="text-sm font-semibold">Security Warnings</Label>
                        <div className="flex items-center space-x-2">
                            <Switch id="toggle-security" defaultChecked/>
                            <Label htmlFor="toggle-security" className="text-xs text-muted-foreground">Enable/Disable</Label>
                        </div>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Notification Preferences</Button>
              </CardFooter>
            </Card>

            {/* Transaction Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Settings</CardTitle>
                <CardDescription>Customize your payment experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                 <Button variant="outline" className="w-full justify-between"><span>View and Manage Saved Recipients</span><ArrowRight className="h-4 w-4" /></Button>
                 <Button variant="outline" className="w-full justify-between"><span>Frequent Transactions (Templates)</span><ArrowRight className="h-4 w-4" /></Button>
                 <Button variant="outline" className="w-full justify-between"><span>Currency Pair Preferences</span><ArrowRight className="h-4 w-4" /></Button>
                 <Button variant="outline" className="w-full justify-between"><span>Exchange Rate Alerts</span><ArrowRight className="h-4 w-4" /></Button>
              </CardContent>
            </Card>

            {/* Business Settings Placeholder */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5"/> Business & Corporate Settings</CardTitle>
                <CardDescription>Manage your team, roles, and company details. (Pro feature)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                 <Button variant="outline" className="w-full justify-between" disabled><span>Manage Team Members</span><Users className="h-4 w-4" /></Button>
                 <Button variant="outline" className="w-full justify-between" disabled><span>Company Details & Documents</span><Building className="h-4 w-4" /></Button>
              </CardContent>
               <CardFooter>
                    <Button variant="secondary">Upgrade to Business</Button>
              </CardFooter>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-6">

             {/* Accessibility & UI */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Accessibility</CardTitle>
                <CardDescription>Adjust the look and feel of the app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="flex items-center"><Sun className="mr-2 h-4 w-4"/>Theme</Label>
                    <ThemeSwitcher />
                </div>
                 <div className="flex items-center justify-between">
                    <Label className="flex items-center"><Type className="mr-2 h-4 w-4"/>Font Size</Label>
                    <Button variant="outline" size="sm">Default</Button>
                </div>
                 <div className="flex items-center justify-between">
                    <Label className="flex items-center"><Contrast className="mr-2 h-4 w-4"/>High Contrast</Label>
                    <Switch id="high-contrast-mode" />
                </div>
                 <div className="flex items-center justify-between">
                    <Label className="flex items-center"><Globe className="mr-2 h-4 w-4"/>Time Zone</Label>
                    <Button variant="outline" size="sm">System Default</Button>
                </div>
              </CardContent>
            </Card>

             {/* Support & Legal */}
            <Card>
              <CardHeader>
                <CardTitle>Support & Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="#"><FileText className="mr-2 h-4 w-4" /> Terms & Conditions</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="#"><ShieldCheck className="mr-2 h-4 w-4" /> Privacy Policy</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="#"><MessageCircleQuestion className="mr-2 h-4 w-4" /> FAQs</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="#"><LifeBuoy className="mr-2 h-4 w-4" /> Contact Support</Link></Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
             <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full justify-start text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Link href="#"><Trash2 className="mr-2 h-4 w-4" /> Request Account Deletion</Link></Button>
                </CardContent>
             </Card>

          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
