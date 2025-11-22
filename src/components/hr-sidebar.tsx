'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Briefcase,
  FileText,
  UserCheck,
  Calendar,
  BarChart3,
  Settings,
  ClipboardList,
  Search,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function HrSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/hr-admin/dashboard') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const menuItems = [
      { 
        group: 'Overview', 
        items: [
          { href: '/hr-admin/dashboard', icon: <BarChart3 />, label: 'Dashboard' },
          { href: '/hr-admin/analytics', icon: <TrendingUp />, label: 'Analytics & Reports' },
        ]
      },
      {
        group: 'Jobs & Postings',
        items: [
          { href: '/hr-admin/jobs', icon: <Briefcase />, label: 'Job Postings' },
          { href: '/hr-admin/jobs/create', icon: <Briefcase />, label: 'Create Job' },
        ]
      },
      {
        group: 'Applications & Candidates',
        items: [
          { href: '/hr-admin/applications', icon: <FileText />, label: 'All Applications' },
          { href: '/hr-admin/applications/pending', icon: <Clock />, label: 'Pending Review' },
          { href: '/hr-admin/candidates', icon: <UserCheck />, label: 'Candidates' },
          { href: '/hr-admin/applications/shortlisted', icon: <CheckCircle />, label: 'Shortlisted' },
          { href: '/hr-admin/applications/rejected', icon: <XCircle />, label: 'Rejected' },
        ]
      },
      {
        group: 'Hiring Workflow',
        items: [
          { href: '/hr-admin/interviews', icon: <Calendar />, label: 'Interviews' },
          { href: '/hr-admin/offers', icon: <Send />, label: 'Job Offers' },
          { href: '/hr-admin/onboarding', icon: <ClipboardList />, label: 'Onboarding' },
        ]
      },
      {
        group: 'Talent Pool',
        items: [
          { href: '/hr-admin/talent-pool', icon: <Users />, label: 'Talent Database' },
          { href: '/hr-admin/candidates/search', icon: <Search />, label: 'Search Candidates' },
        ]
      },
      {
        group: 'Settings',
        items: [
          { href: '/hr-admin/settings', icon: <Settings />, label: 'HR Settings' },
          { href: '/hr-admin/departments', icon: <Building2 />, label: 'Departments' },
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
    <div className="hidden md:block fixed inset-y-0 left-0 w-[220px] z-50">
      <div className="flex h-full max-h-screen flex-col gap-2 border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-8" />
            <span className="text-sm">HR Panel</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4">
          {renderNav()}
        </ScrollArea>
        <div className="mt-auto p-4">
           <Link
              href="/hr-admin/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive('/hr-admin/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
        </div>
      </div>
    </div>
  );
}

