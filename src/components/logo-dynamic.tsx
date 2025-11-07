"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

// Dynamically import the logo component with no SSR to avoid hydration issues
export const LogoComponent = dynamic(() => import('./logo-component').then(mod => mod.LogoComponent), {
  ssr: false,
  loading: (props) => {
    const { style, className, ...rest } = (props ?? {}) as { style?: CSSProperties; className?: string } & Record<string, unknown>;

    return (
      <img
        {...rest}
        src="/payvost.png"
        alt="Payvost Logo"
        width={32}
        height={32}
        className={className}
        style={{ width: 'auto', height: '2rem', ...(style ?? {}) }}
      />
    );
  },
});
