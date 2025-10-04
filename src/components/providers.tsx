
'use client';

import { AuthProvider } from '@/hooks/use-auth';
import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThemeProvider>
    )
}
