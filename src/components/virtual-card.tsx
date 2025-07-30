
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { cn } from '@/lib/utils';
import { MoreVertical, Copy, Eye, EyeOff, DollarSign, Snowflake, Power } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import Image from 'next/image';
import type { VirtualCardData, CardTheme } from '@/types/virtual-card';

const themeClasses: Record<CardTheme, string> = {
  blue: 'from-blue-500 to-indigo-600 text-white',
  purple: 'from-purple-500 to-violet-600 text-white',
  green: 'from-green-500 to-teal-600 text-white',
  black: 'from-gray-800 to-black text-white',
};

export function VirtualCard({ card }: { card: VirtualCardData }) {
  const [showDetails, setShowDetails] = useState(false);
  const isCredit = card.cardModel === 'credit';
  const displayAmount = isCredit ? (card.availableCredit ?? 0) : card.balance;
  const displayLabel = isCredit ? 'Available Credit' : 'Balance';

  return (
    <div className="[perspective:1000px]">
        <div
            className={cn(
                "relative h-56 w-full rounded-lg text-white shadow-lg bg-gradient-to-br",
                themeClasses[card.theme]
            )}
        >
            <div className="p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold">{card.cardLabel}</h3>
                        <Badge
                            variant={card.status === 'active' ? 'default' : card.status === 'frozen' ? 'secondary' : 'destructive'}
                            className={cn("mt-1 capitalize",
                                card.status === 'active' ? 'bg-green-500/80 border-transparent' :
                                card.status === 'frozen' ? 'bg-blue-400/80 border-transparent' :
                                'bg-red-500/80 border-transparent'
                            )}
                        >
                            {card.status}
                        </Badge>
                    </div>
                     <div className="flex items-center gap-2">
                        {card.cardType === 'visa' ? <Image src="/visa.png" alt="Visa" width={49} height={16} /> : <Image src="/mastercard.png" alt="Mastercard" width={60} height={36} />}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-white hover:bg-white/20"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem><Snowflake className="mr-2 h-4 w-4"/>Freeze Card</DropdownMenuItem>
                                <DropdownMenuItem><DollarSign className="mr-2 h-4 w-4"/>Fund Card</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive"><Power className="mr-2 h-4 w-4"/>Terminate Card</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-4 mb-1">
                        <div className="text-lg font-mono tracking-widest">
                           {showDetails ? card.fullNumber.replace(/(.{4})/g, '$1 ').trim() : `•••• •••• •••• ${card.last4}`}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setShowDetails(s => !s)}>{showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => navigator.clipboard.writeText(card.fullNumber)}><Copy className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs">Expires: {showDetails ? card.expiry : '••/••'}</p>
                            <p className="text-xs">CVV: {showDetails ? card.cvv : '•••'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs">{displayLabel}</p>
                            <p className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(displayAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
