import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Wallet,
  Send,
  SendHorizontal,
  ArrowRightLeft,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Gift,
  HandCoins,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';

import type { CapabilityKey } from '@/lib/capabilities';

export type NavBadge =
  | { type: 'new'; label?: string }
  | { type: 'count'; count: number };

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  trackingId: string;
  badge?: NavBadge;
  capabilityKey?: CapabilityKey;
  children?: DashboardNavItem[];
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
};

export const DASHBOARD_NAV: DashboardNavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        trackingId: 'nav.dashboard',
      },
    ],
  },
  {
    label: 'Money',
    items: [
      {
        label: 'Wallet',
        href: '/dashboard/wallets',
        icon: Wallet,
        trackingId: 'nav.wallet',
      },
      {
        label: 'Payments',
        href: '/dashboard/payments',
        icon: Send,
        trackingId: 'nav.payments',
        children: [
          {
            label: 'Send money',
            href: '/dashboard/payments/send',
            icon: SendHorizontal,
            trackingId: 'nav.payments.send',
            capabilityKey: 'payments.send',
          },
          {
            label: 'Request money',
            href: '/dashboard/request-payment',
            icon: HandCoins,
            trackingId: 'nav.payments.request',
            capabilityKey: 'payments.request',
          },
          {
            label: 'Pay bills / Airtime',
            href: '/dashboard/payments/bills',
            icon: FileText,
            trackingId: 'nav.payments.bills',
            capabilityKey: 'payments.bills',
          },
          {
            label: 'Payment activity',
            href: '/dashboard/payments/activity',
            icon: ArrowRightLeft,
            trackingId: 'nav.payments.activity',
          },
          {
            label: 'Scheduled / Recurring',
            href: '/dashboard/payments/scheduled',
            icon: Calendar,
            trackingId: 'nav.payments.scheduled',
            capabilityKey: 'payments.scheduled',
          },
          {
            label: 'Address book',
            href: '/dashboard/recipients',
            icon: Users,
            trackingId: 'nav.payments.recipients',
          },
        ],
      },
      {
        label: 'Transactions',
        href: '/dashboard/transactions',
        icon: ArrowRightLeft,
        trackingId: 'nav.transactions',
      },
      {
        label: 'Cards',
        href: '/dashboard/cards',
        icon: CreditCard,
        trackingId: 'nav.cards',
      },
    ],
  },
  {
    label: 'Protection',
    items: [
      {
        label: 'Escrow',
        href: '/dashboard/escrow',
        icon: ShieldCheck,
        trackingId: 'nav.escrow',
        badge: { type: 'new', label: 'New' },
      },
      {
        label: 'Disputes',
        href: '/dashboard/dispute',
        icon: ShieldAlert,
        trackingId: 'nav.disputes',
        capabilityKey: 'payments.disputes',
      },
    ],
  },
  {
    label: 'Perks',
    items: [
      {
        label: 'Referrals',
        href: '/dashboard/referrals',
        icon: Gift,
        trackingId: 'nav.referrals',
      },
    ],
  },
];
