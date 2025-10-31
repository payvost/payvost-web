const React = require('react');
const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');

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
  const tax = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const grandTotal = invoice.grandTotal || (subtotal + tax - discount);
  const currency = invoice.currency || 'USD';
  const status = invoice.status || 'Pending';
  const statusStyle = status === 'Paid' ? styles.statusPaid : status === 'Overdue' ? styles.statusOverdue : styles.statusPending;

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.headerLeft },
          React.createElement(Text, { style: styles.title }, 'INVOICE'),
          React.createElement(Text, { style: styles.invoiceNumber }, `Invoice # ${invoice.invoiceNumber || invoice.id || 'INV-XXXX'}`)
        ),
        React.createElement(View, { style: [styles.statusBadge, statusStyle] },
          React.createElement(Text, {}, status.toUpperCase())
        )
      ),
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
          React.createElement(Text, { style: styles.text }, `Due Date: ${formatDate(invoice.dueDate)}`)
        )
      ),
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
      React.createElement(View, { style: styles.totalsSection },
        React.createElement(View, { style: styles.totalsBox },
          React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Subtotal:'),
            React.createElement(Text, { style: styles.totalValue }, formatCurrency(subtotal, currency))
          ),
          tax > 0 && React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, `Tax (${invoice.taxRate || 0}%):`),
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
      invoice.notes && React.createElement(View, { style: styles.notesSection },
        React.createElement(Text, { style: styles.notesHeader }, 'Notes'),
        React.createElement(Text, { style: styles.notesText }, invoice.notes)
      ),
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, 'Thank you for your business!')
      )
    )
  );
};

module.exports = InvoiceDocument;
