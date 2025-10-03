
'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import type { ReactNode } from 'react';

function AutoLogoutManager() {
    useAutoLogout();
    return null;
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <AuthProvider>
                <AutoLogoutManager />
                {children}
            </AuthProvider>
        </ThemeProvider>
    )
}
