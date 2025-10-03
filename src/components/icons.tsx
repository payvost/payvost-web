// src/components/icons.tsx
'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import type { LucideProps } from 'lucide-react';
import { useEffect, useState } from 'react';

const Logo = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;

  if (!mounted) {
    // Render a placeholder or the default logo on the server to avoid hydration mismatch
    return (
      <Image
        src="/payvost.png"
        alt="Payvost Logo"
        width={110}
        height={150}
        style={{ width: 'auto' }}
        {...props}
      />
    );
  }

  const logoSrc = currentTheme === 'dark' ? '/Payvost White.png' : '/payvost.png';

  return (
    <Image
      src={logoSrc}
      alt="Payvost Logo"
      width={110}
      height={150}
      style={{ width: 'auto' }}
      priority
      {...props}
    />
  );
};

export const Icons = {
  logo: Logo,
};