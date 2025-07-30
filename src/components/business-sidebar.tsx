
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ArrowRightLeft,
  Settings,
  DollarSign,
  FileText,
  ShoppingCart,
  QrCode,
  Repeat,
  Users,
  Ticket,
  Send,
  ClipboardList,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';

export function BusinessSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Exact match for the main business dashboard page
    if (href === '/business') {
        return pathname === href;
    }
    // Starts with for sub-pages
    return pathname.startsWith(href);
  };

  const menuItems = [
      { 
        group: 'Overview', 
        items: [
          { href: '/business', icon: <Home />, label: 'Dashboard' },
          { href: '/business/activity', icon: <ArrowRightLeft />, label: 'Activity Feed' },
          { href: '/business/account-summary', icon: <FileText />, label: 'Account Summary' },
        ]
      },
      {
        group: 'Payments',
        items: [
          { href: '/business/payouts', icon: <Send />, label: 'Make a Payout' },
          { href: '/business/transactions', icon: <DollarSign />, label: 'Transactions' },
          { href: '#', icon: <FileText />, label: 'Received Payments' },
          { href: '#', icon: <ShoppingCart />, label: 'Payment Links' },
        ]
      },
       {
        group: 'Invoicing & Billing',
        items: [
          { href: '/business/invoicing', icon: <FileText />, label: 'Invoicing' },
          { href: '/business/quotes', icon: <ClipboardList />, label: 'Quote Builder' },
        ]
      },
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
              href="/business/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive('/business/settings')
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
