
'use client';

import { useState } from 'react';
import { CreateDonationPageForm } from './create-donation-page-form';
import { DonationPageListView } from './donation-page-list-view';

export function DonationsTab() {
  const [view, setView] = useState('list');

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateDonationPageForm onBack={() => setView('list')} />;
      case 'list':
      default:
        return <DonationPageListView onFabClick={() => setView('create')} />;
    }
  };

  return <>{renderContent()}</>;
}
