
'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CreateInvoicePage = dynamic(() => import('./create-invoice-page').then(mod => mod.CreateInvoicePage), {
    loading: () => <Skeleton className="h-96 w-full" />,
});

const InvoiceListView = dynamic(() => import('./invoice-list-view').then(mod => mod.InvoiceListView), {
    loading: () => <Skeleton className="h-96 w-full" />,
});


interface InvoiceTabProps {
  onCreateClick?: () => void;
  onEditClick?: (invoiceId: string) => void;
}

export function InvoiceTab({ onCreateClick, onEditClick }: InvoiceTabProps = {}) {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState('list');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isKycVerified, setIsKycVerified] = useState(false);
  
   useEffect(() => {
  if (!user) return;
  const unsub = onSnapshot(doc(db, "users", user.uid), (snapshot: DocumentSnapshot<DocumentData>) => {
    if (snapshot.exists()) {
      const status = snapshot.data()?.kycStatus;
      setIsKycVerified(typeof status === 'string' && status.toLowerCase() === 'verified');
    }
  });
  return () => unsub();
  }, [user]);

  const useExternalHandlers = Boolean(onCreateClick || onEditClick);

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
      return;
    }
    setEditingInvoiceId(null);
    setView('create');
  };

  const handleEditClick = (invoiceId: string) => {
    if (onEditClick) {
      onEditClick(invoiceId);
      return;
    }
    setEditingInvoiceId(invoiceId);
    setView('create');
  };

  const handleBack = () => {
    setEditingInvoiceId(null);
    setView('list');
  };

  const renderContent = () => {
    if (useExternalHandlers) {
      return <InvoiceListView onCreateClick={handleCreateClick} onEditClick={handleEditClick} isKycVerified={isKycVerified} />;
    }

    if (view === 'create') {
      return <CreateInvoicePage onBack={handleBack} invoiceId={editingInvoiceId} />;
    }

    return <InvoiceListView onCreateClick={handleCreateClick} onEditClick={handleEditClick} isKycVerified={isKycVerified} />;
  };

  return <Suspense fallback={<Skeleton className="h-96 w-full" />}>{renderContent()}</Suspense>;
}

    