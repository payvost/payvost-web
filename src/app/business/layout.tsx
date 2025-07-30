'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { UserNav } from '@/components/user-nav';
import { Settings, LogOut, HelpCircle, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ProtectRoute, useAuth } from '@/hooks/use-auth';
import { BusinessSidebar } from '@/components/business-sidebar';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
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

  return (
    <ProtectRoute>
      <div className="min-h-screen w-full bg-muted/40">
        <BusinessSidebar />
        <div className="flex flex-col sm:pl-14 md:pl-[220px]">
           <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] sticky top-0 z-30 lg:px-6">
                <div className="w-full flex-1">
                    {/* Placeholder for potential header content like search */}
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard">
                           <User className="mr-2 h-4 w-4" />
                           Switch to Personal
                        </Link>
                    </Button>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/support">
                            <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">Support</span>
                        </Link>
                    </Button>
                    <UserNav user={user} />
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
              {children}
            </main>
        </div>
      </div>
    </ProtectRoute>
  );
}
