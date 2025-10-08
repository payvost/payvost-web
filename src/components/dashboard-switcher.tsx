
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Briefcase, User } from 'lucide-react';

const tabs = [
  { id: 'personal', label: 'Personal', href: '/dashboard', icon: <User className="h-4 w-4" /> },
  { id: 'business', label: 'Business', href: '/business', icon: <Briefcase className="h-4 w-4" /> },
];

export function DashboardSwitcher() {
  const pathname = usePathname();
  const activeTabId = pathname.startsWith('/business') ? 'business' : 'personal';

  return (
    <div className="flex space-x-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
            activeTabId === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {activeTabId === tab.id && (
            <motion.div
              layoutId="dashboardSwitcherBubble"
              className="absolute inset-0 bg-background rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
