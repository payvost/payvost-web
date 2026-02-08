'use client';

import React from 'react';
import { Search } from 'lucide-react';

import type { User } from 'firebase/auth';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { UserNav } from '@/components/user-nav';
import { DashboardSearch } from '@/components/dashboard-search';

type DashboardContext = 'personal' | 'business';

export interface DashboardHeaderProps {
  context: DashboardContext;
  user: User | null;
  scrolled?: boolean;
  rightSlot?: React.ReactNode;
  businessLogoUrl?: string | null;
}

export function DashboardHeader({
  context,
  user,
  scrolled = false,
  rightSlot,
  businessLogoUrl,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-[var(--app-header-height)] items-center gap-2 bg-background/85 px-3 pt-1 pb-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70 sm:gap-3 sm:px-4 lg:px-6',
        'rounded-b-lg',
        scrolled && 'shadow-sm'
      )}
    >
      <SidebarTrigger className="md:hidden" />

      {/* Search */}
      <div className="flex min-w-0 flex-1 items-center">
        <div className="hidden w-full md:block md:max-w-sm">
          <DashboardSearch />
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Mobile search */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top">
              <SheetHeader>
                <SheetTitle>Search</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <DashboardSearch />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {rightSlot}
        <ThemeSwitcher />
        <NotificationDropdown context={context} />
        <UserNav user={user} businessLogoUrl={businessLogoUrl} />
      </div>
    </header>
  );
}
