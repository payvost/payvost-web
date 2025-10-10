
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, PanelLeft, LifeBuoy, ChevronDown } from 'lucide-react';
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
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] sticky top-0 z-40 lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
                <SheetHeader className="p-0">
                  <SheetTitle className="sr-only">Business Sidebar</SheetTitle>
                </SheetHeader>
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/business" className="flex items-center gap-2 font-semibold">
                   <Icons.logo className="h-8" />
                 </Link>
                </div>
               <ScrollArea className="flex-1 px-4">{renderNav()}</ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search business dashboard..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
    )
}
