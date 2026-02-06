'use client';

import Image from "next/image";

type LogoProps = Omit<React.ComponentProps<typeof Image>, "src" | "alt" | "width" | "height"> & {
  className?: string;
  style?: React.CSSProperties;
};

export function LogoComponent(props: LogoProps) {
  // Keep a stable box; let CSS `dark:` decide which asset is visible.
  // This avoids a mount-time src swap (often perceived as a "bulge" on load/reload).
  const FIXED_ASPECT_RATIO = 3.77;

  const { className, style, priority, ...rest } = props;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "auto",
        aspectRatio: `${FIXED_ASPECT_RATIO}`,
        ...(style ?? {}),
      }}
    >
      <Image
        src="/payvost.png"
        alt="Payvost Logo"
        width={678}
        height={184}
        priority={priority ?? true}
        className="h-full w-auto object-contain dark:hidden"
        style={{ height: "100%", width: "auto", objectFit: "contain" }}
        {...rest}
      />
      <Image
        src="/Payvost White.png"
        alt="Payvost Logo"
        width={678}
        height={184}
        priority={priority ?? true}
        className="hidden h-full w-auto object-contain dark:block"
        style={{ height: "100%", width: "auto", objectFit: "contain" }}
        {...rest}
      />
    </span>
  );
}

