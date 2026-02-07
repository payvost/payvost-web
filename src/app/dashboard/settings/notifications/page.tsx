'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Loader2, Mail, MessageSquare, Smartphone, TrendingUp, Wallet, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences, type UserPreferences } from '@/hooks/use-user-preferences';

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const { preferences, updatePreferences, loading } = useUserPreferences();

  const [draft, setDraft] = useState<Pick<
    UserPreferences,
    | 'push'
    | 'email'
    | 'sms'
    | 'transactionAlerts'
    | 'marketingEmails'
    | 'securityAlerts'
    | 'lowBalanceAlerts'
    | 'largeTransactionAlerts'
  >>({
    push: true,
    email: true,
    sms: false,
    transactionAlerts: true,
    marketingEmails: false,
    securityAlerts: true,
    lowBalanceAlerts: true,
    largeTransactionAlerts: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      push: preferences.push,
      email: preferences.email,
      sms: preferences.sms,
      transactionAlerts: preferences.transactionAlerts,
      marketingEmails: preferences.marketingEmails,
      securityAlerts: preferences.securityAlerts,
      lowBalanceAlerts: preferences.lowBalanceAlerts,
      largeTransactionAlerts: preferences.largeTransactionAlerts,
    });
  }, [
    preferences.push,
    preferences.email,
    preferences.sms,
    preferences.transactionAlerts,
    preferences.marketingEmails,
    preferences.securityAlerts,
    preferences.lowBalanceAlerts,
    preferences.largeTransactionAlerts,
  ]);

  const dirty = useMemo(() => {
    return (
      draft.push !== preferences.push ||
      draft.email !== preferences.email ||
      draft.sms !== preferences.sms ||
      draft.transactionAlerts !== preferences.transactionAlerts ||
      draft.marketingEmails !== preferences.marketingEmails ||
      draft.securityAlerts !== preferences.securityAlerts ||
      draft.lowBalanceAlerts !== preferences.lowBalanceAlerts ||
      draft.largeTransactionAlerts !== preferences.largeTransactionAlerts
    );
  }, [draft, preferences]);

  const save = async () => {
    setSaving(true);
    try {
      const ok = await updatePreferences(draft);
      if (!ok) throw new Error('Update failed');
      toast({ title: 'Preferences saved', description: 'Your notification preferences were updated.' });
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      toast({
        title: 'Save failed',
        description: 'Could not update your notification preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">Manage how we contact you and what notifications you receive.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose delivery channels and notification types.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Delivery Channels</Label>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" /> Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Receive updates about transactions and account security via email.</p>
              </div>
              <Switch
                id="email-notifications"
                checked={draft.email}
                disabled={loading || saving}
                onCheckedChange={(checked) => setDraft((p) => ({ ...p, email: checked }))}
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="push-notifications" className="flex items-center">
                  <Smartphone className="mr-2 h-4 w-4" /> Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Get real-time alerts on your device via push notifications.</p>
              </div>
              <Switch
                id="push-notifications"
                checked={draft.push}
                disabled={loading || saving}
                onCheckedChange={(checked) => setDraft((p) => ({ ...p, push: checked }))}
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="sms-notifications" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" /> SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Get critical alerts via text message.</p>
              </div>
              <Switch
                id="sms-notifications"
                checked={draft.sms}
                disabled={loading || saving}
                onCheckedChange={(checked) => setDraft((p) => ({ ...p, sms: checked }))}
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="in-app-notifications" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" /> In-App Notifications
                </Label>
                <p className="text-xs text-muted-foreground">In-app notifications are always enabled.</p>
              </div>
              <Switch id="in-app-notifications" checked={true} disabled />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Notification Types</Label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="transaction-alerts" className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" /> Transaction Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">Successful, failed, or pending transactions.</p>
                </div>
                <Switch
                  id="transaction-alerts"
                  checked={draft.transactionAlerts}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => setDraft((p) => ({ ...p, transactionAlerts: checked }))}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="security-alerts" className="flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Security Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">Logins, password changes, and warnings.</p>
                </div>
                <Switch
                  id="security-alerts"
                  checked={draft.securityAlerts}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => setDraft((p) => ({ ...p, securityAlerts: checked }))}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="low-balance-alerts" className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4" /> Low Balance Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">Get notified when a wallet balance is low.</p>
                </div>
                <Switch
                  id="low-balance-alerts"
                  checked={draft.lowBalanceAlerts}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => setDraft((p) => ({ ...p, lowBalanceAlerts: checked }))}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="large-transaction-alerts" className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" /> Large Transaction Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">Alerts for unusually large transactions.</p>
                </div>
                <Switch
                  id="large-transaction-alerts"
                  checked={draft.largeTransactionAlerts}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => setDraft((p) => ({ ...p, largeTransactionAlerts: checked }))}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4 md:col-span-2">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="marketing-emails" className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" /> Promotions & Marketing
                  </Label>
                  <p className="text-xs text-muted-foreground">Updates about new features and special offers.</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={draft.marketingEmails}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => setDraft((p) => ({ ...p, marketingEmails: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
          <Button onClick={save} disabled={saving || loading || !dirty}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Save
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

