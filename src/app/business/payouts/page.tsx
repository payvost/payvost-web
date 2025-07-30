
'use client';

import React from 'react';
import { BusinessPayoutForm } from '@/components/business-payout-form';


export default function PayoutsPage() {

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Make a Payout</h2>
                <p className="text-muted-foreground">Send funds to recipients domestically or internationally.</p>
            </div>
            <BusinessPayoutForm />
        </div>
    );
}
