
'use client';

import { useState } from 'react';
import { CreateEventForm } from './create-event-form';
import { EventListView } from './event-list-view';

export function EventTicketsTab() {
  const [view, setView] = useState('list');

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateEventForm onBack={() => setView('list')} />;
      case 'list':
      default:
        return <EventListView onFabClick={() => setView('create')} />;
    }
  };

  return <>{renderContent()}</>;
}
