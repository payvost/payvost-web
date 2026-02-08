
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { RecentInvoicesCard } from '@/components/recent-invoices-card';

const CreateInvoicePage = dynamic(() => import('./create-invoice-page').then(mod => mod.CreateInvoicePage), {
    loading: () => <Skeleton className="h-96 w-full" />,
});

interface InvoiceTabProps {
  onCreateClick?: () => void;
  onEditClick?: (invoiceId: string) => void;
}

export function InvoiceTab({ onCreateClick, onEditClick }: InvoiceTabProps = {}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
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

  const syncFromUrl = useMemo(() => {
    const edit = searchParams.get('edit');
    const create = searchParams.get('create');
    return { edit, create };
  }, [searchParams]);

  useEffect(() => {
    if (!syncFromUrl.edit) return;
    setEditingInvoiceId(syncFromUrl.edit);
  }, [syncFromUrl.edit]);

  // Keep URLs clean; "create=true" is used as an intent signal from quick actions.
  useEffect(() => {
    if (syncFromUrl.create !== 'true') return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('create');
    if (!sp.get('tab')) sp.set('tab', 'invoice');
    const qs = sp.toString();
    router.replace(qs ? `/dashboard/request-payment?${qs}` : '/dashboard/request-payment', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncFromUrl.create]);

  const updateUrl = (next: { edit?: string | null }) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (!sp.get('tab')) sp.set('tab', 'invoice');
    if (next.edit) sp.set('edit', next.edit);
    else sp.delete('edit');
    const qs = sp.toString();
    router.replace(qs ? `/dashboard/request-payment?${qs}` : '/dashboard/request-payment', { scroll: false });
  };

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
      return;
    }
    setEditingInvoiceId(null);
    updateUrl({ edit: null });
  };

  const handleEditClick = (invoiceId: string) => {
    if (onEditClick) {
      onEditClick(invoiceId);
      return;
    }
    setEditingInvoiceId(invoiceId);
    updateUrl({ edit: invoiceId });
  };

  const handleFinished = () => {
    setRefreshKey(k => k + 1);
    setEditingInvoiceId(null);
    updateUrl({ edit: null });
  };

  const kycNotice = !authLoading && user && !isKycVerified;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        {kycNotice && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Creation Locked</CardTitle>
              <CardDescription>
                Your account must pass verification before you can create and send invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/profile')}>
                Complete Verification
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Invoice Form</div>
            <div className="text-xs text-muted-foreground">
              {editingInvoiceId ? 'Editing draft invoice' : 'Create a new invoice'}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={handleCreateClick} disabled={!user}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>

        <CreateInvoicePage
          variant="embedded"
          invoiceId={editingInvoiceId}
          onFinished={handleFinished}
          // Keep the form mounted in the Invoice tab; no back button in embedded mode.
          onBack={undefined}
          disabled={!isKycVerified}
        />
      </div>

      <RecentInvoicesCard refreshKey={refreshKey} onEditDraft={handleEditClick} />
    </div>
  );
}

    
