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
            label: 'Send',
            icon: <ArrowUpRight className="h-4 w-4" />,
            tone: 'border-primary/20 bg-primary/5 text-primary',
            iconTone: 'bg-primary/10 text-primary',
            onClick: () => setOpen(true),
            href: undefined,
        },
        {
            label: 'Request',
            icon: <ArrowDownLeft className="h-4 w-4" />,
            tone: 'border-blue-500/20 bg-blue-500/5 text-blue-700',
            iconTone: 'bg-blue-500/10 text-blue-700',
            href: '/dashboard/request-payment',
        },
        {
            label: 'Pay bills',
            icon: <RefreshCw className="h-4 w-4" />,
            tone: 'border-orange-500/20 bg-orange-500/5 text-orange-700',
            iconTone: 'bg-orange-500/10 text-orange-700',
            href: '/dashboard/payments',
        },
        {
            label: 'Add funds',
            icon: <PlusCircle className="h-4 w-4" />,
            tone: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700',
            iconTone: 'bg-emerald-500/10 text-emerald-700',
            href: '/dashboard/wallets',
        },
    ];

    return (
        <Card className="border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick actions</CardTitle>
                <CardDescription className="text-xs">Shortcuts to your most common flows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    {actions.map((action) => {
                        const content = (
                            <>
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${action.iconTone}`}>
                                    {action.icon}
                                </span>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-semibold">{action.label}</p>
                                    <p className="hidden sm:block truncate text-[11px] text-muted-foreground">
                                        Uses your live balance.
                                    </p>
                                </div>
                            </>
                        );

                        if (action.href) {
                            return (
                                <Button
                                    key={action.label}
                                    asChild
                                    variant="outline"
                                    className={`h-auto w-full min-w-0 justify-start gap-3 rounded-lg border p-3 ${action.tone}`}
                                    disabled={!isKycVerified}
                                >
                                    <Link href={action.href} className="flex w-full min-w-0 items-center gap-3">
                                        {content}
                                    </Link>
                                </Button>
                            );
                        }

                        return (
                            <Button
                                key={action.label}
                                variant="outline"
                                className={`h-auto w-full min-w-0 justify-start gap-3 rounded-lg border p-3 ${action.tone}`}
                                onClick={action.onClick}
                                disabled={!isKycVerified}
                            >
                                {content}
                            </Button>
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
