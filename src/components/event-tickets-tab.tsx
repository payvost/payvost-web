
'use client';

import { useState } from 'react';
import { CreateEventForm } from './create-event-form';
import { EventListView } from './event-list-view';

export function EventTicketsTab() {
  const [view, setView] = useState('list');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

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
        return <EventListView onFabClick={handleCreate} onEditClick={handleEdit} />;
    }
  };

  return <>{renderContent()}</>;
}
