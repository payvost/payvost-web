'use client';

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LogoComponent(props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use light logo as default during SSR to avoid hydration mismatch
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/Payvost White.png' : '/payvost.png';

  return (
    <Image
      src={logoSrc}
      alt="Payvost Logo"
      width={32}
      height={32}
      style={{ width: 'auto', height: '2rem' }}
      {...props}
    />
  );
}
