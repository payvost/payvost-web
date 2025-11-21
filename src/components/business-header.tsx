
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, PanelLeft, LifeBuoy, Command, Settings, ChevronDown, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { Icons } from './icons';
import { ScrollArea } from './ui/scroll-area';
import { ThemeSwitcher } from './theme-switcher';
import { usePathname } from 'next/navigation';
import { 
  mainNavItems, 
  financialsItems, 
  bookkeepingItems, 
  salesCommerceItems, 
  customersItems, 
  toolsItems 
} from './business-sidebar';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardSwitcher } from './dashboard-switcher';
import { NotificationDropdown } from './notification-dropdown';
import { Separator } from './ui/separator';
import { SidebarProvider, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

export function BusinessHeader() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                setLogoUrl(doc.data().businessProfile?.logoUrl);
            }
        });
        return () => unsub();
    }, [user]);

    const isActive = (href: string) => {
        if (href === '/business') return pathname === href;
        return pathname.startsWith(href);
    };
    
    const renderNav = () => (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Financials</SidebarGroupLabel>
          <SidebarMenu>
            {financialsItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Bookkeeping</SidebarGroupLabel>
          <SidebarMenu>
            {bookkeepingItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sales & Commerce</SidebarGroupLabel>
          <SidebarMenu>
            {salesCommerceItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Customers</SidebarGroupLabel>
          <SidebarMenu>
            {customersItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools & Settings</SidebarGroupLabel>
          <SidebarMenu>
            {toolsItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </>
    );

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[14rem] bg-sidebar text-sidebar-foreground">
                <SheetHeader className="p-0">
                  <SheetTitle className="sr-only">Business Sidebar</SheetTitle>
                </SheetHeader>
                <SidebarProvider>
                  {/* Business Header Card */}
                  <div className="px-2 py-2 border-b">
                    <Card className="p-2">
                      <div className="flex flex-col gap-2">
                        {/* Payvost Logo */}
                        <div className="flex items-center justify-center">
                          <Icons.logo className="h-6" />
                        </div>
                        
                        {/* BU and Business Name */}
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 shrink-0 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">BU</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">
                                Business
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Not Available Status */}
                        <div className="flex items-center justify-center">
                          <div className="rounded px-1.5 py-0.5 text-[10px] font-normal bg-muted text-muted-foreground">
                            Not Available
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                 <ScrollArea className="flex-1">
                   <div className="p-2">{renderNav()}</div>
                 </ScrollArea>
                 <div className="mt-auto border-t p-2">
                   <SidebarMenu className="w-full">
                     <div className="flex items-center justify-start">
                       <SidebarMenuItem className="w-full">
                         <SidebarMenuButton asChild size="default" className="w-full justify-start gap-2" tooltip="Settings">
                           <Link href="/business/settings">
                             <Settings />
                             <span>Settings</span>
                           </Link>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                       <SidebarMenuItem>
                         <SidebarMenuButton size="default" className="justify-start gap-2" tooltip="Developer">
                           <Puzzle />
                           <span>Developer</span>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                     </div>
                   </SidebarMenu>
                 </div>
                </SidebarProvider>
            </SheetContent>
          </Sheet>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search dashboard, transactions, customers..."
                  className="h-9 w-full pl-9 pr-9 bg-muted/50 border-muted focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
            </form>
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1">
            <DashboardSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href="/business/support">
                <LifeBuoy className="h-4 w-4" />
                <span className="sr-only">Support</span>
              </Link>
            </Button>
            <ThemeSwitcher />
            <NotificationDropdown context="business" />
            <UserNav user={user} businessLogoUrl={logoUrl} />
          </div>
        </header>
    )
}
