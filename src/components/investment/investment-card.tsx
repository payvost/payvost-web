
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, Calendar, TrendingUp, Shield } from 'lucide-react';
import type { InvestmentListing, InvestmentRiskLevel } from '@/types/investment';
import Image from 'next/image';
import { InvestNowModal } from './invest-now-modal';
import { cn } from '@/lib/utils';

interface InvestmentCardProps {
  listing: InvestmentListing;
}

const riskConfig: Record<InvestmentRiskLevel, { color: string, label: string }> = {
    Low: { color: 'bg-green-500/20 text-green-700 border-green-500/30', label: 'Low Risk' },
    Medium: { color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', label: 'Medium Risk' },
    High: { color: 'bg-red-500/20 text-red-700 border-red-500/30', label: 'High Risk' },
};


export function InvestmentCard({ listing }: InvestmentCardProps) {
  const risk = riskConfig[listing.riskLevel];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video w-full">
        <Image src={listing.image} alt={listing.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
        <Badge variant="secondary" className={cn("absolute top-2 right-2", risk.color)}>{risk.label}</Badge>
      </div>
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-1">{listing.category}</Badge>
        <CardTitle>{listing.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground">{listing.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="font-semibold">{listing.roi}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span className="font-semibold">{listing.duration}</span></div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
        <div>
            <p className="text-xs text-muted-foreground">Min. Investment</p>
            <p className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(listing.minInvestment)}</p>
        </div>
        <InvestNowModal listing={listing}>
            <Button>Invest Now</Button>
        </InvestNowModal>
      </CardFooter>
    </Card>
  );
}
