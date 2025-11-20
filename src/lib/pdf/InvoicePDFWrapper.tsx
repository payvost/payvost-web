import React from 'react';
import InvoiceDocument from './InvoiceDocument';

interface InvoiceData {
  id?: string;
  invoiceNumber?: string;
  issueDate?: string | Date | null;
  dueDate?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  paidAt?: string | Date | null;
  toName?: string;
  toEmail?: string;
  toAddress?: string;
  fromName?: string;
  fromAddress?: string;
  fromEmail?: string;
  items?: Array<{ description: string; quantity: number; price: number }>;
  status?: string;
  currency?: string;
  grandTotal?: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  notes?: string;
  description?: string;
  amount?: number;
}

export function InvoicePDFWrapper({ invoice }: { invoice: InvoiceData }) {
  return <InvoiceDocument invoice={invoice} />;
}

