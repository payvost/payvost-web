
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Send, ArrowDownLeft, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';


interface CurrencyCardProps {
  currency: string;
  balance: string;
  growth: string;
  flag: string;
}

const availableFlags = ['US', 'EU', 'GB', 'NG', 'JP'];

export function CurrencyCard({ currency, balance, growth, flag }: CurrencyCardProps) {
  const upperCaseFlag = flag.toUpperCase();
  const flagPath = `/flag/${upperCaseFlag}.png`;

  return (
    <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
                <CardTitle className="text-sm font-medium">
                {currency} Balance
                </CardTitle>
                <div className="text-2xl font-bold">{balance}</div>
                 <div className="flex items-center mt-2 gap-1">
                    <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send</TooltipContent>
                     </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowDownLeft className="h-4 w-4" />
                                <span className="sr-only">Receive</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Receive</TooltipContent>
                     </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Fund</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fund</TooltipContent>
                     </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
             <div className="relative h-6 w-6">
                <Image 
                    src={flagPath}
                    alt={`${currency} flag`}
                    layout="fill" 
                    objectFit="cover" 
                    className="rounded-full"
                />
            </div>
        </CardHeader>
        <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">
                {growth}
            </p>
        </CardContent>
    </Card>
  )
}
