
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  PanelLeft,
  Settings,
  LineChart,
  Globe,
  FileText,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { Icons } from './icons';
import { ScrollArea } from './ui/scroll-area';
import { ThemeSwitcher } from './theme-switcher';

export function AdminHeader() {
    const { user } = useAuth();
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const menuItems = [
      { 
        group: 'Overview', 
        items: [
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard', icon: <LineChart />, label: 'Dashboard' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/real-time', icon: <LineChart />, label: 'Real-Time Transactions' },
          { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/system-status', icon: <FileText />, label: 'System Status' },
        ]
      },
        {
          group: 'Support Tools',
          items: [
            { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/notifications', icon: <Bell />, label: 'Notification Center' },
            { href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/support-center', icon: <FileText />, label: 'Support Center' },
          ],
        },
      // ... other menu groups can be added here for the mobile view if needed
    ];

    const renderNav = () => (
        <nav className="grid items-start text-sm font-medium">
         {menuItems.map((group) => (
           <div key={group.group} className="py-2">
             <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               {group.group}
             </h4>
             {group.items.map(item => (
               <Link
                 key={item.label}
                 href={item.href}
                 className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                   isActive(item.href)
                     ? 'bg-primary text-primary-foreground'
                     : 'text-muted-foreground hover:text-primary'
                 }`}
               >
                 {React.cloneElement(item.icon as React.ReactElement, { className: 'h-4 w-4' })}
                 {item.label}
               </Link>
             ))}
           </div>
         ))}
       </nav>
     );


    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] sticky top-0 z-40 lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
              <SheetHeader className="p-0">
                  <SheetTitle className="sr-only">Sidebar Menu</SheetTitle>
              </SheetHeader>
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                   <Icons.logo className="h-8" />
                 </Link>
              </div>
               <ScrollArea className="flex-1 px-4">
                {renderNav()}
               </ScrollArea>
                 <div className="mt-auto p-4">
                    <Link
                        href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settings"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                        isActive('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settings')
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-primary'
                        }`}
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users, transactions, settings..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <ThemeSwitcher />
          <UserNav user={user}/>
        </header>
    )
}
