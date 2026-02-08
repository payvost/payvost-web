'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  AlertTriangle,
  Bell,
  CreditCard,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-user-preferences';

type TwoFaStatus = { enabled?: boolean } | null;

export default function SettingsOverviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences, userData, loading } = useUserPreferences();
  const { theme } = useTheme();

  const [twoFaStatus, setTwoFaStatus] = useState<TwoFaStatus>(null);
  const [loading2fa, setLoading2fa] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load2fa = async () => {
      if (!user) return;
      setLoading2fa(true);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/2fa/status', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error('Failed to load 2FA status');
        const data = (await res.json()) as TwoFaStatus;
        if (!cancelled) setTwoFaStatus(data);
      } catch (err) {
        console.error('2FA status load error:', err);
        if (!cancelled) setTwoFaStatus(null);
        toast({
          title: 'Could not load 2FA status',
          description: 'Some settings summaries may be unavailable.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading2fa(false);
      }
    };

    void load2fa();
    return () => {
      cancelled = true;
    };
  }, [user, toast]);

  const defaultWalletCurrency =
    typeof userData?.defaultWalletCurrency === 'string' && userData.defaultWalletCurrency
      ? userData.defaultWalletCurrency
      : null;

  const cards = useMemo(
    () => [
      {
        href: '/dashboard/settings/wallet',
        title: 'Wallet',
        description: 'Default wallet and currency preferences.',
        icon: Wallet,
        status: defaultWalletCurrency ? `Default: ${defaultWalletCurrency}` : 'No default wallet set',
      },
      {
        href: '/dashboard/settings/notifications',
        title: 'Notifications',
        description: 'How we contact you and what you receive.',
        icon: Bell,
        status: `${preferences.email ? 'Email' : 'No email'}, ${preferences.push ? 'Push' : 'No push'}, ${preferences.sms ? 'SMS' : 'No SMS'}`,
      },
      {
        href: '/dashboard/settings/security',
        title: 'Security',
        description: 'Email verification and 2FA.',
        icon: ShieldCheck,
        status: loading2fa ? 'Loading 2FA status...' : twoFaStatus?.enabled ? '2FA enabled' : '2FA not enabled',
      },
      {
        href: '/dashboard/settings/appearance',
        title: 'Appearance',
        description: 'Theme and accessibility settings.',
        icon: Palette,
        status: `${theme || 'system'} theme, ${preferences.highContrast ? 'high contrast' : 'standard'}, ${preferences.fontScale}x`,
      },
      {
        href: '/dashboard/settings/transactions',
        title: 'Transactions',
        description: 'Recipients, templates, FX alerts.',
        icon: SlidersHorizontal,
        status: 'Shortcuts and defaults',
      },
      {
        href: '/dashboard/settings/payment-methods',
        title: 'Payment Methods',
        description: 'Cards and wallet funding.',
        icon: CreditCard,
        status: 'Manage ways you pay and get paid',
      },
      {
        href: '/dashboard/settings/legal',
        title: 'Legal',
        description: 'Terms, privacy, and support.',
        icon: ShieldCheck,
        status: 'Policies and contact',
      },
      {
        href: '/dashboard/settings/danger',
        title: 'Danger',
        description: 'Account deletion request.',
        icon: AlertTriangle,
        status: 'Request account deletion',
      },
    ],
    [
      defaultWalletCurrency,
      preferences.email,
      preferences.push,
      preferences.sms,
      preferences.highContrast,
      preferences.fontScale,
      theme,
      loading2fa,
      twoFaStatus?.enabled,
    ]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">Quick summary and shortcuts for your account settings.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.href} href={c.href} className="block">
                <Card className="h-full transition-shadow hover:shadow-sm">
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <span className="truncate">{c.title}</span>
                        </CardTitle>
                        <CardDescription>{c.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        Open
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{c.status}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
