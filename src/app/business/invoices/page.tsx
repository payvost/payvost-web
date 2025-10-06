
'use client';

import { useState, useEffect } from 'react';
import { CreateBusinessInvoiceForm } from '@/components/create-business-invoice-form';
import { BusinessInvoiceListView } from '@/components/business-invoice-list-view';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusinessInvoicesPage() {
  const [view, setView] = useState('list');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const { user } = useAuth();
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            setIsKycVerified(doc.data().kycStatus === 'Verified');
        }
        setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleCreateClick = () => {
    setEditingInvoiceId(null);
    setView('create');
  };

  const handleEditClick = (invoiceId: string) => {
    setEditingInvoiceId(invoiceId);
    setView('create');
  };

  const handleBack = () => {
    setEditingInvoiceId(null);
    setView('list');
  };

  const renderContent = () => {
    if (loading) {
        return <Skeleton className="h-96 w-full" />
    }
      
    switch (view) {
      case 'create':
        return <CreateBusinessInvoiceForm onBack={handleBack} invoiceId={editingInvoiceId} />;
      case 'list':
      default:
        return <BusinessInvoiceListView onCreateClick={handleCreateClick} onEditClick={handleEditClick} isKycVerified={isKycVerified} />;
    }
  };

  return <>{renderContent()}</>;
}
