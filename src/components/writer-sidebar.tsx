'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  BookOpen,
  Newspaper,
  FileCode,
  Image,
  Settings,
  Home,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function WriterSidebar() {
  const pathname = usePathname();
  const basePath = '/cms-9dj93abkD0ncfhDpLw_KIA/dashboard';

  const isActive = (href: string) => {
    if (href === `${basePath}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const menuItems = [
    {
      group: 'Content',
      items: [
        { href: basePath, icon: <Home className="h-4 w-4" />, label: 'Dashboard' },
        { href: `${basePath}/content`, icon: <FileText className="h-4 w-4" />, label: 'All Content' },
        { href: `${basePath}/content/blog`, icon: <BookOpen className="h-4 w-4" />, label: 'Blog Posts' },
        { href: `${basePath}/content/press`, icon: <Newspaper className="h-4 w-4" />, label: 'Press Releases' },
        { href: `${basePath}/content/docs`, icon: <FileCode className="h-4 w-4" />, label: 'Documentation' },
        { href: `${basePath}/content/knowledge-base`, icon: <FileText className="h-4 w-4" />, label: 'Knowledge Base' },
      ]
    },
    {
      group: 'Media',
      items: [
        { href: `${basePath}/media`, icon: <Image className="h-4 w-4" />, label: 'Media Library' },
      ]
    },
    {
      group: 'Settings',
      items: [
        { href: `${basePath}/settings`, icon: <Settings className="h-4 w-4" />, label: 'Settings' },
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
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                isActive(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-background md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link href={basePath} className="flex items-center gap-2">
              <Icons.logo className="h-6 w-6" />
              <span className="font-semibold">Writer Portal</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            {renderNav()}
          </ScrollArea>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed left-4 top-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Icons.logo className="h-6 w-6" />
              <span className="ml-2 font-semibold">Writer Portal</span>
            </div>
            <ScrollArea className="flex-1 px-3 py-4">
              {renderNav()}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

