'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SendMoneyWizard } from './SendMoneyWizard';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function QuickActions({ isKycVerified }: { isKycVerified: boolean }) {
    const [open, setOpen] = useState(false);

    const actions = [
        {
            label: 'Send money',
            icon: <ArrowUpRight className="h-4 w-4" />,
            color: 'from-primary/20 via-primary/10 to-primary/5 text-primary',
            onClick: () => setOpen(true),
            href: undefined,
        },
        {
            label: 'Request',
            icon: <ArrowDownLeft className="h-4 w-4" />,
            color: 'from-blue-500/20 via-blue-500/10 to-blue-500/5 text-blue-600',
            href: '/dashboard/request-payment',
        },
        {
            label: 'Swap/Pay bills',
            icon: <RefreshCw className="h-4 w-4" />,
            color: 'from-orange-500/20 via-orange-500/10 to-orange-500/5 text-orange-600',
            href: '/dashboard/payments',
        },
        {
            label: 'Add funds',
            icon: <PlusCircle className="h-4 w-4" />,
            color: 'from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 text-emerald-600',
            href: '/dashboard/wallets',
        },
    ];

    return (
        <Card className="border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick actions</CardTitle>
                <CardDescription className="text-xs">Stripe-style shortcuts that stay in sync with your account state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    {actions.map((action) => {
                        const button = (
                            <Button
                                key={action.label}
                                variant="secondary"
                                size="lg"
                                className={`justify-start gap-3 rounded-xl bg-gradient-to-br ${action.color}`}
                                onClick={action.onClick}
                                disabled={!isKycVerified}
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/60 text-slate-900">
                                    {action.icon}
                                </span>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{action.label}</p>
                                    <p className="text-[11px] text-muted-foreground">Runs immediately with your live balances.</p>
                                </div>
                            </Button>
                        );

                        return action.href ? (
                            <Link key={action.label} href={action.href}>
                                {button}
                            </Link>
                        ) : (
                            button
                        );
                    })}
                </div>
                {!isKycVerified && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Finish KYC to enable quick actions.
                    </p>
                )}

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[480px] p-6">
                        <SendMoneyWizard onComplete={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
