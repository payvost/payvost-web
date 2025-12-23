'use client';

import { DocumentData } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface InvoiceDisplayProps {
  invoice: DocumentData;
  showActionButtons?: boolean;
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
  Draft: 'outline',
};

export function InvoiceDisplay({ invoice, showActionButtons = true }: InvoiceDisplayProps) {
  const status = String(invoice.status || 'Draft');
  const statusVar = statusVariant[status] || 'outline';

  const subtotal = (invoice.items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const taxAmount = Number(invoice.grandTotal) - subtotal;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate && typeof date.toDate === 'function') {
      return format(date.toDate(), 'PPP');
    }
    if (date instanceof Date) {
      return format(date, 'PPP');
    }
    return format(new Date(date), 'PPP');
  };

  return (
    <div className="invoice-container bg-white p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
          <p className="text-muted-foreground"># {String(invoice.invoiceNumber || invoice.id)}</p>
        </div>
        <div className="text-right">
          <Badge variant={statusVar} className="capitalize text-lg">
            {status}
          </Badge>
        </div>
      </div>

      {/* Billing Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
        <div className="space-y-1">
          <h3 className="font-semibold">Billed To</h3>
          <p className="text-sm">{String(invoice.toName || 'N/A')}</p>
          {invoice.toAddress && (
            <p className="text-sm text-muted-foreground">{String(invoice.toAddress)}</p>
          )}
          {invoice.toEmail && (
            <p className="text-sm text-muted-foreground">{String(invoice.toEmail)}</p>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">From</h3>
          <p className="text-sm">{String(invoice.fromName || 'N/A')}</p>
          {invoice.fromAddress && (
            <p className="text-sm text-muted-foreground">{String(invoice.fromAddress)}</p>
          )}
        </div>
        <div className="space-y-1 text-left md:text-right col-span-2 md:col-span-1">
          <p><strong className="font-semibold">Issue Date:</strong> {formatDate(invoice.issueDate)}</p>
          <p><strong className="font-semibold">Due Date:</strong> {formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Line Items Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Description</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(invoice.items || []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">No items found.</TableCell>
            </TableRow>
          ) : (
            invoice.items.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{String(item.description || 'N/A')}</TableCell>
                <TableCell className="text-center">{Number(item.quantity) || 0}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(item.price) || 0, String(invoice.currency || 'USD'))}</TableCell>
                <TableCell className="text-right">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), String(invoice.currency || 'USD'))}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal, String(invoice.currency || 'USD'))}</span>
          </div>
          {invoice.taxRate && Number(invoice.taxRate) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({Number(invoice.taxRate)}%)</span>
              <span>{formatCurrency(taxAmount, String(invoice.currency || 'USD'))}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span>{formatCurrency(Number(invoice.grandTotal) || 0, String(invoice.currency || 'USD'))}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div>
          <h4 className="font-semibold">Notes</h4>
          <p className="text-sm text-muted-foreground">{String(invoice.notes)}</p>
        </div>
      )}
    </div>
  );
}
