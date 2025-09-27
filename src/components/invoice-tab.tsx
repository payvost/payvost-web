
'use client';

import { useState } from 'react';
import { CreateInvoicePage } from './create-invoice-page'; // Assuming this is the name
import { InvoiceListView } from './invoice-list-view';

export function InvoiceTab() {
  const [view, setView] = useState('list');

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateInvoicePage onBack={() => setView('list')} />;
      case 'list':
      default:
        return <InvoiceListView onCreateClick={() => setView('create')} />;
    }
  };

  return <>{renderContent()}</>;
}
