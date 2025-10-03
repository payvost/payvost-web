
'use client';

import { useState, useEffect } from 'react';
import { CreateDonationPageForm } from './create-donation-page-form';
import { DonationPageListView } from './donation-page-list-view';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function DonationsTab() {
  const [view, setView] = useState('list');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const { user } = useAuth();
  const [isKycVerified, setIsKycVerified] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            setIsKycVerified(doc.data().kycStatus === 'Verified');
        }
    });
    return () => unsub();
  }, [user]);

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
        return <DonationPageListView onFabClick={handleCreate} onEditClick={handleEdit} isKycVerified={isKycVerified} />;
    }
  };

  return <>{renderContent()}</>;
}
