
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { TwoFactorSettings } from '@/components/two-factor-settings';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function SettingsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);

  useEffect(() => {
    if (!user || authLoading) {
      setLoadingBusiness(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const profile = userData.businessProfile;
        if (profile && (profile.status === 'approved' || profile.status === 'Approved')) {
          setBusinessProfile(profile);
        } else {
          setBusinessProfile(null);
        }
      } else {
        setBusinessProfile(null);
      }
      setLoadingBusiness(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const getBusinessInitials = (name?: string) => {
    if (!name) return 'B';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const businessTypeMap: { [key: string]: string } = {
    'sole-prop': 'Sole Proprietorship',
    'llc': 'LLC',
    'corporation': 'Corporation',
    'non-profit': 'Non-Profit',
  };

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

            {/* Business & Corporate Settings */}
            <Card className={businessProfile ? "" : "border-dashed"}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5"/> 
                  Business & Corporate Settings
                </CardTitle>
                <CardDescription>
                  {businessProfile 
                    ? "Manage your team, roles, and company details."
                    : "Manage your team, roles, and company details. (Pro feature)"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBusiness ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : businessProfile ? (
                  <div className="space-y-4">
                    {/* Business Summary */}
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarImage src={businessProfile.logoUrl} alt={businessProfile.legalName || businessProfile.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {getBusinessInitials(businessProfile.legalName || businessProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">{businessProfile.legalName || businessProfile.name}</h3>
                            {businessProfile.industry && (
                              <p className="text-sm text-muted-foreground">{businessProfile.industry}</p>
                            )}
                          </div>
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {businessProfile.businessType && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building className="h-3.5 w-3.5" />
                              <span>{businessTypeMap[businessProfile.businessType] || businessProfile.businessType}</span>
                            </div>
                          )}
                          {businessProfile.website && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="h-3.5 w-3.5" />
                              <a 
                                href={businessProfile.website.startsWith('http') ? businessProfile.website : `https://${businessProfile.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {businessProfile.website}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="w-full justify-between">
                        <Link href="/business/settings">
                          <span>Manage Team Members</span>
                          <Users className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-between">
                        <Link href="/business/settings">
                          <span>Company Details & Documents</span>
                          <Building className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <div className="rounded-full bg-primary/10 p-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Explore Business Features</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Unlock powerful tools for managing your business finances, team members, and corporate transactions.
                        </p>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 text-left w-full max-w-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Team member management
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Advanced financial controls
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Corporate invoicing
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Enhanced security features
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {businessProfile ? (
                  <Button asChild className="w-full">
                    <Link href="/business">
                      Switch to Business Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/dashboard/get-started">
                      Explore Business Features
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-6">

            {/* Two-Factor Authentication */}
            <TwoFactorSettings />

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
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="/terms"><FileText className="mr-2 h-4 w-4" /> Terms & Conditions</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="/privacy"><ShieldCheck className="mr-2 h-4 w-4" /> Privacy Policy</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="/dashboard/contact"><MessageCircleQuestion className="mr-2 h-4 w-4" /> FAQs</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="/dashboard/support"><LifeBuoy className="mr-2 h-4 w-4" /> Contact Support</Link></Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
             <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="destructive-outline" className="w-full justify-start text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Link href="#"><Trash2 className="mr-2 h-4 w-4" /> Request Account Deletion</Link></Button>
                </CardContent>
             </Card>

          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
