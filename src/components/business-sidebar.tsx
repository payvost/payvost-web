
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Settings,
  DollarSign,
  Receipt,
  ChevronDown,
  Plus,
  Building2,
  CheckCircle2,
  Home,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const mainNavItems = [
  { href: '/business', icon: <Home strokeWidth={2.5} />, label: 'Dashboard' },
];

export const financialsItems = [
  { href: '/business/transactions', icon: <DollarSign strokeWidth={2.5} />, label: 'Transactions' },
  { href: '/business/invoices', icon: <Receipt strokeWidth={2.5} />, label: 'Invoices' },
  { href: '/business/payouts', icon: <DollarSign strokeWidth={2.5} />, label: 'Payouts' },
];

export const customersItems = [
  { href: '/business/customers', icon: <Users strokeWidth={2.5} />, label: 'Customers' },
];

export function BusinessSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBusinessProfile(data.businessProfile);
      }
    });
    return () => unsub();
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/business') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const businessName = businessProfile?.legalName || businessProfile?.name || 'Business';
  const businessLogo = businessProfile?.logoUrl;
  const businessStatus = businessProfile?.status || 'pending';

  const getBusinessStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return { label: 'Verified', color: 'bg-green-500/10 text-green-700 dark:text-green-400' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-500/10 text-red-700 dark:text-red-400' };
      case 'under_review':
      case 'pending_review':
        return { label: 'Under Review', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' };
      default:
        return { label: 'Pending', color: 'bg-muted text-muted-foreground' };
    }
  };

  const businessStatusBadge = getBusinessStatusBadge(businessStatus);

  const BusinessHeaderDropdown = ({ className }: { className?: string }) => {
    const isVerified = businessStatus.toLowerCase() === 'approved';
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn("w-full text-left h-16 flex items-center", className)}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {businessLogo ? (
                <img src={businessLogo} alt={businessName} className="h-8 w-8 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-sidebar-foreground">{businessName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {businessName}
                  </span>
                  {isVerified ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
            </div>
          </button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[calc(var(--sidebar-width)-1rem)]">
        <DropdownMenuItem asChild>
          <Link href="/business/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Business Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/get-started" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Another Business</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>Switch Business</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    );
  };

  const renderNav = () => (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel>Financials</SidebarGroupLabel>
          <SidebarMenu>
            {financialsItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel>Customers</SidebarGroupLabel>
          <SidebarMenu>
            {customersItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 p-0 border-b">
        <div className="h-full px-2 flex items-center">
          <BusinessHeaderDropdown />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderNav()}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/business/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/business/support">
                    <HelpCircle />
                    <span>Get Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/business/search">
                    <Search />
                    <span>Search</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
