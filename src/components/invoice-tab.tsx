
'use client';

import { useState } from 'react';
import { CreateInvoicePage } from './create-invoice-page'; // Assuming this is the name
import { InvoiceListView } from './invoice-list-view';

export function InvoiceTab() {
  const [view, setView] = useState('list');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

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
        return <InvoiceListView onCreateClick={handleCreateClick} onEditClick={handleEditClick} />;
    }
  };

  return <>{renderContent()}</>;
}
