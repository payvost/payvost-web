const React = require('react');
const { Document, Page, Text, View, StyleSheet, Image } = require('@react-pdf/renderer');

// Base styles (for personal invoices - keep existing design)
const baseStyles = StyleSheet.create({
  page: { 
    padding: 50, 
    fontFamily: 'Helvetica', 
    fontSize: 10, 
    color: '#1e293b',
    backgroundColor: '#ffffff'
  },
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
  amountWords: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066FF'
  },
  amountWordsLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6E6E73',
    marginBottom: 5
  },
  amountWordsValue: {
    fontSize: 10,
    color: '#1D1D1F',
    fontStyle: 'italic',
    lineHeight: 1.5
  }
});

// Business invoice template styles
const businessStyles = {
  default: StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1D1D1F', backgroundColor: '#ffffff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1D1D1F', marginBottom: 4 },
    invoiceNumber: { fontSize: 12, color: '#6E6E73' },
    section: { flexDirection: 'row', marginBottom: 30, gap: 30 },
    column: { flex: 1, backgroundColor: '#F5F5F7', padding: 16, borderRadius: 4 },
    sectionHeader: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#6E6E73', marginBottom: 10 },
    text: { fontSize: 11, marginBottom: 4, color: '#1D1D1F' },
    mutedText: { fontSize: 10, color: '#6E6E73', marginBottom: 3 },
    table: { marginTop: 25, marginBottom: 25, borderWidth: 1, borderColor: '#E5E5E5' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F7', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
    totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25 },
    totalsBox: { width: 250, padding: 20, backgroundColor: '#ffffff' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 2, borderTopColor: '#E5E5E5', fontSize: 16, fontWeight: 'bold' }
  }),
  classic: StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1D1D1F', backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#1D1D1F' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35, paddingBottom: 25, borderBottomWidth: 2, borderBottomColor: '#1D1D1F' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1D1D1F', marginBottom: 6 },
    invoiceNumber: { fontSize: 14, color: '#6E6E73' },
    section: { flexDirection: 'row', marginBottom: 35, gap: 35, padding: 20, backgroundColor: '#F5F5F7', borderWidth: 1, borderColor: '#E5E5E5' },
    column: { flex: 1, padding: 16 },
    sectionHeader: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, color: '#1D1D1F', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#1D1D1F' },
    text: { fontSize: 11, marginBottom: 5, color: '#1D1D1F', fontWeight: '500' },
    mutedText: { fontSize: 10, color: '#6E6E73', marginBottom: 4 },
    table: { marginTop: 30, marginBottom: 30, borderWidth: 1, borderColor: '#E5E5E5' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F7', padding: 14, borderBottomWidth: 2, borderBottomColor: '#1D1D1F' },
    tableRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30 },
    totalsBox: { width: 280, borderWidth: 1, borderColor: '#E5E5E5', padding: 20, backgroundColor: '#F5F5F7' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, fontSize: 11, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 8, borderTopWidth: 2, borderTopColor: '#1D1D1F', fontSize: 18, fontWeight: 'bold' }
  }),
  professional: StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1D1D1F', backgroundColor: '#ffffff' },
    brandHeader: { padding: 25, borderBottomWidth: 4, borderBottomColor: '#0066FF', marginBottom: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1D1D1F', marginBottom: 6, letterSpacing: -0.5 },
    invoiceNumber: { fontSize: 12, color: '#6E6E73' },
    section: { flexDirection: 'row', marginBottom: 35, gap: 35 },
    column: { flex: 1 },
    sectionHeader: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: '#6E6E73', marginBottom: 12 },
    text: { fontSize: 12, marginBottom: 5, color: '#1D1D1F' },
    mutedText: { fontSize: 11, color: '#6E6E73', marginBottom: 4 },
    table: { marginTop: 35, marginBottom: 35 },
    tableHeader: { flexDirection: 'row', padding: 14, borderBottomWidth: 2, borderBottomColor: '#E5E5E5' },
    tableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
    totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 35 },
    totalsBox: { width: 260 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, fontSize: 12, color: '#6E6E73' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 18, marginTop: 12, borderTopWidth: 3, borderTopColor: '#0066FF', fontSize: 20, fontWeight: 'bold', color: '#1D1D1F' },
    paymentBox: { marginTop: 30, padding: 25, backgroundColor: '#0066FF', borderRadius: 8 },
    paymentHeader: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
    paymentText: { fontSize: 11, color: '#ffffff', lineHeight: 1.6, opacity: 0.9 }
  })
};

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };

const formatCurrency = (amount, currency) => {
  const num = Number(amount);
  if (isNaN(num)) return '0.00';
  const formattedAmount = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

// Number to words conversion (simplified for PDF)
const numberToWords = (amount, currency) => {
  const wholePart = Math.floor(amount);
  const fractionalPart = Math.round((amount - wholePart) * 100);
  const currencyNames = {
    USD: { singular: 'Dollar', plural: 'Dollars' },
    EUR: { singular: 'Euro', plural: 'Euros' },
    GBP: { singular: 'Pound', plural: 'Pounds' },
    NGN: { singular: 'Naira', plural: 'Naira' }
  };
  const currencyInfo = currencyNames[currency] || { singular: currency, plural: currency };
  // Simplified - just show the amount in currency
  return `${wholePart} ${wholePart === 1 ? currencyInfo.singular : currencyInfo.plural}${fractionalPart > 0 ? ` and ${fractionalPart}/100` : ' Only'}`;
};

const InvoiceDocument = ({ invoice }) => {
  // Detect if this is a business invoice
  const isBusinessInvoice = !!(invoice.businessId || invoice.invoiceType === 'BUSINESS' || invoice.collection === 'businessInvoices');
  
  // Get template selection (from invoiceSettings or businessProfile.invoiceSettings)
  const invoiceTemplate = invoice.invoiceSettings?.invoiceTemplate || 
                          invoice.businessProfile?.invoiceSettings?.invoiceTemplate || 
                          (isBusinessInvoice ? 'default' : null);
  
  // Get business profile data
  const businessProfile = invoice.businessProfile || {};
  const brandName = businessProfile.legalName || invoice.fromName || 'Your Business';
  const logoUrl = businessProfile.invoiceLogoUrl;
  
  // Use business styles if it's a business invoice, otherwise use base styles
  const templateStyles = isBusinessInvoice && invoiceTemplate ? businessStyles[invoiceTemplate] || businessStyles.default : baseStyles;
  const activeStyles = templateStyles || baseStyles;
  
  const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [{ description: invoice.description || 'Item', quantity: 1, price: invoice.amount || invoice.grandTotal || 0 }];
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const taxRate = Number(invoice.taxRate || 0);
  const tax = invoice.tax !== undefined ? Number(invoice.tax) : (subtotal * (taxRate / 100));
  const discount = Number(invoice.discount || 0);
  const grandTotal = invoice.grandTotal || (subtotal + tax - discount);
  const currency = invoice.currency || 'USD';
  const status = invoice.status || 'Pending';
  const statusStyle = status === 'Paid' || status === 'PAID' ? baseStyles.statusPaid : status === 'Overdue' || status === 'OVERDUE' ? baseStyles.statusOverdue : baseStyles.statusPending;
  
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
  const amountInWords = numberToWords(grandTotal, currency);

  // Render business invoice with template
  if (isBusinessInvoice && invoiceTemplate) {
    return React.createElement(Document, {},
      React.createElement(Page, { size: 'A4', style: activeStyles.page },
        // Professional template has brand header
        invoiceTemplate === 'professional' && React.createElement(View, { style: activeStyles.brandHeader },
          React.createElement(Text, { style: { fontSize: 20, fontWeight: 'bold', color: '#1D1D1F' } }, brandName)
        ),
        
        // Header
        React.createElement(View, { style: activeStyles.header },
          React.createElement(View, { style: { flexDirection: 'column', flex: 1 } },
            React.createElement(Text, { style: activeStyles.title }, 'INVOICE'),
            React.createElement(Text, { style: activeStyles.invoiceNumber }, `Invoice # ${invoice.invoiceNumber || invoice.id || 'INV-XXXX'}`)
          ),
          React.createElement(View, { style: [baseStyles.statusBadge, statusStyle] },
            React.createElement(Text, {}, status.toUpperCase())
          )
        ),
        
        // Billing Information
        React.createElement(View, { style: activeStyles.section },
          React.createElement(View, { style: activeStyles.column },
            React.createElement(Text, { style: activeStyles.sectionHeader }, 'Billed To'),
            React.createElement(Text, { style: activeStyles.text }, invoice.toName || 'Customer Name'),
            invoice.toEmail && React.createElement(Text, { style: activeStyles.mutedText }, invoice.toEmail),
            invoice.toAddress && React.createElement(Text, { style: activeStyles.mutedText }, invoice.toAddress)
          ),
          React.createElement(View, { style: activeStyles.column },
            React.createElement(Text, { style: activeStyles.sectionHeader }, 'From'),
            React.createElement(Text, { style: activeStyles.text }, invoice.fromName || brandName),
            invoice.fromAddress && React.createElement(Text, { style: activeStyles.mutedText }, invoice.fromAddress),
            businessProfile.businessAddress && React.createElement(Text, { style: activeStyles.mutedText }, businessProfile.businessAddress),
            businessProfile.registrationNumber && React.createElement(Text, { style: activeStyles.mutedText }, `Reg: ${businessProfile.registrationNumber}`),
            businessProfile.taxId && React.createElement(Text, { style: activeStyles.mutedText }, `Tax ID: ${businessProfile.taxId}`),
            invoice.fromEmail && React.createElement(Text, { style: activeStyles.mutedText }, invoice.fromEmail)
          ),
          !invoiceTemplate || invoiceTemplate === 'default' ? React.createElement(View, { style: { flex: 1, alignItems: 'flex-end', backgroundColor: '#F5F5F7', padding: 16, borderRadius: 4 } },
            React.createElement(Text, { style: activeStyles.sectionHeader }, 'Invoice Details'),
            React.createElement(Text, { style: activeStyles.text }, `Issue Date: ${formatDate(invoice.issueDate || invoice.createdAt)}`),
            React.createElement(Text, { style: activeStyles.text }, `Due Date: ${formatDate(invoice.dueDate)}`),
            React.createElement(Text, { style: activeStyles.text }, `Currency: ${currency}`)
          ) : null
        ),
        
        // Items Table
        React.createElement(View, { style: activeStyles.table },
          React.createElement(View, { style: activeStyles.tableHeader },
            React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColDesc] }, 'Description'),
            React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColQty] }, 'Qty'),
            React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColPrice] }, 'Unit Price'),
            React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColTotal] }, 'Total')
          ),
          ...items.map((item, index) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const total = qty * price;
            return React.createElement(View, { key: index, style: activeStyles.tableRow },
              React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColDesc] }, item.description || item.name || 'Item'),
              React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColQty] }, qty),
              React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColPrice] }, formatCurrency(price, currency)),
              React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColTotal] }, formatCurrency(total, currency))
            );
          })
        ),
        
        // Totals
        React.createElement(View, { style: activeStyles.totalsSection },
          React.createElement(View, { style: activeStyles.totalsBox },
            React.createElement(View, { style: activeStyles.totalRow },
              React.createElement(Text, { style: baseStyles.totalLabel }, 'Subtotal:'),
              React.createElement(Text, { style: baseStyles.totalValue }, formatCurrency(subtotal, currency))
            ),
            tax > 0 && React.createElement(View, { style: activeStyles.totalRow },
              React.createElement(Text, { style: baseStyles.totalLabel }, `Tax${taxRate > 0 ? ` (${taxRate}%)` : ''}:`),
              React.createElement(Text, { style: baseStyles.totalValue }, formatCurrency(tax, currency))
            ),
            discount > 0 && React.createElement(View, { style: activeStyles.totalRow },
              React.createElement(Text, { style: baseStyles.totalLabel }, 'Discount:'),
              React.createElement(Text, { style: baseStyles.totalValue }, `- ${formatCurrency(discount, currency)}`)
            ),
            React.createElement(View, { style: activeStyles.grandTotalRow },
              React.createElement(Text, { style: baseStyles.grandTotalText }, 'Grand Total:'),
              React.createElement(Text, { style: baseStyles.grandTotalValue }, formatCurrency(grandTotal, currency))
            )
          )
        ),
        
        // Amount in Words
        React.createElement(View, { style: baseStyles.amountWords },
          React.createElement(Text, { style: baseStyles.amountWordsLabel }, 'Amount in Words'),
          React.createElement(Text, { style: baseStyles.amountWordsValue }, amountInWords)
        ),
        
        // Payment Box (Professional template)
        invoiceTemplate === 'professional' && invoice.paymentMethod === 'stripe' && invoice.status !== 'Paid' && React.createElement(View, { style: activeStyles.paymentBox },
          React.createElement(Text, { style: activeStyles.paymentHeader }, 'Pay Securely Online'),
          React.createElement(Text, { style: activeStyles.paymentText }, 'Click the button below to complete your payment securely. We accept all major credit cards and bank transfers.')
        ),
        
        // Notes
        invoice.notes && React.createElement(View, { style: baseStyles.notesSection },
          React.createElement(Text, { style: baseStyles.notesHeader }, 'Additional Notes'),
          React.createElement(Text, { style: baseStyles.notesText }, invoice.notes)
        ),
        
        // Footer
        React.createElement(View, { style: baseStyles.footer },
          React.createElement(Text, { style: baseStyles.footerText }, 'Thank you for your business!'),
          invoice.fromEmail && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail}`)
        )
      )
    );
  }

  // Render personal invoice (original design)
  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: baseStyles.page },
      React.createElement(View, { style: baseStyles.header },
        React.createElement(View, { style: baseStyles.headerLeft },
          React.createElement(Text, { style: baseStyles.title }, 'INVOICE'),
          React.createElement(Text, { style: baseStyles.invoiceNumber }, `Invoice # ${invoice.invoiceNumber || invoice.id || 'INV-XXXX'}`)
        ),
        React.createElement(View, { style: [baseStyles.statusBadge, statusStyle] },
          React.createElement(Text, {}, status.toUpperCase())
        )
      ),
      
      React.createElement(View, { style: baseStyles.section },
        React.createElement(View, { style: baseStyles.column },
          React.createElement(Text, { style: baseStyles.sectionHeader }, 'Billed To'),
          React.createElement(Text, { style: baseStyles.text }, invoice.toName || 'Customer Name'),
          invoice.toEmail && React.createElement(Text, { style: baseStyles.mutedText }, invoice.toEmail),
          invoice.toAddress && React.createElement(Text, { style: baseStyles.mutedText }, invoice.toAddress)
        ),
        React.createElement(View, { style: baseStyles.column },
          React.createElement(Text, { style: baseStyles.sectionHeader }, 'From'),
          React.createElement(Text, { style: baseStyles.text }, invoice.fromName || 'Your Business'),
          invoice.fromAddress && React.createElement(Text, { style: baseStyles.mutedText }, invoice.fromAddress),
          invoice.fromEmail && React.createElement(Text, { style: baseStyles.mutedText }, invoice.fromEmail)
        ),
        React.createElement(View, { style: baseStyles.columnRight },
          React.createElement(Text, { style: baseStyles.sectionHeader }, 'Invoice Details'),
          React.createElement(Text, { style: baseStyles.text }, `Issue Date: ${formatDate(invoice.issueDate || invoice.createdAt)}`),
          React.createElement(Text, { style: baseStyles.text }, `Due Date: ${formatDate(invoice.dueDate)}`),
          isOverdue && React.createElement(Text, { style: [baseStyles.mutedText, { color: '#dc2626', fontWeight: 'bold', marginTop: 5 }] }, `⚠️ Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`),
          isDueSoon && !isOverdue && React.createElement(Text, { style: [baseStyles.mutedText, { color: '#f59e0b', fontWeight: 'bold', marginTop: 5 }] }, `⏰ Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`)
        )
      ),
      
      React.createElement(View, { style: baseStyles.table },
        React.createElement(View, { style: baseStyles.tableHeader },
          React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColDesc] }, 'Description'),
          React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColQty] }, 'Qty'),
          React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColPrice] }, 'Unit Price'),
          React.createElement(Text, { style: [baseStyles.tableColHeader, baseStyles.tableColTotal] }, 'Total')
        ),
        ...items.map((item, index) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const total = qty * price;
          const isAlt = index % 2 === 1;
          return React.createElement(View, { key: index, style: [baseStyles.tableRow, isAlt && baseStyles.tableRowAlt] },
            React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColDesc] }, item.description || item.name || 'Item'),
            React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColQty] }, qty),
            React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColPrice] }, formatCurrency(price, currency)),
            React.createElement(Text, { style: [baseStyles.tableCol, baseStyles.tableColTotal] }, formatCurrency(total, currency))
          );
        })
      ),
      
      React.createElement(View, { style: baseStyles.totalsSection },
        React.createElement(View, { style: baseStyles.totalsBox },
          React.createElement(View, { style: baseStyles.totalRow },
            React.createElement(Text, { style: baseStyles.totalLabel }, 'Subtotal:'),
            React.createElement(Text, { style: baseStyles.totalValue }, formatCurrency(subtotal, currency))
          ),
          tax > 0 && React.createElement(View, { style: baseStyles.totalRow },
            React.createElement(Text, { style: baseStyles.totalLabel }, `Tax${taxRate > 0 ? ` (${taxRate}%)` : ''}:`),
            React.createElement(Text, { style: baseStyles.totalValue }, formatCurrency(tax, currency))
          ),
          discount > 0 && React.createElement(View, { style: baseStyles.totalRow },
            React.createElement(Text, { style: baseStyles.totalLabel }, 'Discount:'),
            React.createElement(Text, { style: baseStyles.totalValue }, `- ${formatCurrency(discount, currency)}`)
          ),
          React.createElement(View, { style: baseStyles.grandTotalRow },
            React.createElement(Text, { style: baseStyles.grandTotalText }, 'Grand Total:'),
            React.createElement(Text, { style: baseStyles.grandTotalValue }, formatCurrency(grandTotal, currency))
          )
        )
      ),
      
      React.createElement(View, { style: baseStyles.paymentSection },
        React.createElement(Text, { style: baseStyles.paymentHeader }, 'Payment Information'),
        React.createElement(Text, { style: baseStyles.paymentText }, `Payment is due by ${formatDate(invoice.dueDate)}.`),
        invoice.paymentMethod && React.createElement(Text, { style: baseStyles.paymentText }, `Payment Method: ${invoice.paymentMethod === 'payvost' || invoice.paymentMethod === 'PAYVOST' ? 'PayVost' : invoice.paymentMethod === 'manual' || invoice.paymentMethod === 'MANUAL' ? 'Bank Transfer' : invoice.paymentMethod === 'stripe' || invoice.paymentMethod === 'STRIPE' ? 'Credit Card (Stripe)' : invoice.paymentMethod}`),
        invoice.manualBankName && React.createElement(Text, { style: baseStyles.paymentText }, `Bank: ${invoice.manualBankName}`),
        invoice.manualAccountName && React.createElement(Text, { style: baseStyles.paymentText }, `Account Name: ${invoice.manualAccountName}`),
        invoice.manualAccountNumber && React.createElement(Text, { style: baseStyles.paymentText }, `Account Number: ${invoice.manualAccountNumber}`),
        invoice.manualOtherDetails && React.createElement(Text, { style: baseStyles.paymentText }, invoice.manualOtherDetails)
      ),
      
      invoice.notes && React.createElement(View, { style: baseStyles.notesSection },
        React.createElement(Text, { style: baseStyles.notesHeader }, 'Additional Notes'),
        React.createElement(Text, { style: baseStyles.notesText }, invoice.notes)
      ),
      
      React.createElement(View, { style: baseStyles.footer },
        React.createElement(Text, { style: baseStyles.footerText }, 'Thank you for your business!'),
        React.createElement(Text, { style: baseStyles.footerText }, 'If you have any questions about this invoice, please contact us.'),
        invoice.fromEmail && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail}`)
      )
    )
  );
};

module.exports = InvoiceDocument;
