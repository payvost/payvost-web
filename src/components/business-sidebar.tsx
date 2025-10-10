
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
  ChevronDown,
  Activity,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const menuItems = [
      { 
        group: 'Overview', 
        icon: <LineChart />,
        items: [
          { href: '/business', label: 'Dashboard' },
          { href: '/business/analytics', label: 'Revenue Summary' },
          { href: '/business/health-score', label: 'Health Score' },
          { href: '/business/activity', label: 'Activity Feed' },
        ]
      },
      {
        group: 'Financials',
        icon: <DollarSign />,
        items: [
          { href: '/business/transactions', label: 'Transactions' },
          { href: '/business/invoices', label: 'Invoices' },
          { href: '/business/payouts', label: 'Payouts' },
          { href: '/business/quote-builder', label: 'Quote Builder' },
          { href: '/business/refunds', label: 'Refunds' },
          { href: '/business/payment-links', label: 'Payment Links' },
          { href: '/business/pos-terminal', label: 'Virtual POS' },
        ]
      },
       {
        group: 'Customers',
        icon: <Users />,
        items: [
          { href: '/business/customers', label: 'Customers' },
          { href: '/business/team', label: 'Team Management' },
        ]
      },
       {
        group: 'Tools & Settings',
        icon: <Puzzle />,
        items: [
          { href: '/business/integrations', label: 'Integrations' },
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
  
  const defaultActiveGroup = menuItems.find(group => group.items.some(item => isActive(item.href)))?.group;

  const renderNav = () => (
     <nav className="grid items-start text-sm font-medium">
       <Accordion type="multiple" defaultValue={[defaultActiveGroup].filter(Boolean) as string[]} className="w-full">
            {menuItems.map((group) => (
                <AccordionItem value={group.group} key={group.group} className="border-b-0">
                    <AccordionTrigger className="py-2 hover:no-underline text-muted-foreground hover:text-primary [&[data-state=open]>svg]:rotate-180">
                       <span className="flex items-center gap-2 flex-1 text-left font-semibold text-sm">
                         {React.cloneElement(group.icon as React.ReactElement, { className: 'h-4 w-4' })}
                         {group.group}
                       </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                        <div className="flex flex-col gap-1 ml-4 border-l pl-4">
                        {group.items.map(item => (
                            <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isActive(item.href)
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-muted-foreground hover:text-primary'
                            }`}
                            >
                            {item.label}
                            </Link>
                        ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
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
        <ScrollArea className="flex-1 px-2">
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
