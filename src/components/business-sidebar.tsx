
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  LineChart,
  Settings,
  DollarSign,
  ArrowRightLeft,
  Store,
  ShieldCheck,
  FileText,
  UserCog,
  Shield,
  Puzzle,
  Briefcase,
  HeartPulse,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

export const menuItems = [
      { 
        group: 'Overview', 
        items: [
          { href: '/business', icon: <LineChart />, label: 'Dashboard' },
          { href: '/business/analytics', icon: <LineChart />, label: 'Revenue Summary' },
          { href: '/business/health-score', icon: <HeartPulse />, label: 'Health Score' },
        ]
      },
      {
        group: 'Financials',
        items: [
          { href: '/business/transactions', icon: <DollarSign />, label: 'Transactions' },
          { href: '/business/invoices', icon: <FileText />, label: 'Invoices' },
          { href: '/business/payouts', icon: <ArrowRightLeft />, label: 'Payouts' },
          { href: '/business/quote-builder', icon: <FileText />, label: 'Quote Builder' },
        ]
      },
       {
        group: 'Customers',
        items: [
          { href: '/business/customers', icon: <Users />, label: 'Customers' },
          { href: '/business/team', icon: <UserCog />, label: 'Team Management' },
        ]
      },
       {
        group: 'Tools & Settings',
        items: [
          { href: '/business/integrations', icon: <Puzzle />, label: 'Integrations' },
        ]
      },
];

export function BusinessSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/business') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

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
          <Link href="/business" className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-8" />
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4">
          {renderNav()}
        </ScrollArea>
        <div className="mt-auto p-4">
           <Link
              href="/business/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive('/business/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Settings className="h-4 w-4" />
              Business Settings
            </Link>
        </div>
      </div>
    </div>
  );
}
