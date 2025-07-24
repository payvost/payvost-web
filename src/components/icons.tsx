import type { LucideProps } from "lucide-react";
import Image from "next/image";

export const Icons = {
  logo: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
      src="/Payvost.png"
      alt="Payvost Logo"
      width={110}
      height={150}
      {...props}
    />
  ),
};
