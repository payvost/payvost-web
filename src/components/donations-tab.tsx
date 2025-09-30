'use client';

import { useState } from 'react';
import { CreateDonationPageForm } from './create-donation-page-form';
import { DonationPageListView } from './donation-page-list-view';

export function DonationsTab() {
  const [view, setView] = useState('list');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const handleEdit = (campaignId: string) => {
    setEditingCampaignId(campaignId);
    setView('create'); // Reuse the create form for editing
  };

  const handleBack = () => {
    setView('list');
    setEditingCampaignId(null);
  };
  
  const handleCreate = () => {
    setEditingCampaignId(null);
    setView('create');
  }

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateDonationPageForm onBack={handleBack} campaignId={editingCampaignId} />;
      case 'list':
      default:
        return <DonationPageListView onFabClick={handleCreate} onEditClick={handleEdit} />;
    }
  };

  return <>{renderContent()}</>;
}
