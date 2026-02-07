'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Payvost } from '@/components/Payvost';
import { Beneficiaries } from '@/components/beneficiaries';

export default function PaymentsSendPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | undefined>();

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Send Money</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="lg:col-span-2">
            <Payvost initialBeneficiaryId={selectedBeneficiaryId} />
          </div>
          <div className="lg:col-span-1">
            <Beneficiaries
              onSelectBeneficiary={(id) => {
                setSelectedBeneficiaryId(id);
              }}
            />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

