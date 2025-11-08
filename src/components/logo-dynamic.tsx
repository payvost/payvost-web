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

    return (
      <Image
        src="/payvost.png"
        alt="Payvost Logo"
        width={441}
        height={114}
        priority
        className={className}
        style={{ width: 'auto', height: 'auto', ...(style ?? {}) }}
      />
    );
  },
});
