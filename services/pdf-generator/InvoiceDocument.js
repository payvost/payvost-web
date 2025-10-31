const React = require('react');
const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 },
  headerLeft: { flexDirection: 'column' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2563eb', marginBottom: 4 },
  invoiceNumber: { fontSize: 11, color: '#6b7280' },
  statusBadge: { padding: '6 10', borderRadius: 10, fontSize: 11, fontWeight: 'bold' },
  statusPaid: { backgroundColor: '#dcfce7', color: '#16a34a' },
  statusPending: { backgroundColor: '#fef3c7', color: '#f59e0b' },
  statusOverdue: { backgroundColor: '#fee2e2', color: '#dc2626' },
  section: { flexDirection: 'row', marginBottom: 24 },
  column: { flex: 1, paddingRight: 20 },
  columnRight: { flex: 1, alignItems: 'flex-end' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  text: { fontSize: 10, marginBottom: 3 },
  mutedText: { fontSize: 9, color: '#6b7280', marginBottom: 3 },
  table: { marginTop: 20, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderBottomWidth: 2, borderBottomColor: '#e5e7eb' },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableColHeader: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  tableCol: { fontSize: 10 },
  tableColDesc: { width: '60%' },
  tableColQty: { width: '13%', textAlign: 'center' },
  tableColPrice: { width: '13%', textAlign: 'right' },
  tableColTotal: { width: '14%', textAlign: 'right' },
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  totalsBox: { width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, fontSize: 10 },
  totalLabel: { color: '#6b7280' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderTopColor: '#2563eb' },
  grandTotalText: { fontSize: 14, fontWeight: 'bold' },
  notesSection: { marginTop: 24 },
  notesHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  notesText: { fontSize: 9, color: '#6b7280', lineHeight: 1.4 },
});

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };

const formatCurrency = (amount, currency) => {
  const symbol = currencySymbols[currency] || currency;
  const formattedAmount = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return `${symbol}${formattedAmount}`;
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
          React.createElement(Text, { style: styles.invoiceNumber }, '# ' + (invoice.invoiceNumber || invoice.id || 'INV-XXXX'))
        ),
        React.createElement(View, { style: [styles.statusBadge, statusStyle] },
          React.createElement(Text, {}, status.toUpperCase())
        )
      ),
      React.createElement(View, { style: styles.section },
        React.createElement(View, { style: styles.column },
          React.createElement(Text, { style: styles.sectionHeader }, 'Billed To'),
          React.createElement(Text, { style: styles.text }, invoice.toName || 'Customer Name'),
          invoice.toAddress && React.createElement(Text, { style: styles.mutedText }, invoice.toAddress),
          invoice.toEmail && React.createElement(Text, { style: styles.mutedText }, invoice.toEmail)
        ),
        React.createElement(View, { style: styles.column },
          React.createElement(Text, { style: styles.sectionHeader }, 'From'),
          React.createElement(Text, { style: styles.text }, invoice.fromName || 'Your Business'),
          invoice.fromAddress && React.createElement(Text, { style: styles.mutedText }, invoice.fromAddress)
        ),
        React.createElement(View, { style: styles.columnRight },
          React.createElement(Text, { style: styles.text }, `Issue Date: ${formatDate(invoice.issueDate || invoice.createdAt)}`),
          React.createElement(Text, { style: styles.text }, `Due Date: ${formatDate(invoice.dueDate)}`)
        )
      ),
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColDesc] }, 'Description'),
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColQty] }, 'Qty'),
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColPrice] }, 'Price'),
          React.createElement(Text, { style: [styles.tableColHeader, styles.tableColTotal] }, 'Total')
        ),
        ...items.map((item, index) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const total = qty * price;
          return React.createElement(View, { key: index, style: styles.tableRow },
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
            React.createElement(Text, { style: styles.totalLabel }, 'Subtotal'),
            React.createElement(Text, {}, formatCurrency(subtotal, currency))
          ),
          tax > 0 && React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, `Tax (${invoice.taxRate || 0}%)`),
            React.createElement(Text, {}, formatCurrency(tax, currency))
          ),
          discount > 0 && React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Discount'),
            React.createElement(Text, {}, '- ' + formatCurrency(discount, currency))
          ),
          React.createElement(View, { style: styles.grandTotalRow },
            React.createElement(Text, { style: styles.grandTotalText }, 'Grand Total'),
            React.createElement(Text, { style: styles.grandTotalText }, formatCurrency(grandTotal, currency))
          )
        )
      ),
      invoice.notes && React.createElement(View, { style: styles.notesSection },
        React.createElement(Text, { style: styles.notesHeader }, 'Notes'),
        React.createElement(Text, { style: styles.notesText }, invoice.notes)
      )
    )
  );
};

module.exports = InvoiceDocument;
