
'use client';

import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { UserNav } from '@/components/user-nav';
import { Home, ArrowRightLeft, Settings, LogOut, Send, Wallet, CreditCard, HelpCircle, HandCoins, ShieldCheck, Ticket, ShieldAlert, Puzzle, Store, Search as SearchIcon, Briefcase, Bell, LifeBuoy, LineChart } from 'lucide-react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { LanguageSwitcher } from './language-switcher';
import { TooltipProvider } from './ui/tooltip';
import { Button } from './ui/button';
import { NotificationDropdown } from './notification-dropdown';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ProtectRoute, useAuth } from '@/hooks/use-auth';
import useAutoLogout from '@/hooks/use-auto-logout';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { ThemeSwitcher } from './theme-switcher';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { doc, onSnapshot } from 'firebase/firestore';
import { DashboardSwitcher } from './dashboard-switcher';


interface DashboardLayoutProps {
  children: React.ReactNode;
  language: GenerateNotificationInput['languagePreference'];
  setLanguage: Dispatch<SetStateAction<GenerateNotificationInput['languagePreference']>>;
}

export function DashboardLayout({ children, language, setLanguage }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const [isBusinessApproved, setIsBusinessApproved] = useState(false);


  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      setScrolled(mainEl.scrollTop > 10);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);
  
   useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const businessProfile = doc.data().businessProfile;
        // Check for both 'approved' (lowercase) and 'Approved' (capitalized) for compatibility
        if (businessProfile && (businessProfile.status === 'approved' || businessProfile.status === 'Approved')) {
          setIsBusinessApproved(true);
        } else {
          setIsBusinessApproved(false);
        }
      }
    });
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      })
      router.push('/login');
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive"
      })
    }
  };

  // Auto-logout after 3 minutes of inactivity (180000 ms).
  // We only enable it when there's an authenticated user.
  useAutoLogout({
    timeoutMs: 3 * 60 * 1000,
    onTimeout: () => {
      if (user) handleLogout();
    },
    enabled: Boolean(user),
  });

  const mainNavItems = [
    { href: '/dashboard', icon: <Home strokeWidth={2.5} />, label: 'Dashboard' },
    { href: '/dashboard/payments', icon: <Send strokeWidth={2.5} />, label: 'Payments' },
    { href: '/dashboard/transactions', icon: <ArrowRightLeft strokeWidth={2.5} />, label: 'Transactions' },
    { href: '/dashboard/wallets', icon: <Wallet strokeWidth={2.5} />, label: 'Wallets' },
    { href: '/dashboard/cards', icon: <CreditCard strokeWidth={2.5} />, label: 'Virtual Cards' },
  ];
  
  const collectPaymentItems = [
    { href: '/dashboard/request-payment', icon: <HandCoins strokeWidth={2.5} />, label: 'Request' },
    { href: '/dashboard/dispute', icon: <ShieldAlert strokeWidth={2.5} />, label: 'Dispute Center' },
    { href: '/dashboard/escrow', icon: <ShieldCheck strokeWidth={2.5} />, label: 'Escrow', comingSoon: false, isNew: true },
  ];

  const isActive = (href: string) => {
    // Exact match for parent routes, prefix match for others.
    if (href === '/dashboard') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <ProtectRoute>
      <SidebarProvider>
        <TooltipProvider>
        <Sidebar>
          <SidebarHeader className="h-12 lg:h-[52px] flex items-center px-4 border-b">
            <Link href="/" className="flex items-center justify-start">
              <Icons.logo className="h-8" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
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
                <SidebarGroupLabel>Collect Payment</SidebarGroupLabel>
                 <SidebarMenu>
                    {collectPaymentItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive(item.href)} disabled={item.comingSoon}>
                                <Link href={item.href} className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-2">
                                        {item.icon}
                                        {item.label}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {item.isNew && <Badge variant="default" className="text-xs">New</Badge>}
                                      {item.comingSoon && <Badge variant="secondary" className="text-xs">Soon</Badge>}
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                 </SidebarMenu>
                 </SidebarGroup>
                 <div className="mt-4 mx-2 p-3 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-semibold">Are you a Business Owner, Startup Founder or Venture Capitalist?</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Have access to our comprehensive suite of tools.</p>
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/dashboard/get-started">Get Started</Link>
                    </Button>
                 </div>
          </SidebarContent>
           <SidebarFooter className="p-2 mt-auto">
            <SidebarMenu className="w-full">
                <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuItem className="w-full">
                        <SidebarMenuButton asChild size="default" className="w-full justify-start gap-2" tooltip="Settings">
                            <Link href="/dashboard/settings">
                                <Settings />
                                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="default" className="justify-start gap-2" onClick={handleLogout} tooltip="Logout">
                            <LogOut />
                            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </div>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset ref={mainContentRef}>
            <header className={cn(
              "sticky top-0 z-30 flex h-14 items-center gap-4 bg-background/95 px-4 backdrop-blur-sm transition-all lg:h-[60px] lg:px-6",
              scrolled && "border-b shadow-sm"
              )}>
                <SidebarTrigger className="md:hidden" />
                <div className="w-full flex-1">
                  <div className="relative md:w-full md:max-w-sm">
                    <div className="md:hidden">
                       <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="icon">
                            <SearchIcon className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="top">
                          <SheetHeader>
                            <SheetTitle>Search</SheetTitle>
                          </SheetHeader>
                          <div className="relative mt-4">
                              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Search features, settings..." className="pl-9" />
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                    <div className="relative hidden md:block">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search features, settings..." className="pl-9 bg-muted/50" />
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {isBusinessApproved && <DashboardSwitcher />}
                    <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/support">
                        <LifeBuoy className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">Support</span>
                    </Link>
                    </Button>
                    <ThemeSwitcher />
                    <LanguageSwitcher selectedLanguage={language} setLanguage={setLanguage} />
                    <NotificationDropdown context="personal" />
                    <UserNav user={user} />
                </div>
            </header>
            {children}
        </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    </ProtectRoute>
  );
}
