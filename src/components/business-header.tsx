
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, PanelLeft, LifeBuoy, Command, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { Icons } from './icons';
import { ScrollArea } from './ui/scroll-area';
import { ThemeSwitcher } from './theme-switcher';
import { usePathname } from 'next/navigation';
import { menuItems } from './business-sidebar';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardSwitcher } from './dashboard-switcher';
import { NotificationDropdown } from './notification-dropdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
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
    
    const defaultActiveGroup = menuItems.find(group => group.items.some(item => isActive(item.href)))?.group;

    const renderNav = () => (
       <nav>
         <Accordion type="multiple" defaultValue={[defaultActiveGroup].filter(Boolean) as string[]} className="w-full">
              {menuItems.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveItem = group.items.some(item => isActive(item.href));
                
                return (
                  <AccordionItem value={group.group} key={group.group} className="border-b-0">
                      <AccordionTrigger className={cn(
                        "py-2 px-2 rounded hover:no-underline transition-colors",
                        "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                        "hover:bg-sidebar-accent",
                        "[&[data-state=open]>svg]:rotate-90",
                        hasActiveItem && "text-sidebar-foreground bg-sidebar-accent/50"
                      )}>
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
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[12rem] bg-sidebar text-sidebar-foreground">
                <SheetHeader className="p-0">
                  <SheetTitle className="sr-only">Business Sidebar</SheetTitle>
                </SheetHeader>
                <div className="flex h-12 items-center border-b px-4">
                 <Link href="/business" className="flex items-center justify-start">
                   <Icons.logo className="h-8" />
                 </Link>
                </div>
               <ScrollArea className="flex-1">
                 <div className="p-2">{renderNav()}</div>
               </ScrollArea>
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
