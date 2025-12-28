'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SendMoneyWizard } from './SendMoneyWizard';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, PlusCircle, PieChart } from 'lucide-react';

export function QuickActions({ isKycVerified }: { isKycVerified: boolean }) {
    const [open, setOpen] = useState(false);

    const actions = [
        {
            label: 'Send',
            icon: <ArrowUpRight className="h-4 w-4" />,
            color: 'bg-primary/10 text-primary',
            action: () => setOpen(true),
            disabled: !isKycVerified
        },
        {
            label: 'Request',
            icon: <ArrowDownLeft className="h-4 w-4" />,
            color: 'bg-blue-500/10 text-blue-500',
            disabled: !isKycVerified
        },
        {
            label: 'Swap',
            icon: <RefreshCw className="h-4 w-4" />,
            color: 'bg-orange-500/10 text-orange-500',
            disabled: !isKycVerified
        },
        {
            label: 'Add',
            icon: <PlusCircle className="h-4 w-4" />,
            color: 'bg-green-500/10 text-green-500',
            disabled: !isKycVerified
        },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <CardDescription className="text-xs">Transfer and manage funds easily.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-2">
                    {actions.map((action) => (
                        <div key={action.label} className="flex flex-col items-center gap-1">
                            <Button
                                variant="secondary"
                                size="icon"
                                className={`rounded-full h-10 w-10 ${action.color}`}
                                onClick={action.action}
                                disabled={action.disabled}
                            >
                                {action.icon}
                            </Button>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{action.label}</span>
                        </div>
                    ))}
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[450px] p-6">
                        <SendMoneyWizard onComplete={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
