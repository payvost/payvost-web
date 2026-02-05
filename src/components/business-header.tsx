'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { ThemeSwitcher } from './theme-switcher';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardSwitcher } from './dashboard-switcher';
import { NotificationDropdown } from './notification-dropdown';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from './ui/sidebar';
import { DashboardSearch } from './dashboard-search';
import { QuickActionsDropdown } from './quick-actions-dropdown';

interface BusinessHeaderProps {
  scrolled?: boolean;
}

export function BusinessHeader({ scrolled = false }: BusinessHeaderProps) {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setLogoUrl(docSnap.data().businessProfile?.logoUrl || null);
      }
    });
    return () => unsub();
  }, [user]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-auto min-h-14 flex-wrap items-center gap-2 bg-background/95 px-3 py-2 backdrop-blur-sm transition-all sm:gap-3 sm:px-4 lg:h-[60px] lg:flex-nowrap lg:px-6',
        scrolled && 'border-b shadow-sm'
      )}
    >
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex-1 order-2 md:order-none">
        <div className="relative w-full md:max-w-sm">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
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
          <div className="hidden md:block">
            <DashboardSearch />
          </div>
        </div>
      </div>
      <div className="ml-auto flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap md:justify-end">
        <QuickActionsDropdown />
        <DashboardSwitcher />
        <Button variant="ghost" size="icon" asChild>
          <Link href="/business/support">
            <LifeBuoy className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Support</span>
          </Link>
        </Button>
        <ThemeSwitcher />
        <NotificationDropdown context="business" />
        <UserNav user={user} businessLogoUrl={logoUrl} />
      </div>
    </header>
  );
}
