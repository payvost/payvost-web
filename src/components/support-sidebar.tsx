'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  Zap,
  User,
  HelpCircle,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function SupportSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/customer-support-W19KouHGlew7_jf2ds/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const menuItems = [
    { 
      group: 'Overview', 
      items: [
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
      ]
    },
    {
      group: 'Support Operations',
      items: [
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/tickets', icon: <Ticket />, label: 'Tickets' },
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/live-chat', icon: <MessageSquare />, label: 'Live Chat' },
      ]
    },
    {
      group: 'Knowledge & Resources',
      items: [
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/knowledge-base', icon: <BookOpen />, label: 'Knowledge Base' },
      ]
    },
    {
      group: 'Analytics & Reports',
      items: [
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/analytics', icon: <BarChart3 />, label: 'Analytics' },
      ]
    },
    {
      group: 'Team & Settings',
      items: [
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/team', icon: <Users />, label: 'Team Management' },
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/automation', icon: <Zap />, label: 'Automation' },
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/settings', icon: <Settings />, label: 'Settings' },
        { href: '/customer-support-W19KouHGlew7_jf2ds/dashboard/profile', icon: <User />, label: 'Profile' },
      ]
    }
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
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                ${isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/customer-support-W19KouHGlew7_jf2ds/dashboard" className="flex items-center gap-2">
            <Icons.logo className="h-8 w-8" />
            <span className="font-semibold">Support Panel</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4 py-4">
          {renderNav()}
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 md:hidden"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/customer-support-W19KouHGlew7_jf2ds/dashboard" className="flex items-center gap-2">
              <Icons.logo className="h-8 w-8" />
              <span className="font-semibold">Support Panel</span>
            </Link>
          </div>
          <ScrollArea className="px-4 py-4">
            {renderNav()}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

