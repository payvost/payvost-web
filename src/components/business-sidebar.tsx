'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, DollarSign, Receipt, Home, HelpCircle, CheckCircle2 } from 'lucide-react';

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
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type BusinessStatus = 'approved' | 'rejected' | 'under_review' | 'pending_review' | 'pending';

const overviewItems = [{ href: '/business', icon: <Home strokeWidth={2.5} />, label: 'Dashboard' }];

const moneyItems = [
  { href: '/business/transactions', icon: <DollarSign strokeWidth={2.5} />, label: 'Transactions' },
  { href: '/business/invoices', icon: <Receipt strokeWidth={2.5} />, label: 'Invoices' },
  { href: '/business/payouts', icon: <DollarSign strokeWidth={2.5} />, label: 'Payouts' },
];

const customersItems = [{ href: '/business/customers', icon: <Users strokeWidth={2.5} />, label: 'Customers' }];

function getStatusBadge(status: string | undefined | null) {
  const s = (status ?? 'pending').toLowerCase() as BusinessStatus;
  switch (s) {
    case 'approved':
      return { label: 'Verified', variant: 'secondary' as const, className: 'bg-green-500/10 text-green-700 dark:text-green-400' };
    case 'rejected':
      return { label: 'Rejected', variant: 'secondary' as const, className: 'bg-red-500/10 text-red-700 dark:text-red-400' };
    case 'under_review':
    case 'pending_review':
      return { label: 'Under review', variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' };
    default:
      return { label: 'Pending', variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' };
  }
}

export function BusinessSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setBusinessProfile(docSnap.data().businessProfile);
    });
    return () => unsub();
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/business') return pathname === href;
    return pathname.startsWith(href);
  };

  const businessName = businessProfile?.legalName || businessProfile?.name || 'Business';
  const businessLogo = businessProfile?.logoUrl as string | undefined;
  const statusBadge = useMemo(() => getStatusBadge(businessProfile?.status), [businessProfile?.status]);
  const isVerified = (businessProfile?.status ?? '').toString().toLowerCase() === 'approved';

  const renderGroup = (label: string, items: Array<{ href: string; icon: React.ReactNode; label: string }>) => (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
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
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-[var(--app-header-height)] flex-row items-center justify-between gap-2 p-0 px-3">
        <div className="flex w-full items-center justify-between gap-2">
          <Link
            href="/business/settings"
            className="flex h-full items-center gap-2 rounded-md px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
          >
            {businessLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessLogo} alt={businessName} className="h-8 w-8 shrink-0 rounded object-cover" />
            ) : (
              <div className="h-8 w-8 shrink-0 rounded bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-sidebar-foreground">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-sidebar-foreground truncate">{businessName}</span>
                {isVerified && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
              </div>
              <div className="mt-0.5">
                <Badge
                  variant={statusBadge.variant}
                  className={cn('px-2 py-0 text-[11px] h-5', statusBadge.className)}
                >
                  {statusBadge.label}
                </Badge>
              </div>
            </div>
          </Link>

          <SidebarTrigger className="hidden md:inline-flex opacity-70 hover:opacity-100" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup('Overview', overviewItems)}
        <SidebarSeparator />
        {renderGroup('Money', moneyItems)}
        <SidebarSeparator />
        {renderGroup('Customers', customersItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/business/settings')} tooltip="Settings">
                  <Link href="/business/settings">
                    <Settings strokeWidth={2.5} />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/business/support')} tooltip="Help">
                  <Link href="/business/support">
                    <HelpCircle strokeWidth={2.5} />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
