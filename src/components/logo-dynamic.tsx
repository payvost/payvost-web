"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

// Dynamically import the logo component with no SSR to avoid hydration issues
export const LogoComponent = dynamic(() => import('./logo-component').then(mod => mod.LogoComponent), {
  ssr: false,
  loading: (props) => {
    const { style, ...rest } = (props ?? {}) as { style?: CSSProperties } & Record<string, unknown>;

    return (
      <img
        {...rest}
        src="/payvost.png"
        alt="Payvost Logo"
        width={110}
        height={150}
        style={{ width: 'auto', ...(style ?? {}) }}
      />
    );
  },
});
