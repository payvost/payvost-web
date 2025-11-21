
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  LineChart,
  Package,
  ShoppingCart,
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
  FileBarChart,
  HelpingHand,
  BookOpen,
  Mail,
  KeyRound,
  Webhook,
  FileCode,
  TestTube,
  FileWarning,
  ScrollText,
  Gavel,
  Shield,
  Cog,
  Zap,
  Bot,
  Search,
  PanelLeft,
  CreditCard,
  Bell,
  Building2,
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
        group: 'Overview', 
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard', icon: <LineChart />, label: 'Dashboard' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/real-time', icon: <LineChart />, label: 'Real-Time Transactions' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/system-status', icon: <FileText />, label: 'System Status' },
        ]
      },
      {
        group: 'Payments & Transfers',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions', icon: <DollarSign />, label: 'Transactions' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/remittances', icon: <ArrowRightLeft />, label: 'Remittances' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-links', icon: <HandCoins />, label: 'Payment Links' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management', icon: <CreditCard />, label: 'Card Management' },
        ]
      },
       {
        group: 'Businesses / Merchants',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts', icon: <Store />, label: 'Business Accounts' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/merchant-management', icon: <UserCog />, label: 'Merchant Management' },
        ]
      },
       {
        group: 'Users & Roles',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers', icon: <Users />, label: 'Customers' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/team-management', icon: <UserCog />, label: 'Team Management' },
        ]
      },
       {
        group: 'Revenue & Fees',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/fee-configuration', icon: <DollarSign />, label: 'Fee Configuration' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/invoicing', icon: <FileText />, label: 'Invoicing' },
        ]
      },
      {
        group: 'Reports & Analytics',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/revenue-breakdown', icon: <LineChart />, label: 'Revenue Breakdown' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/fraud-analysis', icon: <ShieldAlert />, label: 'Fraud & Risk Analysis' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/custom-reports', icon: <FileText />, label: 'Custom Reports' },
        ]
      },
       {
        group: 'Operations',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settlement-engine', icon: <Cog />, label: 'Settlement Engine' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/bank-integrations', icon: <Landmark />, label: 'Bank Integrations' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/forex-rates', icon: <Globe />, label: 'Forex & Exchange Rates' },
        ]
      },
      {
        group: 'Support Tools',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/notifications', icon: <Bell />, label: 'Notification Center' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/support-center', icon: <HelpingHand />, label: 'Customer Support' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/dispute-resolution', icon: <Gavel />, label: 'Dispute Resolution' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/knowledge-base', icon: <BookOpen />, label: 'Knowledge Base' },
        ]
      },
       {
        group: 'Platform Settings',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/localization', icon: <Globe />, label: 'Localization' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/security', icon: <Shield />, label: 'Security' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/integrations', icon: <Puzzle />, label: 'Integrations' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/api-settings', icon: <KeyRound />, label: 'API Settings' },
        ]
      },
      {
        group: 'Developer Tools',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/webhooks-logs', icon: <Webhook />, label: 'Webhooks & Logs' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/error-tracking', icon: <FileWarning />, label: 'Error Tracking' },
        ]
      },
       {
        group: 'Compliance & Legal',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/compliance-risk', icon: <ShieldAlert />, label: 'Compliance & Risk' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/reporting', icon: <Gavel />, label: 'Regulatory Reporting' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/audit-trails', icon: <FileCode />, label: 'Audit Trails' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/legal-docs', icon: <FileText />, label: 'Legal Documents' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/kyc-review', icon: <ShieldCheck />, label: 'KYC Review' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-onboarding', icon: <Building2 />, label: 'Business Onboarding' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/kyc-aml', icon: <ShieldCheck />, label: 'KYC/AML Policy' },
        ]
      },
      {
        group: 'System Admin',
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/platform-config', icon: <Cog />, label: 'Platform Config' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/release-management', icon: <Zap />, label: 'Release Management' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/ai-automation', icon: <Bot />, label: 'AI/Automation' },
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
    <div className="hidden md:block fixed inset-y-0 left-0 w-[220px] z-50">
      <div className="flex h-full max-h-screen flex-col gap-2 border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
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
