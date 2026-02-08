'use client';

import { ReferralDashboard } from '@/components/referral-dashboard';

export default function ReferralsPage() {
  return (
    <>
      <main className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground mt-1">
            Share your referral code and earn rewards when friends join and complete transactions
          </p>
        </div>
        <ReferralDashboard />
      </main>
    </>
  );
}

