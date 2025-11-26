
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Apple, Smartphone } from "lucide-react";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";

const GooglePlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
      <path fill="#4caf50" d="M239.5 256L96.5 416l256-160z"/>
      <path fill="#2196f3" d="M410.2 284.1l-102-61.5L96.5 96l143 160z"/>
      <path fill="#ffc107" d="M308.2 222.6L96.5 96l-32.2 36.5L256 256z"/>
      <path fill="#f44336" d="M96.5 416l143-160-123.6 156.3z"/>
    </svg>
);


export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
           <div className="flex flex-col items-center">
                 <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Get the Full Payvost Experience
                </h1>
                <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                    For the best performance, security, and features, please download our mobile app. The web version is optimized for desktop use.
                </p>

                <div className="mt-8 flex justify-center items-center gap-4 w-full max-w-md mx-auto px-4 sm:px-0">
                    <Link href="#" className="inline-block">
                        <Image src="/App Store.png" alt="Download on the App Store" width={160} height={54} className="h-12 w-auto sm:h-14" />
                    </Link>
                    <Link href="#" className="inline-block">
                        <Image src="/Google Play (2).png" alt="Get it on Google Play" width={160} height={54} className="h-12 w-auto sm:h-14" />
                    </Link>
                </div>

                <div className="mt-12">
                    <Image 
                        src="/optimized/dashboard mockup.jpg"
                        alt="Payvost Dashboard Mockup"
                        width={600}
                        height={450}
                        className="rounded-lg shadow-2xl"
                        data-ai-hint="app dashboard"
                    />
                </div>
                
            </div>
        </main>
    </div>
  );
}
