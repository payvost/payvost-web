
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Users } from 'lucide-react';
import { CreateSplitPaymentForm } from './create-split-payment-form';

export function SplitPaymentTab() {
  const [view, setView] = useState('list');
  const [hasSplitPayments, setHasSplitPayments] = useState(false); // Assume no payments initially

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
          <Button onClick={handleCreateClick}>
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
