'use client';

import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { Home, ArrowRightLeft, Settings, Send, Wallet, CreditCard, HandCoins, ShieldCheck, ShieldAlert, Gift } from 'lucide-react';
import type { LanguagePreference } from '@/types/language';
import { LanguageSwitcher } from './language-switcher';
import { Button } from './ui/button';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ProtectRoute, useAuth } from '@/hooks/use-auth';
import useAutoLogout from '@/hooks/use-auto-logout';
import { Badge } from './ui/badge';
import { doc, onSnapshot } from 'firebase/firestore';
import { DashboardSwitcher } from './dashboard-switcher';
import { DashboardHeader } from '@/components/dashboard-header';


interface DashboardLayoutProps {
  children: React.ReactNode;
  language: LanguagePreference;
  setLanguage: Dispatch<SetStateAction<LanguagePreference>>;
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
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    try {
      // Try to sign out from Firebase if online
      if (isOnline) {
        try {
          await Promise.race([
            signOut(auth),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Sign out timeout')), 5000)
            )
          ]);
        } catch (error) {
          console.error('Firebase signOut error:', error);
          // Continue with local logout even if Firebase signOut fails
        }
      }

      // Always clear local session and redirect, even if offline or Firebase signOut fails
      // This ensures the user is logged out locally
      toast({
        title: "Logged Out",
        description: isOnline
          ? "You have been successfully logged out."
          : "You have been logged out. Please reconnect to complete the logout process.",
      });

      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to login to ensure logout
      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
      });
      router.push('/login');
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

  const overviewItems = [{ href: '/dashboard', icon: <Home strokeWidth={2.5} />, label: 'Dashboard' }];

  const moneyItems = [
    { href: '/dashboard/wallets', icon: <Wallet strokeWidth={2.5} />, label: 'Wallet' },
    { href: '/dashboard/payments', icon: <Send strokeWidth={2.5} />, label: 'Payments' },
    { href: '/dashboard/transactions', icon: <ArrowRightLeft strokeWidth={2.5} />, label: 'Transactions' },
    { href: '/dashboard/cards', icon: <CreditCard strokeWidth={2.5} />, label: 'Virtual Cards' },
  ];

  const getPaidAndProtectionItems = [
    { href: '/dashboard/request-payment', icon: <HandCoins strokeWidth={2.5} />, label: 'Requests' },
    { href: '/dashboard/escrow', icon: <ShieldCheck strokeWidth={2.5} />, label: 'Escrow', isNew: true },
    { href: '/dashboard/dispute', icon: <ShieldAlert strokeWidth={2.5} />, label: 'Disputes' },
  ];

  const perksItems = [{ href: '/dashboard/referrals', icon: <Gift strokeWidth={2.5} />, label: 'Referrals' }];

  const isActive = (href: string) => {
    // Exact match for parent routes, prefix match for others.
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <ProtectRoute>
      <SidebarProvider
        style={{ '--sidebar-width': '16rem' } as React.CSSProperties}
        className="relative before:content-[''] before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-[var(--app-header-height)] before:h-px before:bg-border/40 before:z-40"
      >
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="h-[var(--app-header-height)] flex-row items-center justify-between gap-2 p-0 px-3">
            <Link href="/" className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:hidden">
              <Icons.logo className="h-8 shrink-0" />
            </Link>
            <SidebarTrigger className="hidden md:inline-flex opacity-70 hover:opacity-100" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarMenu>
                {overviewItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Money</SidebarGroupLabel>
              <SidebarMenu>
                {moneyItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Requests & Protection</SidebarGroupLabel>
              <SidebarMenu>
                {getPaidAndProtectionItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href} className="flex items-center gap-2">
                        {item.icon}
                        <span className="flex items-center gap-1.5">
                          {item.label}
                          {item.isNew && (
                            <Badge className="bg-primary text-primary-foreground px-1.5 py-0 text-[10px] leading-tight font-semibold h-4">
                              New
                            </Badge>
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Perks</SidebarGroupLabel>
              <SidebarMenu>
                {perksItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {!isBusinessApproved && (
              <div className="mt-2 mx-2 p-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
                <p className="text-xs font-semibold">Need business tools?</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Invoicing, payouts, customers, and more.
                </p>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/dashboard/get-started">Get started</Link>
                </Button>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-border/40">
            <SidebarMenu className="w-full">
              <SidebarMenuItem className="w-full">
                <SidebarMenuButton asChild isActive={isActive('/dashboard/settings')} tooltip="Settings">
                  <Link href="/dashboard/settings">
                    <Settings strokeWidth={2.5} />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset ref={mainContentRef}>
          <DashboardHeader
            context="personal"
            user={user}
            scrolled={scrolled}
            rightSlot={
              <>
                {isBusinessApproved && <DashboardSwitcher />}
                <LanguageSwitcher selectedLanguage={language} setLanguage={setLanguage} />
              </>
            }
          />
          <ErrorBoundary>{children}</ErrorBoundary>
        </SidebarInset>
      </SidebarProvider>
    </ProtectRoute>
  );
}
