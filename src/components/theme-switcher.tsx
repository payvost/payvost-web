
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so we can safely set the mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return null or a placeholder to avoid hydration mismatch
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-1 rounded-md border">
      <Button
        size="icon"
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        className="h-7 w-7"
        onClick={() => setTheme('light')}
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light Mode</span>
      </Button>
      <Button
        size="icon"
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        className="h-7 w-7"
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark Mode</span>
      </Button>
    </div>
  );
}
