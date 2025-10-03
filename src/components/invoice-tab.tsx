
'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CreateInvoicePage = dynamic(() => import('./create-invoice-page').then(mod => mod.CreateInvoicePage), {
    loading: () => <Skeleton className="h-96 w-full" />,
});

const InvoiceListView = dynamic(() => import('./invoice-list-view').then(mod => mod.InvoiceListView), {
    loading: () => <Skeleton className="h-96 w-full" />,
});


export function InvoiceTab() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState('list');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
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
    switch (view) {
      case 'create':
        return <CreateInvoicePage onBack={handleBack} invoiceId={editingInvoiceId} />;
      case 'list':
      default:
        return <InvoiceListView onCreateClick={handleCreateClick} onEditClick={handleEditClick} isKycVerified={isKycVerified} />;
    }
  };

  return <Suspense fallback={<Skeleton className="h-96 w-full" />}>{renderContent()}</Suspense>;
}

    