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
  
  // Use fixed aspect ratio to prevent layout shift when switching between logos
  // Light: 441/114 ≈ 3.868, Dark: 678/184 ≈ 3.685, use average ~3.77 for consistency
  const FIXED_ASPECT_RATIO = 3.77;

  const { className, style, ...rest } = props as {
    className?: string;
    style?: React.CSSProperties;
  } & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'className' | 'style'>;

  return (
    <div 
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'auto',
        aspectRatio: `${FIXED_ASPECT_RATIO}`,
        ...style,
      }}
    >
      <Image
        src={logoSrc}
        alt="Payvost Logo"
        width={dimensions.width}
        height={dimensions.height}
        className="h-full w-auto object-contain"
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
        }}
        {...rest}
      />
    </div>
  );
}
