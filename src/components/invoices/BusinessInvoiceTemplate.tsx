'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { numberToWords } from '@/lib/utils/number-to-words';

interface BusinessInvoiceTemplateProps {
  invoice: any;
  businessProfile?: any;
  invoiceSettings?: any;
  isPdf?: boolean;
}

export function BusinessInvoiceTemplate({ 
  invoice, 
  businessProfile, 
  invoiceSettings,
  isPdf = false 
}: BusinessInvoiceTemplateProps) {
  const template = invoiceSettings?.invoiceTemplate || 'default';
  
  const statusInfo = {
    Paid: { icon: <CheckCircle className="h-4 w-4" />, variant: 'default' as const, color: '#10B981', bgColor: '#D1FAE5' },
    Pending: { icon: <Clock className="h-4 w-4" />, variant: 'secondary' as const, color: '#F59E0B', bgColor: '#FEF3C7' },
    Overdue: { icon: <AlertTriangle className="h-4 w-4" />, variant: 'destructive' as const, color: '#EF4444', bgColor: '#FEE2E2' },
    Draft: { icon: <FileText className="h-4 w-4" />, variant: 'outline' as const, color: '#6B7280', bgColor: '#F3F4F6' },
  };

  const currentStatus = statusInfo[invoice.status as keyof typeof statusInfo] || statusInfo.Pending;
  
  const currencySymbols: { [key: string]: string } = {
    USD: '$', EUR: '€', GBP: '£', NGN: '₦',
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(amount)}`;
  };

  const subtotal = invoice.items.reduce((acc: number, item: any) => 
    acc + (item.quantity || 0) * (item.price || 0), 0);
  const taxAmount = invoice.taxRate ? (subtotal * invoice.taxRate / 100) : 0;
  const discount = invoice.discount || 0;
  const grandTotal = invoice.grandTotal || (subtotal + taxAmount - discount);

  // Calculate days until due
  const dueDate = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const paymentDueText = daysUntilDue > 0 
    ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
    : daysUntilDue === 0 
    ? 'Due today'
    : `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;

  const brandName = businessProfile?.legalName || invoice.fromName;
  const logoUrl = businessProfile?.invoiceLogoUrl;
  const amountInWords = numberToWords(grandTotal, invoice.currency);

  return (
    <div className={`business-invoice business-invoice-${template} ${isPdf ? 'pdf-mode' : ''}`}>
      <style jsx>{`
        .business-invoice {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          background: #FFFFFF;
          color: #1D1D1F;
          padding: ${isPdf ? '0' : '24px'};
        }
        
        .pdf-mode {
          max-width: 100%;
          padding: 0;
        }

        /* ========== DEFAULT TEMPLATE ========== */
        .business-invoice-default {
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 32px;
        }

        .business-invoice-default .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #E5E5E5;
        }

        .business-invoice-default .brand-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .business-invoice-default .brand-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .business-invoice-default .brand-name {
          font-size: 18px;
          font-weight: 600;
          color: #1D1D1F;
          margin: 0;
        }

        .business-invoice-default .invoice-title {
          font-size: 28px;
          font-weight: 600;
          color: #1D1D1F;
          margin: 0 0 4px 0;
        }

        .business-invoice-default .invoice-number {
          font-size: 14px;
          color: #6E6E73;
          margin: 0;
        }

        .business-invoice-default .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #E5E5E5;
          background: #F5F5F7;
          color: #6E6E73;
        }

        .business-invoice-default .contact-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .business-invoice-default .contact-block h3 {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6E6E73;
          margin: 0 0 12px 0;
        }

        .business-invoice-default .contact-block p {
          font-size: 14px;
          color: #1D1D1F;
          margin: 4px 0;
          line-height: 1.5;
        }

        .business-invoice-default .metadata-section {
          margin-bottom: 32px;
          padding: 16px;
          background: #F5F5F7;
          border-radius: 4px;
        }

        .business-invoice-default .metadata-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .business-invoice-default .metadata-label {
          color: #6E6E73;
        }

        .business-invoice-default .metadata-value {
          color: #1D1D1F;
          font-weight: 500;
        }

        .business-invoice-default .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }

        .business-invoice-default .items-table th {
          text-align: left;
          padding: 12px 0;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6E6E73;
          border-bottom: 1px solid #E5E5E5;
        }

        .business-invoice-default .items-table td {
          padding: 16px 0;
          font-size: 14px;
          color: #1D1D1F;
          border-bottom: 1px solid #F5F5F7;
        }

        .business-invoice-default .items-table th.text-right,
        .business-invoice-default .items-table td.text-right {
          text-align: right;
        }

        .business-invoice-default .items-table th.text-center,
        .business-invoice-default .items-table td.text-center {
          text-align: center;
        }

        .business-invoice-default .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32px;
        }

        .business-invoice-default .totals-box {
          width: 100%;
          max-width: 300px;
        }

        .business-invoice-default .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          border-bottom: 1px solid #F5F5F7;
        }

        .business-invoice-default .total-row.grand-total {
          border-bottom: 2px solid #E5E5E5;
          font-size: 18px;
          font-weight: 600;
          padding-top: 16px;
          margin-top: 8px;
        }

        .business-invoice-default .amount-words {
          background: #F5F5F7;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 24px;
          border-left: 3px solid #0066FF;
        }

        .business-invoice-default .amount-words-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6E6E73;
          margin-bottom: 4px;
        }

        .business-invoice-default .amount-words-value {
          font-size: 13px;
          color: #1D1D1F;
          font-weight: 500;
          font-style: italic;
        }

        /* ========== CLASSIC TEMPLATE ========== */
        .business-invoice-classic {
          border: 2px solid #1D1D1F;
          padding: 40px;
        }

        .business-invoice-classic .header-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 2px solid #1D1D1F;
        }

        .business-invoice-classic .brand-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .business-invoice-classic .brand-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border: 1px solid #E5E5E5;
          padding: 8px;
        }

        .business-invoice-classic .brand-info h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1D1D1F;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .business-invoice-classic .brand-info p {
          font-size: 14px;
          color: #6E6E73;
          margin: 0;
        }

        .business-invoice-classic .invoice-header-right {
          text-align: right;
        }

        .business-invoice-classic .invoice-title {
          font-size: 32px;
          font-weight: 700;
          color: #1D1D1F;
          margin: 0 0 8px 0;
          letter-spacing: -1px;
        }

        .business-invoice-classic .invoice-number {
          font-size: 16px;
          color: #6E6E73;
          margin: 0 0 16px 0;
        }

        .business-invoice-classic .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          border: 2px solid #1D1D1F;
          background: #FFFFFF;
          color: #1D1D1F;
        }

        .business-invoice-classic .contact-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          padding: 24px;
          background: #F5F5F7;
          border: 1px solid #E5E5E5;
        }

        .business-invoice-classic .contact-block h3 {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1D1D1F;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #1D1D1F;
        }

        .business-invoice-classic .contact-block p {
          font-size: 14px;
          color: #1D1D1F;
          margin: 6px 0;
          line-height: 1.6;
          font-weight: 500;
        }

        .business-invoice-classic .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
          border: 1px solid #E5E5E5;
        }

        .business-invoice-classic .items-table th {
          text-align: left;
          padding: 16px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1D1D1F;
          background: #F5F5F7;
          border-bottom: 2px solid #1D1D1F;
        }

        .business-invoice-classic .items-table td {
          padding: 16px;
          font-size: 14px;
          color: #1D1D1F;
          border-bottom: 1px solid #E5E5E5;
        }

        .business-invoice-classic .items-table th.text-right,
        .business-invoice-classic .items-table td.text-right {
          text-align: right;
        }

        .business-invoice-classic .items-table th.text-center,
        .business-invoice-classic .items-table td.text-center {
          text-align: center;
        }

        .business-invoice-classic .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32px;
        }

        .business-invoice-classic .totals-box {
          width: 100%;
          max-width: 350px;
          border: 1px solid #E5E5E5;
          padding: 24px;
          background: #F5F5F7;
        }

        .business-invoice-classic .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 14px;
          border-bottom: 1px solid #E5E5E5;
        }

        .business-invoice-classic .total-row.grand-total {
          border-bottom: 2px solid #1D1D1F;
          font-size: 20px;
          font-weight: 700;
          padding-top: 16px;
          margin-top: 8px;
        }

        .business-invoice-classic .amount-words {
          background: #F5F5F7;
          padding: 16px 20px;
          border-radius: 4px;
          margin-bottom: 24px;
          border: 2px solid #1D1D1F;
        }

        .business-invoice-classic .amount-words-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1D1D1F;
          margin-bottom: 6px;
        }

        .business-invoice-classic .amount-words-value {
          font-size: 14px;
          color: #1D1D1F;
          font-weight: 600;
          font-style: italic;
        }

        /* ========== PROFESSIONAL TEMPLATE (Stripe-style) ========== */
        .business-invoice-professional {
          background: #FFFFFF;
        }

        .business-invoice-professional .brand-header {
          padding: 32px 0;
          border-bottom: 4px solid #0066FF;
          margin-bottom: 32px;
        }

        .business-invoice-professional .brand-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .business-invoice-professional .brand-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .business-invoice-professional .brand-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 8px;
        }

        .business-invoice-professional .brand-info h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1D1D1F;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }

        .business-invoice-professional .brand-info p {
          font-size: 14px;
          color: #6E6E73;
          margin: 0;
        }

        .business-invoice-professional .invoice-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 1px solid #E5E5E5;
        }

        .business-invoice-professional .invoice-title h2 {
          font-size: 32px;
          font-weight: 600;
          color: #1D1D1F;
          margin: 0 0 8px 0;
          letter-spacing: -1px;
        }

        .business-invoice-professional .invoice-title p {
          font-size: 14px;
          color: #6E6E73;
          margin: 0;
        }

        .business-invoice-professional .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          background: ${currentStatus.bgColor};
          color: ${currentStatus.color};
          border: none;
        }

        .business-invoice-professional .contact-blocks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .business-invoice-professional .contact-block h3 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6E6E73;
          margin: 0 0 16px 0;
        }

        .business-invoice-professional .contact-block p {
          font-size: 15px;
          color: #1D1D1F;
          margin: 6px 0;
          line-height: 1.6;
        }

        .business-invoice-professional .contact-block p.muted {
          font-size: 14px;
          color: #6E6E73;
        }

        .business-invoice-professional .invoice-metadata {
          text-align: right;
          margin-bottom: 40px;
        }

        .business-invoice-professional .metadata-row {
          display: flex;
          justify-content: flex-end;
          gap: 24px;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .business-invoice-professional .metadata-label {
          color: #6E6E73;
          font-weight: 500;
          min-width: 140px;
          text-align: right;
        }

        .business-invoice-professional .metadata-value {
          color: #1D1D1F;
          font-weight: 600;
          min-width: 160px;
          text-align: left;
        }

        .business-invoice-professional .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }

        .business-invoice-professional .items-table thead {
          border-bottom: 2px solid #E5E5E5;
        }

        .business-invoice-professional .items-table th {
          text-align: left;
          padding: 16px 0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6E6E73;
        }

        .business-invoice-professional .items-table td {
          padding: 20px 0;
          font-size: 15px;
          color: #1D1D1F;
          border-bottom: 1px solid #F5F5F7;
        }

        .business-invoice-professional .items-table th.text-right,
        .business-invoice-professional .items-table td.text-right {
          text-align: right;
        }

        .business-invoice-professional .items-table th.text-center,
        .business-invoice-professional .items-table td.text-center {
          text-align: center;
        }

        .business-invoice-professional .items-table tbody tr:last-child td {
          border-bottom: none;
        }

        .business-invoice-professional .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .business-invoice-professional .totals-box {
          width: 100%;
          max-width: 320px;
        }

        .business-invoice-professional .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 15px;
        }

        .business-invoice-professional .total-row.muted {
          color: #6E6E73;
        }

        .business-invoice-professional .total-row.grand-total {
          padding-top: 24px;
          margin-top: 16px;
          border-top: 3px solid #0066FF;
          font-size: 24px;
          font-weight: 700;
          color: #1D1D1F;
        }

        .business-invoice-professional .payment-box {
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 40px;
          color: white;
        }

        .business-invoice-professional .payment-box h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: white;
        }

        .business-invoice-professional .payment-instructions {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 8px;
          line-height: 1.6;
        }

        .business-invoice-professional .payment-button {
          display: inline-block;
          background: white;
          color: #0066FF;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          margin-top: 16px;
          transition: transform 0.2s;
        }

        .business-invoice-professional .payment-button:hover {
          transform: translateY(-2px);
        }

        .business-invoice-professional .amount-words {
          background: linear-gradient(135deg, #F5F5F7 0%, #FFFFFF 100%);
          padding: 20px 24px;
          border-radius: 8px;
          margin-bottom: 32px;
          border-left: 4px solid #0066FF;
        }

        .business-invoice-professional .amount-words-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6E6E73;
          margin-bottom: 8px;
        }

        .business-invoice-professional .amount-words-value {
          font-size: 15px;
          color: #1D1D1F;
          font-weight: 500;
          font-style: italic;
          line-height: 1.6;
        }

        .business-invoice-professional .notes-section {
          margin-bottom: 40px;
        }

        .business-invoice-professional .notes-section h4 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6E6E73;
          margin: 0 0 12px 0;
        }

        .business-invoice-professional .notes-section p {
          font-size: 15px;
          color: #1D1D1F;
          line-height: 1.7;
          margin: 0;
        }

        .business-invoice-professional .terms-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5E5E5;
        }

        .business-invoice-professional .thank-you {
          text-align: center;
          font-size: 16px;
          color: #6E6E73;
          margin-top: 32px;
          font-style: italic;
          font-weight: 500;
        }

        @media print {
          .business-invoice {
            max-width: 100%;
            padding: 0;
            border: none;
          }
        }
      `}</style>

      {/* Template-specific rendering */}
      {template === 'default' && (
        <>
          <div className="header-section">
            <div className="brand-section">
              {logoUrl && (
                <Image src={logoUrl} alt={brandName} width={60} height={60} className="brand-logo" />
              )}
              <div>
                <h1 className="brand-name">{brandName}</h1>
              </div>
            </div>
            <div>
              <h2 className="invoice-title">INVOICE</h2>
              <p className="invoice-number">#{invoice.invoiceNumber}</p>
              <Badge className="status-badge" variant={currentStatus.variant}>
                {currentStatus.icon}
                {invoice.status}
              </Badge>
            </div>
          </div>

          <div className="contact-section">
            <div className="contact-block">
              <h3>Billed To</h3>
              <p>{invoice.toName}</p>
              {invoice.toAddress && <p>{invoice.toAddress}</p>}
              {invoice.toEmail && <p>{invoice.toEmail}</p>}
            </div>
            <div className="contact-block">
              <h3>From</h3>
              <p>{invoice.fromName}</p>
              {invoice.fromAddress && <p>{invoice.fromAddress}</p>}
              {businessProfile?.businessAddress && <p>{businessProfile.businessAddress}</p>}
            </div>
          </div>

          <div className="metadata-section">
            <div className="metadata-row">
              <span className="metadata-label">Issue Date:</span>
              <span className="metadata-value">{format(invoice.issueDate?.toDate ? invoice.issueDate.toDate() : new Date(invoice.issueDate), 'PPP')}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Due Date:</span>
              <span className="metadata-value">{format(dueDate, 'PPP')}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Currency:</span>
              <span className="metadata-value">{invoice.currency}</span>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.price, invoice.currency)}</td>
                  <td className="text-right">{formatCurrency(item.quantity * item.price, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="total-row">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <div className="amount-words">
            <div className="amount-words-label">Amount in Words</div>
            <div className="amount-words-value">{amountInWords}</div>
          </div>

          {invoice.notes && (
            <div className="notes-section">
              <h4>Notes</h4>
              <p>{invoice.notes}</p>
            </div>
          )}

          {invoiceSettings?.defaultFooter && (
            <div className="notes-section">
              <p>{invoiceSettings.defaultFooter}</p>
            </div>
          )}
        </>
      )}

      {template === 'classic' && (
        <>
          <div className="header-section">
            <div className="brand-section">
              {logoUrl && (
                <Image src={logoUrl} alt={brandName} width={80} height={80} className="brand-logo" />
              )}
              <div className="brand-info">
                <h1>{brandName}</h1>
                {businessProfile?.website && <p>{businessProfile.website}</p>}
                {businessProfile?.businessAddress && <p>{businessProfile.businessAddress}</p>}
              </div>
            </div>
            <div className="invoice-header-right">
              <h2 className="invoice-title">INVOICE</h2>
              <p className="invoice-number">#{invoice.invoiceNumber}</p>
              <Badge className="status-badge" variant={currentStatus.variant}>
                {currentStatus.icon}
                {invoice.status}
              </Badge>
            </div>
          </div>

          <div className="contact-section">
            <div className="contact-block">
              <h3>Billed To</h3>
              <p>{invoice.toName}</p>
              {invoice.toAddress && <p>{invoice.toAddress}</p>}
              {invoice.toEmail && <p>{invoice.toEmail}</p>}
            </div>
            <div className="contact-block">
              <h3>From</h3>
              <p>{invoice.fromName}</p>
              {invoice.fromAddress && <p>{invoice.fromAddress}</p>}
              {businessProfile?.registrationNumber && <p>Reg: {businessProfile.registrationNumber}</p>}
              {businessProfile?.taxId && <p>Tax ID: {businessProfile.taxId}</p>}
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.price, invoice.currency)}</td>
                  <td className="text-right">{formatCurrency(item.quantity * item.price, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="total-row">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <div className="amount-words">
            <div className="amount-words-label">Amount in Words</div>
            <div className="amount-words-value">{amountInWords}</div>
          </div>

          {invoice.notes && (
            <div className="notes-section">
              <h4>Notes</h4>
              <p>{invoice.notes}</p>
            </div>
          )}

          {invoiceSettings?.defaultFooter && (
            <div className="notes-section">
              <p>{invoiceSettings.defaultFooter}</p>
            </div>
          )}
        </>
      )}

      {template === 'professional' && (
        <>
          <div className="brand-header">
            <div className="brand-header-content">
              <div className="brand-left">
                {logoUrl && (
                  <Image src={logoUrl} alt={brandName} width={80} height={80} className="brand-logo" />
                )}
                <div className="brand-info">
                  <h1>{brandName}</h1>
                  {businessProfile?.website && <p>{businessProfile.website}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-title-section">
            <div className="invoice-title">
              <h2>INVOICE</h2>
              <p>Invoice #{invoice.invoiceNumber}</p>
            </div>
            <Badge className="status-badge" variant={currentStatus.variant}>
              {currentStatus.icon}
              {invoice.status}
            </Badge>
          </div>

          <div className="contact-blocks">
            <div className="contact-block">
              <h3>Billed To</h3>
              <p>{invoice.toName}</p>
              {invoice.toAddress && <p className="muted">{invoice.toAddress}</p>}
              {invoice.toEmail && <p className="muted">{invoice.toEmail}</p>}
            </div>
            <div className="contact-block">
              <h3>From</h3>
              <p>{invoice.fromName}</p>
              {invoice.fromAddress && <p className="muted">{invoice.fromAddress}</p>}
              {businessProfile?.businessAddress && <p className="muted">{businessProfile.businessAddress}</p>}
              {businessProfile?.registrationNumber && <p className="muted">Reg: {businessProfile.registrationNumber}</p>}
              {businessProfile?.taxId && <p className="muted">Tax ID: {businessProfile.taxId}</p>}
            </div>
          </div>

          <div className="invoice-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Invoice Number:</span>
              <span className="metadata-value">{invoice.invoiceNumber}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Issue Date:</span>
              <span className="metadata-value">{format(invoice.issueDate?.toDate ? invoice.issueDate.toDate() : new Date(invoice.issueDate), 'PPP')}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Due Date:</span>
              <span className="metadata-value">{format(dueDate, 'PPP')}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Payment Due:</span>
              <span className="metadata-value">{paymentDueText}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Currency:</span>
              <span className="metadata-value">{invoice.currency}</span>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center">QTY</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.price, invoice.currency)}</td>
                  <td className="text-right">{formatCurrency(item.quantity * item.price, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="total-row muted">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="total-row muted">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount, invoice.currency)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <div className="amount-words">
            <div className="amount-words-label">Amount in Words</div>
            <div className="amount-words-value">{amountInWords}</div>
          </div>

          {invoice.paymentMethod === 'stripe' && invoice.status !== 'Paid' && (
            <div className="payment-box">
              <h3>Pay Securely Online</h3>
              <p className="payment-instructions">
                Click the button below to complete your payment securely. We accept all major credit cards and bank transfers.
              </p>
              {!isPdf && (
                <a href="#payment" className="payment-button">
                  Pay {formatCurrency(grandTotal, invoice.currency)} Now
                </a>
              )}
            </div>
          )}

          {(invoice.notes || invoiceSettings?.defaultFooter) && (
            <div className="notes-section">
              {invoice.notes && (
                <>
                  <h4>Additional Notes</h4>
                  <p>{invoice.notes}</p>
                </>
              )}
              {invoiceSettings?.defaultFooter && (
                <div className="terms-section">
                  <h4>Terms</h4>
                  <p>{invoiceSettings.defaultFooter}</p>
                </div>
              )}
              <p className="thank-you">Thank you for your business!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

