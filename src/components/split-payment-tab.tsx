
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Users } from 'lucide-react';
import { CreateSplitPaymentForm } from './create-split-payment-form';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function SplitPaymentTab() {
  const [view, setView] = useState('list');
  const [hasSplitPayments, setHasSplitPayments] = useState(false); // Assume no payments initially
  const { user } = useAuth();
  const [isKycVerified, setIsKycVerified] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            setIsKycVerified(doc.data().kycStatus === 'Verified');
            // Logic to check for existing split payments can be added here
            // For now, we keep it simple
        }
    });
    return () => unsub();
  }, [user]);

  const handleCreateClick = () => {
    setView('create');
  };

  const handleBack = () => {
    setView('list');
  };

  if (view === 'create') {
    return <CreateSplitPaymentForm onBack={handleBack} />;
  }

  if (!hasSplitPayments) {
    return (
      <Card className="h-96">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold tracking-tight">Create Your First Split Payment</h3>
          <p className="text-sm text-muted-foreground mb-6">Easily divide payments among multiple recipients.</p>
          <Button onClick={handleCreateClick} disabled={!isKycVerified}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Split Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  // This part can be built out later to show a list of existing split payments
  return (
    <Card>
      <CardContent>
        <p>List of existing split payments will go here.</p>
      </CardContent>
    </Card>
  );
}
