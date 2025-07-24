
'use client';

import type { Dispatch, SetStateAction } from 'react';
import React, from 'react';
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
import { Home, ArrowRightLeft, Settings, LogOut, Send, Wallet, CreditCard, HelpCircle, HandCoins, ShieldCheck, Ticket, ShieldAlert, Puzzle, Store, Search as SearchIcon } from 'lucide-react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { LanguageSwitcher } from './language-switcher';
import { TooltipProvider } from './ui/tooltip';
import { Button } from './ui/button';
import { NotificationDropdown } from './notification-dropdown';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ProtectRoute, useAuth } from '@/hooks/use-auth';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';


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


  React.useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      setScrolled(mainEl.scrollTop > 10);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

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

  const mainNavItems = [
    { href: '/dashboard', icon: <Home />, label: 'Dashboard' },
    { href: '/dashboard/payments', icon: <Send />, label: 'Payments' },
    { href: '/dashboard/transactions', icon: <ArrowRightLeft />, label: 'Transactions' },
    { href: '/dashboard/wallets', icon: <Wallet />, label: 'Wallets' },
    { href: '/dashboard/cards', icon: <CreditCard />, label: 'Virtual Cards' },
  ];
  
  const collectPaymentItems = [
    { href: '/dashboard/request-payment', icon: <HandCoins />, label: 'Request' },
    { href: '/dashboard/terminal', icon: <Store />, label: 'Terminal', comingSoon: true },
    { href: '/dashboard/dispute', icon: <ShieldAlert />, label: 'Dispute Center' },
    { href: '/dashboard/integrations', icon: <Puzzle />, label: 'Integrations' },
    { href: '/dashboard/escrow', icon: <ShieldCheck />, label: 'Escrow', comingSoon: false, isNew: true },
  ];

  const isActive = (href: string) => {
    // Special handling for request-payment and its sub-routes if any in future
    if (href === '/dashboard/request-payment') {
        return pathname.startsWith('/dashboard/request-payment');
    }
     if (href === '/dashboard/support') {
        return pathname.startsWith('/dashboard/support');
    }
     if (href === '/dashboard/business') {
        return pathname.startsWith('/dashboard/business');
    }
    // Updated logic to handle the dispute page correctly
    if (href === '/dashboard/dispute') {
        return pathname.startsWith('/dashboard/dispute');
    }
    if (href === '/dashboard/escrow') {
        return pathname.startsWith('/dashboard/escrow');
    }
    return pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');
  }

  return (
    <ProtectRoute>
      <SidebarProvider>
        <TooltipProvider>
        <Sidebar>
          <SidebarHeader className="h-14 lg:h-[60px] flex items-center px-4 border-b">
            <Link href="/" className="flex items-center justify-center">
              <Icons.logo className="h-10" />
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
                 <div className="mt-4 p-3 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-semibold">Are you a Business Owner, Startup Founder or Venture Capitalist?</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Have access to our comprehensive suite of tools.</p>
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/dashboard/business">Get Started</Link>
                    </Button>
                 </div>
            </SidebarGroup>
          </SidebarContent>
           <SidebarFooter className="p-2 mt-auto flex-col gap-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
            <div className="flex w-full items-center justify-between p-1 rounded-md group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1">
                <div className="flex gap-1 group-data-[collapsible=icon]:flex-col">
                    <SidebarMenuButton asChild size="sm" variant="ghost" className="group-data-[collapsible=icon]:size-8" tooltip="Settings">
                        <Link href="/dashboard/settings">
                            <Settings />
                            <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </div>
                 <SidebarMenuButton size="sm" variant="ghost" className="group-data-[collapsible=icon]:size-8" onClick={handleLogout} tooltip="Logout">
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset ref={mainContentRef}>
            <header className={cn(
              "flex h-14 items-center gap-4 bg-background/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 transition-all",
              scrolled && "border-b shadow-sm"
              )}>
                <SidebarTrigger className="md:hidden" />
                <div className="w-full flex-1">
                   <div className="relative w-full max-w-sm">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search features, settings..." className="pl-9 bg-muted/50" />
                   </div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/support">
                        <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">Support</span>
                    </Link>
                    </Button>
                    <LanguageSwitcher selectedLanguage={language} setLanguage={setLanguage} />
                    <NotificationDropdown />
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
