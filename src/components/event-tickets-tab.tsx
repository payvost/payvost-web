
'use client';

import { useState, useEffect } from 'react';
import { CreateEventForm } from './create-event-form';
import { EventListView } from './event-list-view';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function EventTicketsTab() {
  const [view, setView] = useState('list');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
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

  const handleEdit = (eventId: string) => {
    setEditingEventId(eventId);
    setView('create');
  };

  const handleBack = () => {
    setView('list');
    setEditingEventId(null);
  };
  
  const handleCreate = () => {
    setEditingEventId(null);
    setView('create');
  }

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateEventForm onBack={handleBack} eventId={editingEventId} />;
      case 'list':
      default:
        return <EventListView onFabClick={handleCreate} onEditClick={handleEdit} isKycVerified={isKycVerified} />;
    }
  };

  return <>{renderContent()}</>;
}
