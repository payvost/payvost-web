
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, ArrowDownLeft, Plus, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface WalletCardProps {
  currency: string;
  name: string;
  balance: string;
  flag: string;
}

const availableFlags = ['us', 'eu', 'gb', 'ng', 'jp'];

export function WalletCard({ currency, name, balance, flag }: WalletCardProps) {
  const hasFlag = availableFlags.includes(flag.toLowerCase());
  const flagPath = hasFlag ? `/flags/${flag.toUpperCase()}.png` : `https://placehold.co/40x40.png`;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="relative h-10 w-10">
            <Image
                src={flagPath}
                alt={`${name} flag`}
                fill
                sizes="40px"
                className="rounded-full object-cover"
                data-ai-hint={!hasFlag ? 'logo icon' : undefined}
            />
        </div>
        <div>
          <CardTitle className="text-lg">{currency} Wallet</CardTitle>
          <CardDescription>{name}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-3xl font-bold">{balance}</div>
        <div className="text-sm text-muted-foreground">{currency}</div>
        <div className="flex items-center mt-4 gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ArrowDownLeft className="h-4 w-4" />
                  <span className="sr-only">Receive</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Receive</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Fund</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fund</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="#">
            View Wallet
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
