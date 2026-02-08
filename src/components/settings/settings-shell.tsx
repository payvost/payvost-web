'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  CreditCard,
  Eye,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: '/dashboard/settings', label: 'Overview', description: 'Quick summary and shortcuts.', icon: Eye },
  { href: '/dashboard/settings/wallet', label: 'Wallet', description: 'Default wallet and currency.', icon: Wallet },
  { href: '/dashboard/settings/notifications', label: 'Notifications', description: 'Alerts and delivery channels.', icon: Bell },
  { href: '/dashboard/settings/security', label: 'Security', description: 'Email verification and 2FA.', icon: ShieldCheck },
  { href: '/dashboard/settings/appearance', label: 'Appearance', description: 'Theme and accessibility.', icon: Palette },
  { href: '/dashboard/settings/transactions', label: 'Transactions', description: 'Recipients, templates, FX alerts.', icon: SlidersHorizontal },
  { href: '/dashboard/settings/payment-methods', label: 'Payment Methods', description: 'Cards and wallet funding.', icon: CreditCard },
  { href: '/dashboard/settings/legal', label: 'Legal', description: 'Terms, privacy, and support.', icon: ShieldCheck },
  { href: '/dashboard/settings/danger', label: 'Danger', description: 'Account deletion request.', icon: AlertTriangle },
];

function resolveActiveHref(pathname: string): string {
  if (pathname === '/dashboard/settings' || pathname === '/dashboard/settings/') return '/dashboard/settings';
  const matches = SETTINGS_NAV.filter((i) => i.href !== '/dashboard/settings' && pathname.startsWith(i.href));
  if (matches.length === 0) return '/dashboard/settings';
  // Longest match wins.
  matches.sort((a, b) => b.href.length - a.href.length);
  return matches[0].href;
}

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = resolveActiveHref(pathname);
  const active = SETTINGS_NAV.find((i) => i.href === activeHref) ?? SETTINGS_NAV[0];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
          <p className="text-sm text-muted-foreground truncate">{active.description}</p>
        </div>

        <div className="w-[220px] md:hidden">
          <Select value={activeHref} onValueChange={(href) => router.push(href)}>
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {SETTINGS_NAV.map((item) => (
                <SelectItem key={item.href} value={item.href}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {SETTINGS_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeHref;
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start gap-2', isActive && 'font-semibold')}
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
