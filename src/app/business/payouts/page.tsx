'use client';

import { BusinessPayoutForm } from '@/components/business-payout-form';

export default function PayoutsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Make a Payout</h2>
                    <p className="text-muted-foreground">Send funds to vendors, employees, or partners across the globe.</p>
                </div>
            </div>
            <BusinessPayoutForm />
        </>
    )
}
