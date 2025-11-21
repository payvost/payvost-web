
'use client';

import React, { useState } from 'react';
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
  Search,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const menuItems = [
      { 
        group: 'Overview', 
        icon: LineChart,
        items: [
          { href: '/business', label: 'Dashboard', icon: LineChart },
          { href: '/business/analytics', label: 'Revenue Summary', icon: LineChart },
          { href: '/business/health-score', label: 'Health Score', icon: Activity },
          { href: '/business/activity', label: 'Activity Feed', icon: Activity },
        ]
      },
      {
        group: 'Financials',
        icon: DollarSign,
        items: [
          { href: '/business/transactions', label: 'Transactions', icon: DollarSign },
          { href: '/business/invoices', label: 'Invoices', icon: Receipt },
          { href: '/business/payouts', label: 'Payouts', icon: DollarSign },
          { href: '/business/quote-builder', label: 'Quote Builder', icon: Receipt },
          { href: '/business/refunds', label: 'Refunds', icon: DollarSign },
          { href: '/business/payment-links', label: 'Payment Links', icon: Receipt },
        ]
      },
       {
        group: 'Bookkeeping',
        icon: BookOpen,
        items: [
            { href: '/business/general-ledger', label: 'General Ledger', icon: BookOpen },
            { href: '/business/expenses', label: 'Expenses & Bills', icon: Receipt },
            { href: '/business/accounting-automation', label: 'Accounting Automation', icon: Activity },
            { href: '/business/financial-reports', label: 'Financial Reports', icon: LineChart },
            { href: '/business/tax-compliance', label: 'Tax & Compliance', icon: Receipt },
        ]
      },
      {
        group: 'Sales & Commerce',
        icon: Receipt,
        items: [
            { href: '/business/orders', label: 'Orders', icon: Receipt },
            { href: '/business/subscriptions', label: 'Subscriptions', icon: Receipt },
            { href: '/business/inventory', label: 'Inventory', icon: Receipt },
            { href: '/business/product-catalog', label: 'Product Catalog', icon: Receipt },
            { href: '/business/pricing-plans', label: 'Pricing Plans', icon: DollarSign },
            { href: '/business/promotions', label: 'Promotions & Discounts', icon: Receipt },
            { href: '/business/affiliates', label: 'Affiliate Programs', icon: Users },
            { href: '/business/marketplace', label: 'Marketplace', icon: Receipt },
            { href: '/business/pos-terminal', label: 'Virtual POS', icon: Receipt },
        ]
      },
       {
        group: 'Customers',
        icon: Users,
        items: [
          { href: '/business/customers', label: 'Customers', icon: Users },
        ]
      },
       {
        group: 'Tools & Settings',
        icon: Puzzle,
        items: [
          { href: '/business/integrations', label: 'Integrations', icon: Puzzle },
          { href: '/business/support', label: 'Support', icon: Puzzle },
        ]
      },
];

export function BusinessSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (href: string) => {
    if (href === '/business') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  const defaultActiveGroup = menuItems.find(group => group.items.some(item => isActive(item.href)))?.group;

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.group.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  const renderNav = () => (
     <nav className="space-y-1">
       <Accordion 
         type="multiple" 
         defaultValue={[defaultActiveGroup].filter(Boolean) as string[]} 
         className="w-full"
       >
            {filteredMenuItems.map((group) => {
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
                        "py-2.5 px-3 rounded-md hover:no-underline transition-colors",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-accent",
                        "[&[data-state=open]>svg]:rotate-90",
                        hasActiveItem && "text-foreground bg-accent/50"
                      )}
                    >
                       <span className="flex items-center gap-2.5 flex-1 text-left font-medium text-sm">
                         <GroupIcon className="h-4 w-4 shrink-0" />
                         <span className="truncate">{group.group}</span>
                       </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1.5 pt-0">
                        <div className="flex flex-col gap-0.5 ml-7 mt-1">
                        {group.items.map(item => {
                          const ItemIcon = item.icon;
                          const active = isActive(item.href);
                          
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                                  "relative group/item",
                                  active
                                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                              >
                                <ItemIcon className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  active ? "text-primary" : "text-muted-foreground"
                                )} />
                              <span className="truncate flex-1">{item.label}</span>
                              {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                              )}
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
    <div className="hidden md:flex fixed inset-y-0 left-0 w-[260px] z-50 flex-col border-r bg-muted/30 backdrop-blur-sm">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/business" className="flex items-center gap-2.5 font-semibold hover:opacity-80 transition-opacity">
          <Icons.logo className="h-7 w-7" />
          <span className="text-base">Business</span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 bg-background/80 text-sm focus-visible:ring-2"
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        {renderNav()}
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto border-t p-3">
        <Link
          href="/business/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            isActive('/business/settings') && "bg-accent text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
      </div>
    </div>
  );
}
