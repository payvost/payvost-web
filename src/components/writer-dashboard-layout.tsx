'use client';

import React from 'react';
import { WriterSidebar } from '@/components/writer-sidebar';
import { WriterHeader } from '@/components/writer-header';
import { useAuth } from '@/hooks/use-auth';
import useAutoLogout from '@/hooks/use-auto-logout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function WriterDashboardLayout({
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
            fetch('/api/auth/writer-session', { method: 'DELETE' }),
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
      
      router.push('/cms-9dj93abkD0ncfhDpLw_KIA/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
      });
      router.push('/cms-9dj93abkD0ncfhDpLw_KIA/login');
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
      <WriterSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-[280px]">
        <WriterHeader onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}

