
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Mail,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Users,
  Building,
  Briefcase,
  Sun,
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
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { TwoFactorSettings } from '@/components/two-factor-settings';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getUserNotificationPreferences, updateNotificationPreferences } from '@/lib/unified-notifications';
import { walletService, type Account } from '@/services';
import { SUPPORTED_COUNTRIES } from '@/config/kyc-config';
import { 
  Wallet, 
  AlertCircle, 
  TrendingUp,
  Smartphone,
} from 'lucide-react';

export default function SettingsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  type BusinessProfile = {
    status?: string;
    logoUrl?: string;
    legalName?: string;
    name?: string;
    industry?: string;
    businessType?: string;
    website?: string;
  };
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [wallets, setWallets] = useState<Account[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [homeCurrency, setHomeCurrency] = useState<string | null>(null);
  const [defaultWalletCurrency, setDefaultWalletCurrency] = useState<string | null>(null);
  const [savingDefaultWallet, setSavingDefaultWallet] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    push: true,
    email: true,
    sms: false,
    transactionAlerts: true,
    marketingEmails: false,
    securityAlerts: true,
    lowBalanceAlerts: true,
    largeTransactionAlerts: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoadingWallets(false);
      return;
    }

    const loadWallets = async () => {
      try {
        setLoadingWallets(true);
        const accounts = await walletService.getAccounts();
        const normalized = accounts.map((a) => ({
          ...a,
          balance: typeof a.balance === 'string' ? parseFloat(a.balance) : a.balance,
        }));
        setWallets(normalized);
      } catch (error) {
        console.error('Failed to load wallets:', error);
        setWallets([]);
      } finally {
        setLoadingWallets(false);
      }
    };

    loadWallets();
  }, [user]);

  useEffect(() => {
    if (!user || authLoading) {
      setLoadingBusiness(false);
      return;
    }

    // Check email verification status
    setEmailVerified(user.emailVerified || false);

    // Load notification preferences
    const loadPreferences = async () => {
      try {
        const prefs = await getUserNotificationPreferences(user.uid);
        if (prefs) {
          setNotificationPreferences({
            push: prefs.push ?? true,
            email: prefs.email ?? true,
            sms: prefs.sms ?? false,
            transactionAlerts: prefs.transactionAlerts ?? true,
            marketingEmails: prefs.marketingEmails ?? false,
            securityAlerts: prefs.securityAlerts ?? true,
            lowBalanceAlerts: prefs.lowBalanceAlerts ?? true,
            largeTransactionAlerts: prefs.largeTransactionAlerts ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    loadPreferences();

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const inferredHomeCurrency =
          typeof userData.homeCurrency === 'string' && userData.homeCurrency
            ? userData.homeCurrency
            : (typeof userData.country === 'string'
                ? (SUPPORTED_COUNTRIES.find((c) => c.iso2 === userData.country)?.currency ?? null)
                : null);
        setHomeCurrency(inferredHomeCurrency);
        setDefaultWalletCurrency(
          typeof userData.defaultWalletCurrency === 'string' && userData.defaultWalletCurrency
            ? userData.defaultWalletCurrency
            : inferredHomeCurrency
        );
        const profile = userData.businessProfile;
        if (profile && (profile.status === 'approved' || profile.status === 'Approved')) {
          setBusinessProfile(profile);
        } else {
          setBusinessProfile(null);
        }
        
        // Update preferences from user document if available
        if (userData.preferences) {
          setNotificationPreferences(prev => ({
            ...prev,
            push: userData.preferences.push !== false,
            email: userData.preferences.email !== false,
            sms: userData.preferences.sms === true,
            transactionAlerts: userData.preferences.transactionAlerts !== false,
            marketingEmails: userData.preferences.marketingEmails === true,
            securityAlerts: userData.preferences.securityAlerts !== false,
            lowBalanceAlerts: userData.preferences.lowBalanceAlerts !== false,
            largeTransactionAlerts: userData.preferences.largeTransactionAlerts !== false,
          }));
        }
      } else {
        setBusinessProfile(null);
      }
      setLoadingBusiness(false);
    });

    // Poll for email verification status
    const emailCheckInterval = setInterval(async () => {
      if (user) {
        await user.reload();
        setEmailVerified(user.emailVerified || false);
      }
    }, 5000);

    return () => {
      unsub();
      clearInterval(emailCheckInterval);
    };
  }, [user, authLoading]);

  const handleDefaultWalletChange = async (currency: string) => {
    if (!user) return;

    // Only allow choosing a wallet the user already has.
    const exists = wallets.some((w) => w.currency === currency);
    if (!exists) {
      toast({
        title: 'Wallet not found',
        description: 'Create the wallet first, then set it as default.',
        variant: 'destructive',
      });
      return;
    }

    setSavingDefaultWallet(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        defaultWalletCurrency: currency,
      });
      setDefaultWalletCurrency(currency);
      toast({
        title: 'Default wallet updated',
        description: `${currency} is now your default wallet.`,
      });
    } catch (error) {
      console.error('Failed to update default wallet currency:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update your default wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingDefaultWallet(false);
    }
  };

  const handleResendEmailVerification = async () => {
    if (!user || !user.email) return;
    
    setSendingVerification(true);
    try {
      // Use Firebase's built-in sendEmailVerification method
      const { sendEmailVerification } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      // Reload user to get latest auth state
      await user.reload();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      await sendEmailVerification(currentUser);
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your email and click the verification link.',
      });
    } catch (error: unknown) {
      console.error('Failed to send verification email:', error);
      const message = error instanceof Error ? error.message : 'Failed to send verification email. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    if (!user) return;

    setSavingPreferences(true);
    try {
      const success = await updateNotificationPreferences(user.uid, notificationPreferences);
      
      if (success) {
        toast({
          title: 'Preferences Saved',
          description: 'Your notification preferences have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error: unknown) {
      console.error('Error saving notification preferences:', error);
      const message = error instanceof Error ? error.message : 'Failed to save notification preferences. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  };

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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">

            {/* Wallet Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Preferences</CardTitle>
                <CardDescription>Choose which wallet the dashboard uses by default.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Home Currency</Label>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Your home currency wallet</p>
                      <p className="text-xs text-muted-foreground">
                        {homeCurrency ? `${homeCurrency} is your sign-up currency.` : 'We will use your sign-up country currency as home.'}
                      </p>
                    </div>
                    <Badge variant="secondary">{homeCurrency || 'Auto'}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-wallet">Default Wallet</Label>
                  <Select
                    value={defaultWalletCurrency || ''}
                    onValueChange={handleDefaultWalletChange}
                    disabled={loadingWallets || savingDefaultWallet || wallets.length === 0}
                  >
                    <SelectTrigger id="default-wallet">
                      <SelectValue placeholder={loadingWallets ? 'Loading wallets...' : 'Select a wallet currency'} />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets
                        .slice()
                        .sort((a, b) => a.currency.localeCompare(b.currency))
                        .map((w) => (
                          <SelectItem key={w.currency} value={w.currency}>
                            {w.currency}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This controls which wallet shows as “Primary wallet” on the dashboard. You can change it anytime.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how we contact you and what notifications you receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Channels */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground">Delivery Channels</Label>
                  <div className="flex items-start justify-between p-4 rounded-lg border">
                    <div className='space-y-1'>
                      <Label htmlFor="email-notifications" className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" /> Email Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Receive updates about transactions and account security via email.</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notificationPreferences.email}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-start justify-between p-4 rounded-lg border">
                    <div className='space-y-1'>
                      <Label htmlFor="push-notifications" className="flex items-center">
                        <Smartphone className="mr-2 h-4 w-4" /> Push Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Get real-time alerts on your device via push notifications.</p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={notificationPreferences.push}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-start justify-between p-4 rounded-lg border">
                    <div className='space-y-1'>
                      <Label htmlFor="sms-notifications" className="flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" /> SMS Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Get critical alerts via text message.</p>
                    </div>
                    <Switch 
                      id="sms-notifications" 
                      checked={notificationPreferences.sms}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({ ...prev, sms: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-start justify-between p-4 rounded-lg border">
                    <div className='space-y-1'>
                      <Label htmlFor="in-app-notifications" className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" /> In-App Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Get real-time alerts within the dashboard. (Always enabled)</p>
                    </div>
                    <Switch id="in-app-notifications" checked={true} disabled />
                  </div>
                </div>

                <Separator />

                {/* Notification Types */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground">Notification Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start justify-between p-4 rounded-lg border">
                      <div className='space-y-1 flex-1'>
                        <Label htmlFor="transaction-alerts" className="flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4" /> Transaction Alerts
                        </Label>
                        <p className="text-xs text-muted-foreground">Alerts for successful, failed, or pending transactions.</p>
                      </div>
                      <Switch 
                        id="transaction-alerts" 
                        checked={notificationPreferences.transactionAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationPreferences(prev => ({ ...prev, transactionAlerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between p-4 rounded-lg border">
                      <div className='space-y-1 flex-1'>
                        <Label htmlFor="security-alerts" className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4" /> Security Alerts
                        </Label>
                        <p className="text-xs text-muted-foreground">Password changes, login alerts, and security warnings.</p>
                      </div>
                      <Switch 
                        id="security-alerts" 
                        checked={notificationPreferences.securityAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationPreferences(prev => ({ ...prev, securityAlerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between p-4 rounded-lg border">
                      <div className='space-y-1 flex-1'>
                        <Label htmlFor="low-balance-alerts" className="flex items-center">
                          <Wallet className="mr-2 h-4 w-4" /> Low Balance Alerts
                        </Label>
                        <p className="text-xs text-muted-foreground">Get notified when your wallet balance is low.</p>
                      </div>
                      <Switch 
                        id="low-balance-alerts" 
                        checked={notificationPreferences.lowBalanceAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationPreferences(prev => ({ ...prev, lowBalanceAlerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between p-4 rounded-lg border">
                      <div className='space-y-1 flex-1'>
                        <Label htmlFor="large-transaction-alerts" className="flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4" /> Large Transaction Alerts
                        </Label>
                        <p className="text-xs text-muted-foreground">Alerts for transactions above $1,000.</p>
                      </div>
                      <Switch 
                        id="large-transaction-alerts" 
                        checked={notificationPreferences.largeTransactionAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationPreferences(prev => ({ ...prev, largeTransactionAlerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between p-4 rounded-lg border">
                      <div className='space-y-1 flex-1'>
                        <Label htmlFor="marketing-emails" className="flex items-center">
                          <Sparkles className="mr-2 h-4 w-4" /> Promotions & Marketing
                        </Label>
                        <p className="text-xs text-muted-foreground">Receive updates about new features and special offers.</p>
                      </div>
                      <Switch 
                        id="marketing-emails" 
                        checked={notificationPreferences.marketingEmails}
                        onCheckedChange={(checked) => 
                          setNotificationPreferences(prev => ({ ...prev, marketingEmails: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveNotificationPreferences}
                  disabled={savingPreferences}
                  className="w-full"
                >
                  {savingPreferences ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Notification Preferences
                    </>
                  )}
                </Button>
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

            {/* Email Verification */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Verification
                    </CardTitle>
                    <CardDescription>
                      Verify your email address for account security
                    </CardDescription>
                  </div>
                  {emailVerified ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailVerified ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Your email address <strong>{user?.email}</strong> has been verified.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Your email address <strong>{user?.email}</strong> has not been verified.
                        Please verify your email to ensure account security.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleResendEmailVerification}
                      disabled={sendingVerification}
                      className="w-full"
                    >
                      {sendingVerification ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

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
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="/terms-and-conditions"><FileText className="mr-2 h-4 w-4" /> Terms & Conditions</Link></Button>
                <Button asChild variant="ghost" className="w-full justify-start"><Link href="/privacy-policy"><ShieldCheck className="mr-2 h-4 w-4" /> Privacy Policy</Link></Button>
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
                    <Button asChild variant="destructive" className="w-full justify-start text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"><Link href="#"><Trash2 className="mr-2 h-4 w-4" /> Request Account Deletion</Link></Button>
                </CardContent>
             </Card>

          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
