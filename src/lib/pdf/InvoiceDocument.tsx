import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: 'Helvetica', 
    fontSize: 10, 
    color: '#1e293b',
    backgroundColor: '#ffffff'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 35, 
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid'
  },
  headerLeft: { flexDirection: 'column' },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#2563eb', 
    marginBottom: 6,
    letterSpacing: 1
  },
  invoiceNumber: { 
    fontSize: 12, 
    color: '#64748b',
    fontWeight: 'normal'
  },
  statusBadge: { 
    padding: '8 16', 
    borderRadius: 20, 
    fontSize: 10, 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statusPaid: { 
    backgroundColor: '#dcfce7', 
    color: '#16a34a',
    border: '1 solid #86efac'
  },
  statusPending: { 
    backgroundColor: '#fef3c7', 
    color: '#f59e0b',
    border: '1 solid #fcd34d'
  },
  statusOverdue: { 
    backgroundColor: '#fee2e2', 
    color: '#dc2626',
    border: '1 solid #fca5a5'
  },
  section: { 
    flexDirection: 'row', 
    marginBottom: 30,
    gap: 20
  },
  column: { 
    flex: 1, 
    paddingRight: 15,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8
  },
  columnRight: { 
    flex: 1, 
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8
  },
  sectionHeader: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  text: { 
    fontSize: 10, 
    marginBottom: 4,
    color: '#334155',
    lineHeight: 1.4
  },
  mutedText: { 
    fontSize: 9, 
    color: '#64748b', 
    marginBottom: 3,
    lineHeight: 1.3
  },
  table: { 
    marginTop: 25, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden'
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#2563eb', 
    padding: 12,
    borderBottomWidth: 0
  },
  tableRow: { 
    flexDirection: 'row', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc'
  },
  tableColHeader: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableCol: { 
    fontSize: 10,
    color: '#334155'
  },
  tableColDesc: { width: '60%' },
  tableColQty: { width: '13%', textAlign: 'center' },
  tableColPrice: { width: '13%', textAlign: 'right' },
  tableColTotal: { width: '14%', textAlign: 'right', fontWeight: 'bold' },
  totalsSection: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 25 
  },
  totalsBox: { 
    width: 240,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8, 
    fontSize: 10,
    paddingVertical: 4
  },
  totalLabel: { 
    color: '#64748b',
    fontSize: 10
  },
  totalValue: {
    color: '#334155',
    fontWeight: 'normal',
    fontSize: 10
  },
  grandTotalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 2, 
    borderTopColor: '#2563eb',
    paddingVertical: 8
  },
  grandTotalText: { 
    fontSize: 14, 
    fontWeight: 'bold',
    color: '#1e293b'
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  notesSection: { 
    marginTop: 30,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  notesHeader: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  notesText: { 
    fontSize: 9, 
    color: '#78350f', 
    lineHeight: 1.5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  }
});

const formatCurrency = (amount: number, currency: string) => {
  const num = Number(amount);
  if (isNaN(num)) return '0.00';
  
  const formattedAmount = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const currencyMap: Record<string, string> = {
    'USD': `$ ${formattedAmount}`,
    'EUR': `€ ${formattedAmount}`,
    'GBP': `£ ${formattedAmount}`,
    'NGN': `₦ ${formattedAmount}`,
  };
  
  return currencyMap[currency] || `${currency} ${formattedAmount}`;
};

const formatDate = (dateValue: any): string => {
  if (!dateValue) return '-';
  let date: Date;
  try {
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue && (dateValue._seconds || dateValue.seconds)) {
      date = new Date((dateValue._seconds || dateValue.seconds) * 1000);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  } catch (e) {
    return '-';
  }
};

interface InvoiceDocumentProps {
  invoice: {
    id?: string;
    invoiceNumber?: string;
    toName?: string;
    toEmail?: string;
    toAddress?: string;
    fromName?: string;
    fromAddress?: string;
    fromEmail?: string;
    items?: Array<{ description: string; quantity: number; price: number }>;
    issueDate?: string | Date | null;
    dueDate?: string | Date | null;
    createdAt?: string | Date | null;
    status?: string;
    currency?: string;
    grandTotal?: number;
    tax?: number;
    taxRate?: number;
    discount?: number;
    notes?: string;
    description?: string;
    amount?: number;
  };
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  const items = Array.isArray(invoice.items) && invoice.items.length > 0 
    ? invoice.items 
    : [{ description: invoice.description || 'Item', quantity: 1, price: invoice.amount || invoice.grandTotal || 0 }];
  
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const taxRate = Number(invoice.taxRate || 0);
  const tax = invoice.tax !== undefined ? Number(invoice.tax) : (subtotal * (taxRate / 100));
  const discount = Number(invoice.discount || 0);
  const grandTotal = invoice.grandTotal || (subtotal + tax - discount);
  const currency = invoice.currency || 'USD';
  const status = invoice.status || 'Pending';
  const statusStyle = status === 'Paid' || status === 'PAID' 
    ? styles.statusPaid 
    : status === 'Overdue' || status === 'OVERDUE' 
    ? styles.statusOverdue 
    : styles.statusPending;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>Invoice # {invoice.invoiceNumber || invoice.id || 'INV-XXXX'}</Text>
          </View>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text>{status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.column}>
            <Text style={styles.sectionHeader}>Billed To</Text>
            <Text style={styles.text}>{invoice.toName || 'Customer Name'}</Text>
            {invoice.toEmail && <Text style={styles.mutedText}>{invoice.toEmail}</Text>}
            {invoice.toAddress && <Text style={styles.mutedText}>{invoice.toAddress}</Text>}
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionHeader}>From</Text>
            <Text style={styles.text}>{invoice.fromName || 'Your Business'}</Text>
            {invoice.fromAddress && <Text style={styles.mutedText}>{invoice.fromAddress}</Text>}
            {invoice.fromEmail && <Text style={styles.mutedText}>{invoice.fromEmail}</Text>}
          </View>
          <View style={styles.columnRight}>
            <Text style={styles.sectionHeader}>Invoice Details</Text>
            <Text style={styles.text}>Issue Date: {formatDate(invoice.issueDate || invoice.createdAt) || '-'}</Text>
            <Text style={styles.text}>Due Date: {formatDate(invoice.dueDate) || '-'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.tableColDesc]}>Description</Text>
            <Text style={[styles.tableColHeader, styles.tableColQty]}>Qty</Text>
            <Text style={[styles.tableColHeader, styles.tableColPrice]}>Unit Price</Text>
            <Text style={[styles.tableColHeader, styles.tableColTotal]}>Total</Text>
          </View>
          {items.map((item, index) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const total = qty * price;
            const isAlt = index % 2 === 1;
            return (
              <View key={index} style={[styles.tableRow, isAlt && styles.tableRowAlt]}>
                <Text style={[styles.tableCol, styles.tableColDesc]}>{item.description || 'Item'}</Text>
                <Text style={[styles.tableCol, styles.tableColQty]}>{qty}</Text>
                <Text style={[styles.tableCol, styles.tableColPrice]}>{formatCurrency(price, currency)}</Text>
                <Text style={[styles.tableCol, styles.tableColTotal]}>{formatCurrency(total, currency)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text>
            </View>
            {tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate || 0}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(tax, currency)}</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>- {formatCurrency(discount, currency)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal, currency)}</Text>
            </View>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesHeader}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;

