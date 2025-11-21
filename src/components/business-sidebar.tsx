
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  LineChart,
  Settings,
  DollarSign,
  Activity,
  Receipt,
  Puzzle,
  BookOpen,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export const menuItems = [
      { 
        group: 'Overview', 
        icon: LineChart,
        items: [
          { href: '/business', label: 'Dashboard' },
          { href: '/business/analytics', label: 'Revenue Summary' },
          { href: '/business/health-score', label: 'Health Score' },
          { href: '/business/activity', label: 'Activity Feed' },
        ]
      },
      {
        group: 'Financials',
        icon: DollarSign,
        items: [
          { href: '/business/transactions', label: 'Transactions' },
          { href: '/business/invoices', label: 'Invoices' },
          { href: '/business/payouts', label: 'Payouts' },
          { href: '/business/quote-builder', label: 'Quote Builder' },
          { href: '/business/refunds', label: 'Refunds' },
          { href: '/business/payment-links', label: 'Payment Links' },
        ]
      },
       {
        group: 'Bookkeeping',
        icon: BookOpen,
        items: [
            { href: '/business/general-ledger', label: 'General Ledger' },
            { href: '/business/expenses', label: 'Expenses & Bills' },
            { href: '/business/accounting-automation', label: 'Accounting Automation' },
            { href: '/business/financial-reports', label: 'Financial Reports' },
            { href: '/business/tax-compliance', label: 'Tax & Compliance' },
        ]
      },
      {
        group: 'Sales & Commerce',
        icon: Receipt,
        items: [
            { href: '/business/orders', label: 'Orders' },
            { href: '/business/subscriptions', label: 'Subscriptions' },
            { href: '/business/inventory', label: 'Inventory' },
            { href: '/business/product-catalog', label: 'Product Catalog' },
            { href: '/business/pricing-plans', label: 'Pricing Plans' },
            { href: '/business/promotions', label: 'Promotions & Discounts' },
            { href: '/business/affiliates', label: 'Affiliate Programs' },
            { href: '/business/marketplace', label: 'Marketplace' },
            { href: '/business/pos-terminal', label: 'Virtual POS' },
        ]
      },
       {
        group: 'Customers',
        icon: Users,
        items: [
          { href: '/business/customers', label: 'Customers' },
        ]
      },
       {
        group: 'Tools & Settings',
        icon: Puzzle,
        items: [
          { href: '/business/integrations', label: 'Integrations' },
          { href: '/business/support', label: 'Support' },
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
     <nav>
       <Accordion 
         type="multiple" 
         defaultValue={[defaultActiveGroup].filter(Boolean) as string[]} 
         className="w-full"
       >
            {menuItems.map((group) => {
              const GroupIcon = group.icon;
              const hasActiveItem = group.items.some(item => isActive(item.href));
              
              return (
                <AccordionItem 
                  value={group.group} 
                  key={group.group} 
                  className="border-b-0"
                >
                    <AccordionTrigger 
                      className={cn(
                        "py-2 px-2 rounded hover:no-underline transition-colors",
                        "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                        "hover:bg-sidebar-accent",
                        "[&[data-state=open]>svg]:rotate-90",
                        hasActiveItem && "text-sidebar-foreground bg-sidebar-accent/50"
                      )}
                    >
                       <span className="flex items-center gap-2 flex-1 text-left text-sm">
                         <GroupIcon className="h-4 w-4 shrink-0" />
                         <span className="truncate">{group.group}</span>
                       </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-0">
                        <div className="flex flex-col ml-6">
                        {group.items.map(item => {
                          const active = isActive(item.href);
                          
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                                className={cn(
                                  "px-2 py-1.5 text-sm transition-colors rounded",
                                  "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                                  "hover:bg-sidebar-accent",
                                  active && "text-sidebar-foreground font-medium bg-sidebar-accent"
                                )}
                              >
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
              );
            })}
        </Accordion>
    </nav>
  );

  return (
    <div className="hidden md:flex fixed inset-y-0 left-0 w-[12rem] z-50 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex h-12 items-center border-b px-4">
        <Link href="/business" className="flex items-center justify-start">
          <Icons.logo className="h-8" />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {renderNav()}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto border-t p-2">
        <Link
          href="/business/settings"
          className={cn(
            "flex items-center gap-2 px-2 py-2 text-sm rounded transition-colors",
            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            isActive('/business/settings') && "text-sidebar-foreground bg-sidebar-accent"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
      </div>
    </div>
  );
}
