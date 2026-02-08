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
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { ChevronDown, Settings } from 'lucide-react';
import type { LanguagePreference } from '@/types/language';
import { LanguageSwitcher } from './language-switcher';
import { Button } from './ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ProtectRoute, useAuth } from '@/hooks/use-auth';
import useAutoLogout from '@/hooks/use-auto-logout';
import { Badge } from './ui/badge';
import { DashboardHeader } from '@/components/dashboard-header';
import { DASHBOARD_NAV, type DashboardNavItem } from '@/config/dashboard-nav';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCapabilities } from '@/hooks/use-capabilities';
import { GatedActionModal, type GatedActionModalState } from '@/components/gated-action-modal';


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
  const { capabilities } = useCapabilities();
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const [gatedModal, setGatedModal] = useState<GatedActionModalState>({
    open: false,
    title: '',
    description: '',
  });


  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      setScrolled(mainEl.scrollTop > 10);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (href: string) => {
    // Exact match for parent routes, prefix match for others.
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  const isItemActive = (item: DashboardNavItem): boolean => {
    if (isActive(item.href)) return true;
    return Boolean(item.children?.some(isItemActive));
  };

  const paymentsItem = DASHBOARD_NAV.flatMap((s) => s.items).find((i) => i.label === 'Payments' && i.children);
  const paymentsActive = paymentsItem ? isItemActive(paymentsItem) : false;
  const [paymentsOpen, setPaymentsOpen] = useState<boolean>(paymentsActive || pathname === '/dashboard');

  useEffect(() => {
    if (paymentsActive) setPaymentsOpen(true);
  }, [paymentsActive]);

  useEffect(() => {
    // On initial dashboard landing, keep Payments expanded by default.
    if (pathname === '/dashboard') setPaymentsOpen(true);
  }, [pathname]);

  const openGatedModal = (opts: { title: string; description: string; resolveHref?: string }) => {
    setGatedModal({
      open: true,
      title: opts.title,
      description: opts.description,
      primaryHref: opts.resolveHref,
      primaryLabel: opts.resolveHref ? 'Complete verification' : undefined,
      secondaryHref: '/dashboard/support',
      secondaryLabel: 'Contact support',
    });
  };

  const renderNavItem = (item: DashboardNavItem) => {
    const Icon = item.icon;
    const active = isItemActive(item);

    // Parent item with submenu (only used for Payments right now).
    if (item.children?.length) {
      return (
        <Collapsible key={item.href} open={paymentsOpen} onOpenChange={setPaymentsOpen}>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={active}
              tooltip={item.label}
              onClick={() => setPaymentsOpen((prev) => !prev)}
              data-tracking-id={item.trackingId}
            >
              <Icon strokeWidth={2.5} />
              <span>{item.label}</span>
            </SidebarMenuButton>

            <CollapsibleTrigger asChild>
              <SidebarMenuAction
                aria-label={paymentsOpen ? 'Collapse Payments' : 'Expand Payments'}
                className="group-data-[collapsible=icon]:hidden"
              >
                <ChevronDown className={paymentsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </SidebarMenuAction>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none group-data-[collapsible=icon]:hidden">
              <SidebarMenuSub>
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const cap = child.capabilityKey ? capabilities[child.capabilityKey] : { enabled: true };
                  const disabled = Boolean(child.capabilityKey && !cap.enabled);
                  const reason = cap.reason || 'Not available for your account.';

                  if (disabled) {
                    return (
                      <SidebarMenuSubItem key={child.href}>
                        <SidebarMenuSubButton
                          isActive={isItemActive(child)}
                          className="opacity-60"
                          title={reason}
                          onClick={(e) => {
                            e.preventDefault();
                            openGatedModal({
                              title: `${child.label} is unavailable`,
                              description: reason,
                              resolveHref: cap.resolveHref,
                            });
                          }}
                          data-tracking-id={child.trackingId}
                        >
                          <ChildIcon strokeWidth={2.5} />
                          <span>{child.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  }

                  return (
                    <SidebarMenuSubItem key={child.href}>
                      <SidebarMenuSubButton asChild isActive={isItemActive(child)}>
                        <Link href={child.href} data-tracking-id={child.trackingId}>
                          <ChildIcon strokeWidth={2.5} />
                          <span>{child.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    const cap = item.capabilityKey ? capabilities[item.capabilityKey] : { enabled: true };
    const disabled = Boolean(item.capabilityKey && !cap.enabled);
    const reason = cap.reason || 'Not available for your account.';

    if (disabled) {
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            isActive={active}
            tooltip={reason}
            className="opacity-60"
            title={reason}
            onClick={(e) => {
              e.preventDefault();
              openGatedModal({ title: `${item.label} is unavailable`, description: reason, resolveHref: cap.resolveHref });
            }}
            data-tracking-id={item.trackingId}
          >
            <Icon strokeWidth={2.5} />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
          <Link href={item.href} data-tracking-id={item.trackingId}>
            <Icon strokeWidth={2.5} />
            <span>{item.label}</span>
            {item.badge?.type === 'new' ? (
              <Badge className="ml-auto bg-primary text-primary-foreground px-1.5 py-0 text-[10px] leading-tight font-semibold h-4 group-data-[collapsible=icon]:hidden">
                {item.badge.label || 'New'}
              </Badge>
            ) : null}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

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
            {DASHBOARD_NAV.map((section, idx) => (
              <React.Fragment key={section.label}>
                <SidebarGroup>
                  <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                  <SidebarMenu>{section.items.map(renderNavItem)}</SidebarMenu>
                </SidebarGroup>
                {idx < DASHBOARD_NAV.length - 1 ? <SidebarSeparator /> : null}
              </React.Fragment>
            ))}
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
                <LanguageSwitcher selectedLanguage={language} setLanguage={setLanguage} />
              </>
            }
          />
          <ErrorBoundary>{children}</ErrorBoundary>
        </SidebarInset>
      </SidebarProvider>

      <GatedActionModal
        state={gatedModal}
        onOpenChange={(open) => setGatedModal((prev) => ({ ...prev, open }))}
      />
    </ProtectRoute>
  );
}
