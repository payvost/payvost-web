'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { MoreVertical, Copy, Eye, EyeOff, Snowflake, Power, Settings } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { CardSummary, RevealCardResponse } from '@/types/cards-v2';
import { revealCard } from '@/services/cardsService';

function formatExpiry(card: CardSummary) {
  if (!card.expMonth || !card.expYear) return '**/**';
  return `${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}`;
}

export function VirtualCard(props: {
  card: CardSummary;
  onFreezeToggle?: (card: CardSummary) => void;
  onTerminate?: (card: CardSummary) => void;
  onOpenControls?: (card: CardSummary) => void;
}) {
  const { toast } = useToast();
  const [revealing, setRevealing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [reveal, setReveal] = useState<RevealCardResponse | null>(null);

  const maskedNumber = useMemo(() => `**** **** **** ${props.card.last4}`, [props.card.last4]);
  const displayPan = showDetails ? (reveal?.pan || maskedNumber) : maskedNumber;
  const displayExpiry = showDetails ? (reveal?.expMonth && reveal?.expYear ? `${String(reveal.expMonth).padStart(2, '0')}/${String(reveal.expYear).slice(-2)}` : formatExpiry(props.card)) : formatExpiry(props.card);
  const displayCvv = showDetails ? (reveal?.cvv || '***') : '***';

  useEffect(() => {
    if (!reveal?.expiresAt) return;
    const ms = new Date(reveal.expiresAt).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return;
    const t = setTimeout(() => {
      setShowDetails(false);
      setReveal(null);
    }, ms);
    return () => clearTimeout(t);
  }, [reveal?.expiresAt]);

  const handleReveal = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }

    try {
      setRevealing(true);
      const resp = await revealCard(props.card.id, { reason: 'user_initiated' });
      setReveal(resp);
      setShowDetails(true);
    } catch (error: any) {
      const msg = String(error?.message || '');
      // apiClient normalizes errors; backend returns 403 for step-up requirement.
      toast({
        title: 'Unable to reveal card',
        description: msg.includes('Recent authentication')
          ? 'For security, please re-authenticate and try again.'
          : 'Card details are not available right now.',
        variant: 'destructive',
      });
    } finally {
      setRevealing(false);
    }
  };

  const copyPan = async () => {
    if (!reveal?.pan) return;
    await navigator.clipboard.writeText(reveal.pan);
    toast({ title: 'Copied', description: 'Card number copied to clipboard.' });
  };

  const statusBadge =
    props.card.status === 'ACTIVE'
      ? 'bg-green-500/80 border-transparent text-white'
      : props.card.status === 'FROZEN'
        ? 'bg-blue-400/80 border-transparent text-white'
        : 'bg-red-500/80 border-transparent text-white';

  return (
    <div className="[perspective:1000px]">
      <div className={cn('relative h-56 w-full rounded-lg text-white shadow-lg bg-gradient-to-br from-slate-800 to-slate-950')}>
        <div className="p-6 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{props.card.label}</h3>
              <Badge className={cn('mt-1 capitalize', statusBadge)}>{props.card.status.toLowerCase()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {props.card.network === 'VISA' ? (
                <Image src="/visa.png" alt="Visa" width={49} height={16} />
              ) : (
                <Image src="/mastercard.png" alt="Mastercard" width={60} height={36} />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-white hover:bg-white/20">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={props.card.status === 'TERMINATED'} onClick={() => props.onFreezeToggle?.(props.card)}>
                    <Snowflake className="mr-2 h-4 w-4" />
                    {props.card.status === 'ACTIVE' ? 'Freeze Card' : 'Unfreeze Card'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => props.onOpenControls?.(props.card)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Controls
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" disabled={props.card.status === 'TERMINATED'} onClick={() => props.onTerminate?.(props.card)}>
                    <Power className="mr-2 h-4 w-4" />
                    Terminate Card
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-1">
              <div className="text-lg font-mono tracking-widest">{displayPan.replace(/(.{4})/g, '$1 ').trim()}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={handleReveal}
                disabled={revealing || props.card.status === 'TERMINATED'}
                title="Reveal card details"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={copyPan}
                disabled={!showDetails || !reveal?.pan}
                title="Copy card number"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs">Expires: {displayExpiry}</p>
                <p className="text-xs">CVV: {displayCvv}</p>
              </div>
              <div className="text-right">
                <p className="text-xs">Currency</p>
                <p className="text-2xl font-bold font-mono">{props.card.currency}</p>
              </div>
            </div>
            {showDetails && reveal?.expiresAt && (
              <p className="mt-2 text-[11px] opacity-80">
                Details will auto-hide at {new Date(reveal.expiresAt).toLocaleTimeString()}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

