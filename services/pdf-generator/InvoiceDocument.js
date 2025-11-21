const React = require('react');
const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');

const styles = StyleSheet.create({
  page: { 
    padding: 50, 
    fontFamily: 'Helvetica', 
    fontSize: 10, 
    color: '#1e293b',
    backgroundColor: '#ffffff'
  },
  // Enhanced Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 40, 
    paddingBottom: 25,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid',
    backgroundColor: '#f0f9ff',
    borderRadius: 12
  },
  headerLeft: { flexDirection: 'column', flex: 1 },
  title: { 
    fontSize: 38, 
    fontWeight: 'bold', 
    color: '#1e40af', 
    marginBottom: 8,
    letterSpacing: 1.2
  },
  invoiceNumber: { 
    fontSize: 13, 
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4
  },
  statusBadge: { 
    padding: '10 20', 
    borderRadius: 25, 
    fontSize: 11, 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-end'
  },
  statusPaid: { 
    backgroundColor: '#dcfce7', 
    color: '#166534',
    border: '2 solid #86efac'
  },
  statusPending: { 
    backgroundColor: '#fef3c7', 
    color: '#92400e',
    border: '2 solid #fcd34d'
  },
  statusOverdue: { 
    backgroundColor: '#fee2e2', 
    color: '#991b1b',
    border: '2 solid #fca5a5'
  },
  // Enhanced Section Layout
  section: { 
    flexDirection: 'row', 
    marginBottom: 35,
    gap: 20
  },
  column: { 
    flex: 1, 
    paddingRight: 15,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  columnRight: { 
    flex: 1, 
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionHeader: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 12,
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af'
  },
  text: { 
    fontSize: 11, 
    marginBottom: 5,
    color: '#1e293b',
    lineHeight: 1.5,
    fontWeight: '600'
  },
  mutedText: { 
    fontSize: 9.5, 
    color: '#64748b', 
    marginBottom: 4,
    lineHeight: 1.4
  },
  // Enhanced Table Design
  table: { 
    marginTop: 30, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden'
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#1e40af', 
    padding: 14,
    borderBottomWidth: 0
  },
  tableRow: { 
    flexDirection: 'row', 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc'
  },
  tableColHeader: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  tableCol: { 
    fontSize: 10.5,
    color: '#334155'
  },
  tableColDesc: { width: '60%' },
  tableColQty: { width: '13%', textAlign: 'center' },
  tableColPrice: { width: '13%', textAlign: 'right' },
  tableColTotal: { width: '14%', textAlign: 'right', fontWeight: 'bold' },
  // Enhanced Totals Section
  totalsSection: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 30 
  },
  totalsBox: { 
    width: 280,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e40af'
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10, 
    fontSize: 10.5,
    paddingVertical: 5
  },
  totalLabel: { 
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '600'
  },
  totalValue: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 10.5
  },
  grandTotalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 3, 
    borderTopColor: '#1e40af',
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 12
  },
  grandTotalText: { 
    fontSize: 15, 
    fontWeight: 'bold',
    color: '#1e293b'
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af'
  },
  // Payment Information Section
  paymentSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#1e40af',
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  paymentHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  paymentText: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.6,
    marginBottom: 6
  },
  // Enhanced Notes Section
  notesSection: { 
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  notesHeader: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  notesText: { 
    fontSize: 10, 
    color: '#78350f', 
    lineHeight: 1.6
  },
  // Enhanced Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
    lineHeight: 1.6
  },
  footerText: {
    marginBottom: 4
  },
  footerLink: {
    color: '#1e40af',
    textDecoration: 'underline'
  }
});

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };

const formatCurrency = (amount, currency) => {
  const num = Number(amount);
  if (isNaN(num)) return '0.00';
  
  const formattedAmount = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Currency symbol mapping with proper spacing
  const currencyMap = {
    'USD': `$ ${formattedAmount}`,
    'EUR': `€ ${formattedAmount}`,
    'GBP': `£ ${formattedAmount}`,
    'NGN': `₦ ${formattedAmount}`,
  };
  
  return currencyMap[currency] || `${currency} ${formattedAmount}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  let date;
  if (dateValue.toDate && typeof dateValue.toDate === 'function') date = dateValue.toDate();
  else if (dateValue._seconds || dateValue.seconds) date = new Date((dateValue._seconds || dateValue.seconds) * 1000);
  else if (typeof dateValue === 'string') date = new Date(dateValue);
  else date = dateValue;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

const InvoiceDocument = ({ invoice }) => {
  const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [{ description: invoice.description || 'Item', quantity: 1, price: invoice.amount || invoice.grandTotal || 0 }];
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const taxRate = Number(invoice.taxRate || 0);
  const tax = invoice.tax !== undefined ? Number(invoice.tax) : (subtotal * (taxRate / 100));
  const discount = Number(invoice.discount || 0);
  const grandTotal = invoice.grandTotal || (subtotal + tax - discount);
  const currency = invoice.currency || 'USD';
  const status = invoice.status || 'Pending';
  const statusStyle = status === 'Paid' || status === 'PAID' ? styles.statusPaid : status === 'Overdue' || status === 'OVERDUE' ? styles.statusOverdue : styles.statusPending;
  
  // Calculate days until due date
  const getDueDateInfo = () => {
    if (!invoice.dueDate) return null;
    try {
      let dueDate;
      if (invoice.dueDate && typeof invoice.dueDate === 'string') {
        dueDate = new Date(invoice.dueDate);
      } else if (invoice.dueDate && invoice.dueDate._seconds) {
        dueDate = new Date(invoice.dueDate._seconds * 1000);
      } else {
        dueDate = new Date(invoice.dueDate);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  };
  
  const daysUntilDue = getDueDateInfo();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Enhanced Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.headerLeft },
          React.createElement(Text, { style: styles.title }, 'INVOICE'),
          React.createElement(Text, { style: styles.invoiceNumber }, `Invoice # ${invoice.invoiceNumber || invoice.id || 'INV-XXXX'}`)
        ),
        React.createElement(View, { style: [styles.statusBadge, statusStyle] },
          React.createElement(Text, {}, status.toUpperCase())
        )
      ),
      
      // Billing Information Section
      React.createElement(View, { style: styles.section },
        React.createElement(View, { style: styles.column },
          React.createElement(Text, { style: styles.sectionHeader }, 'Billed To'),
          React.createElement(Text, { style: styles.text }, invoice.toName || 'Customer Name'),
          invoice.toEmail && React.createElement(Text, { style: styles.mutedText }, invoice.toEmail),
          invoice.toAddress && React.createElement(Text, { style: styles.mutedText }, invoice.toAddress)
        ),
        React.createElement(View, { style: styles.column },
          React.createElement(Text, { style: styles.sectionHeader }, 'From'),
          React.createElement(Text, { style: styles.text }, invoice.fromName || 'Your Business'),
          invoice.fromAddress && React.createElement(Text, { style: styles.mutedText }, invoice.fromAddress),
          invoice.fromEmail && React.createElement(Text, { style: styles.mutedText }, invoice.fromEmail)
        ),
        React.createElement(View, { style: styles.columnRight },
          React.createElement(Text, { style: styles.sectionHeader }, 'Invoice Details'),
          React.createElement(Text, { style: styles.text }, `Issue Date: ${formatDate(invoice.issueDate || invoice.createdAt)}`),
          React.createElement(Text, { style: styles.text }, `Due Date: ${formatDate(invoice.dueDate)}`),
          isOverdue && React.createElement(Text, { style: [styles.mutedText, { color: '#dc2626', fontWeight: 'bold', marginTop: 5 }] }, `⚠️ Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`),
          isDueSoon && !isOverdue && React.createElement(Text, { style: [styles.mutedText, { color: '#f59e0b', fontWeight: 'bold', marginTop: 5 }] }, `⏰ Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`)
        )
      ),
      
      // Enhanced Items Table
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColDesc] }, 'Description'),
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColQty] }, 'Qty'),
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColPrice] }, 'Unit Price'),
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColTotal] }, 'Total')
        ),
        ...items.map((item, index) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const total = qty * price;
          const isAlt = index % 2 === 1;
          return React.createElement(View, { key: index, style: [styles.tableRow, isAlt && styles.tableRowAlt] },
            React.createElement(Text, { style: [styles.tableCol, styles.tableColDesc] }, item.description || item.name || 'Item'),
            React.createElement(Text, { style: [styles.tableCol, styles.tableColQty] }, qty),
            React.createElement(Text, { style: [styles.tableCol, styles.tableColPrice] }, formatCurrency(price, currency)),
            React.createElement(Text, { style: [styles.tableCol, styles.tableColTotal] }, formatCurrency(total, currency))
          );
        })
      ),
      
      // Enhanced Totals Section
      React.createElement(View, { style: styles.totalsSection },
        React.createElement(View, { style: styles.totalsBox },
          React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Subtotal:'),
            React.createElement(Text, { style: styles.totalValue }, formatCurrency(subtotal, currency))
          ),
          tax > 0 && React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, `Tax${taxRate > 0 ? ` (${taxRate}%)` : ''}:`),
            React.createElement(Text, { style: styles.totalValue }, formatCurrency(tax, currency))
          ),
          discount > 0 && React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Discount:'),
            React.createElement(Text, { style: styles.totalValue }, `- ${formatCurrency(discount, currency)}`)
          ),
          React.createElement(View, { style: styles.grandTotalRow },
            React.createElement(Text, { style: styles.grandTotalText }, 'Grand Total:'),
            React.createElement(Text, { style: styles.grandTotalValue }, formatCurrency(grandTotal, currency))
          )
        )
      ),
      
      // Payment Information Section
      React.createElement(View, { style: styles.paymentSection },
        React.createElement(Text, { style: styles.paymentHeader }, 'Payment Information'),
        React.createElement(Text, { style: styles.paymentText }, `Payment is due by ${formatDate(invoice.dueDate)}.`),
        invoice.paymentMethod && React.createElement(Text, { style: styles.paymentText }, `Payment Method: ${invoice.paymentMethod === 'payvost' || invoice.paymentMethod === 'PAYVOST' ? 'PayVost' : invoice.paymentMethod === 'manual' || invoice.paymentMethod === 'MANUAL' ? 'Bank Transfer' : invoice.paymentMethod === 'stripe' || invoice.paymentMethod === 'STRIPE' ? 'Credit Card (Stripe)' : invoice.paymentMethod}`),
        invoice.manualBankName && React.createElement(Text, { style: styles.paymentText }, `Bank: ${invoice.manualBankName}`),
        invoice.manualAccountName && React.createElement(Text, { style: styles.paymentText }, `Account Name: ${invoice.manualAccountName}`),
        invoice.manualAccountNumber && React.createElement(Text, { style: styles.paymentText }, `Account Number: ${invoice.manualAccountNumber}`),
        invoice.manualOtherDetails && React.createElement(Text, { style: styles.paymentText }, invoice.manualOtherDetails)
      ),
      
      // Notes Section
      invoice.notes && React.createElement(View, { style: styles.notesSection },
        React.createElement(Text, { style: styles.notesHeader }, 'Additional Notes'),
        React.createElement(Text, { style: styles.notesText }, invoice.notes)
      ),
      
      // Enhanced Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, 'Thank you for your business!'),
        React.createElement(Text, { style: styles.footerText }, 'If you have any questions about this invoice, please contact us.'),
        invoice.fromEmail && React.createElement(Text, { style: styles.footerText }, `Email: ${invoice.fromEmail}`)
      )
    )
  );
};

module.exports = InvoiceDocument;
