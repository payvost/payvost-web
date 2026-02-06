
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  LineChart,
  Settings,
  DollarSign,
  ArrowRightLeft,
  HandCoins,
  Store,
  ShieldAlert,
  Puzzle,
  ShieldCheck,
  Globe,
  Wallet,
  Landmark,
  UserCog,
  FileText,
  HelpingHand,
  BookOpen,
  KeyRound,
  Webhook,
  FileCode,
  FileWarning,
  Gavel,
  Shield,
  Cog,
  CreditCard,
  Bell,
  Building2,
  Activity,
  TrendingUp,
  AlertTriangle,
  Layers3,
  RefreshCw,
  BarChart3,
  Route,
  Banknote,
  FileCheck,
  AlertCircle,
  Network,
  Database,
  FileBarChart2,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const menuItems = [
      { 
        group: 'Dashboard & Monitoring', 
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard', icon: <LineChart />, label: 'Dashboard' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/real-time', icon: <Activity />, label: 'Real-Time Monitoring' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/system-status', icon: <AlertTriangle />, label: 'System Health & Alerts' },
        ]
      },
      {
        group: 'Transactions & Payments',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions', icon: <DollarSign />, label: 'All Transactions' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/remittances', icon: <ArrowRightLeft />, label: 'Cross-Border Transfers' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-links', icon: <HandCoins />, label: 'Payment Links' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management', icon: <CreditCard />, label: 'Card Operations' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-routing', icon: <Route />, label: 'Payment Routing & Optimization' },
        ]
      },
      {
        group: 'Financial Operations',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settlement-engine', icon: <Layers3 />, label: 'Settlement & Reconciliation' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/liquidity-management', icon: <Banknote />, label: 'Liquidity Management' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/forex-rates', icon: <TrendingUp />, label: 'Forex Rate Management' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/fee-configuration', icon: <DollarSign />, label: 'Fee Configuration' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payout-management', icon: <RefreshCw />, label: 'Payout Management' },
        ]
      },
      {
        group: 'Customers & Businesses',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers', icon: <Users />, label: 'Customer Management' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts', icon: <Store />, label: 'Business Accounts' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/merchant-management', icon: <UserCog />, label: 'Merchant Management' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/kyc-review', icon: <ShieldCheck />, label: 'KYC/AML Review' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-onboarding', icon: <Building2 />, label: 'Business Onboarding' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/referral-campaigns', icon: <Gift />, label: 'Referral Campaigns' },
        ]
      },
      {
        group: 'Compliance & Risk',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/compliance-risk', icon: <ShieldAlert />, label: 'Compliance Dashboard' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/risk-assessment', icon: <BarChart3 />, label: 'Risk Assessment' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/sanctions-screening', icon: <AlertCircle />, label: 'Sanctions Screening' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/fraud-analysis', icon: <ShieldAlert />, label: 'Fraud Detection & Analysis' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/reporting', icon: <FileBarChart2 />, label: 'Regulatory Reporting' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/audit-trails', icon: <FileCheck />, label: 'Audit Trails' },
        ]
      },
      {
        group: 'Banking & Integrations',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/bank-integrations', icon: <Landmark />, label: 'Bank Integrations' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/correspondent-banking', icon: <Network />, label: 'Correspondent Banking' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-provider-management', icon: <Puzzle />, label: 'Payment Provider Management' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/api-settings', icon: <KeyRound />, label: 'API & Webhooks' },
        ]
      },
      {
        group: 'Support & Operations',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/support-center', icon: <HelpingHand />, label: 'Support Center' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/dispute-resolution', icon: <Gavel />, label: 'Dispute Resolution' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/notifications', icon: <Bell />, label: 'Notification Center' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/knowledge-base', icon: <BookOpen />, label: 'Knowledge Base' },
        ]
      },
      {
        group: 'Settings & Admin',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/platform-config', icon: <Cog />, label: 'Platform Configuration' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/team-management', icon: <Users />, label: 'Team & Permissions' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/security', icon: <Shield />, label: 'System Settings' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/legal-docs', icon: <FileText />, label: 'Legal Documents' },
        ]
      }
    ];

  const renderNav = () => (
     <nav className="grid items-start text-sm font-medium">
      {menuItems.map((group) => (
        <div key={group.group} className="py-2">
          <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {group.group}
          </h4>
          {group.items.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {React.cloneElement(item.icon as React.ReactElement, { className: 'h-4 w-4' })}
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="hidden md:block fixed inset-y-0 left-0 w-[280px] z-50">
      <div className="flex h-full max-h-screen flex-col gap-2 border-r bg-muted/40">
        <div className="flex h-[var(--app-header-height)] items-center border-b px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-8" />
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4">
          {renderNav()}
        </ScrollArea>
        <div className="mt-auto p-4">
           <Link
              href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
        </div>
      </div>
    </div>
  );
}
