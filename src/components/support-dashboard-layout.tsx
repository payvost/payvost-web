'use client';

import React from 'react';
import { SupportSidebar } from '@/components/support-sidebar';
import { SupportHeader } from '@/components/support-header';
import { useAuth } from '@/hooks/use-auth';
import useAutoLogout from '@/hooks/use-auto-logout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SupportDashboardLayout({
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
            fetch('/api/auth/support-session', { method: 'DELETE' }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
          ]);
        } catch (error) {
          console.error('Session deletion error:', error);
        }
      }
      
      toast({
        title: "Logged Out",
        description: isOnline 
          ? "You have been successfully logged out."
          : "You have been logged out. Please reconnect to complete the logout process.",
      });
      
      router.push('/customer-support-W19KouHGlew7_jf2ds/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
      });
      router.push('/customer-support-W19KouHGlew7_jf2ds/login');
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
      <SupportSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-64">
        <SupportHeader onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}

