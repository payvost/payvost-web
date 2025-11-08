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
  
  // Different logos have different dimensions, use the larger one for better quality
  const dimensions = logoSrc.includes('White') ? { width: 678, height: 184 } : { width: 441, height: 114 };

  const { className, style, ...rest } = props as {
    className?: string;
    style?: React.CSSProperties;
  } & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'className' | 'style'>;

  return (
    <Image
      src={logoSrc}
      alt="Payvost Logo"
      width={dimensions.width}
      height={dimensions.height}
      // Let Tailwind height classes control the rendered size while preserving aspect ratio
      className={className}
      style={{
        width: 'auto',
        objectFit: 'contain',
        maxHeight: '100%',
        ...style,
      }}
      {...rest}
    />
  );
}
