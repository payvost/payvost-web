
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Apple, Smartphone } from "lucide-react";
import Image from "next/image";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-center">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent"></div>
       <div className="relative z-10 flex flex-col items-center">
            <Icons.logo className="h-20" />
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Get the Full Payvost Experience
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                For the best performance, security, and features, please download our mobile app. The web version is optimized for desktop use.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto h-14 text-base">
                   <Apple className="mr-3 h-7 w-7" />
                    <div>
                        <p className="text-xs text-left">Download on the</p>
                        <p className="font-semibold text-lg">App Store</p>
                    </div>
                </Button>
                 <Button size="lg" className="w-full sm:w-auto h-14 text-base">
                    <GooglePlayIcon className="mr-3 h-7 w-7" />
                    <div>
                        <p className="text-xs text-left">GET IT ON</p>
                        <p className="font-semibold text-lg">Google Play</p>
                    </div>
                </Button>
            </div>
            
            <div className="mt-12 relative w-full max-w-lg">
                <Image
                    src="https://placehold.co/800x600.png"
                    data-ai-hint="app screenshot"
                    alt="Payvost App Screenshot"
                    width={800}
                    height={600}
                    className="rounded-xl shadow-2xl"
                />
            </div>
        </div>
    </div>
  );
}
