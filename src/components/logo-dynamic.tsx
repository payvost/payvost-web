"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import Image from "next/image";

// Dynamically import the logo component with no SSR to avoid hydration issues
export const LogoComponent = dynamic(() => import('./logo-component').then(mod => mod.LogoComponent), {
  ssr: false,
  loading: (props) => {
    // Only pick safe props and avoid forwarding unknown props (e.g., isLoading, pastDelay) to DOM
    const { style, className } = (props ?? {}) as { style?: CSSProperties; className?: string };
    
    // Use consistent aspect ratio to prevent layout shift (average of both logos)
    // Light: 441/114 ≈ 3.868, Dark: 678/184 ≈ 3.684, use ~3.77 as average
    const aspectRatio = 3.77;

    return (
      <div 
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: 'auto',
          aspectRatio: `${aspectRatio}`,
          ...(style ?? {}),
        }}
      >
        <Image
          src="/payvost.png"
          alt="Payvost Logo"
          width={441}
          height={114}
          priority
          className="h-full w-auto object-contain"
          style={{ 
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>
    );
  },
});
