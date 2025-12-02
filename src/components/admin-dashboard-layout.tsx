'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import { useAuth } from '@/hooks/use-auth';
import useAutoLogout from '@/hooks/use-auto-logout';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    try {
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
        }
      }
      
      toast({
        title: "Logged Out",
        description: isOnline 
          ? "You have been successfully logged out."
          : "You have been logged out. Please reconnect to complete the logout process.",
      });
      
      router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
      });
      router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login');
    }
  };

  // Auto-logout after 3 minutes of inactivity
  useAutoLogout({
    timeoutMs: 3 * 60 * 1000,
    onTimeout: () => {
      if (user) handleLogout();
    },
    enabled: Boolean(user),
  });

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-[280px]">
        <AdminHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
