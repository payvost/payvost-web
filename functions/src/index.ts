import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import * as OneSignal from '@onesignal/node-onesignal';

// Import notification triggers
import {
  onNewLogin,
  onBusinessStatusChange,
  onTransactionStatusChange,
  onPaymentLinkCreated,
  onInvoiceStatusChange,
  sendInvoiceReminders
} from './notificationTriggers';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// === Express App for API routes ===
const app = express();
app.use(cors());

// --- Test route ---
app.get('/', (_req, res) => {
  res.send('API is working via Firebase Functions 🚀');
});

// --- Download invoice as PDF ---
app.get('/download/invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Try both collections
    let invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      invoiceDoc = await db.collection('businessInvoices').doc(invoiceId).get();
    }
    
    if (!invoiceDoc.exists) {
      console.error(`Invoice ${invoiceId} not found in any collection`);
      return res.status(404).send('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    console.log(`Processing invoice ${invoiceId}:`, JSON.stringify(invoiceData, null, 2));

    // Only allow download if invoice is public
    if (!invoiceData?.isPublic) {
      console.error(`Invoice ${invoiceId} is not public`);
      return res.status(403).send('Invoice is not public');
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50 
    });

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    // Handle pipe errors
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).send('Failed to generate PDF');
      }
    });

    // Pipe PDF to response
    doc.pipe(res);

    // --- PDF Header ---
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('INVOICE', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .fillColor('#666666')
       .text(`Invoice #${invoiceId}`, { align: 'center' });
    
    doc.moveDown(2);

    // --- Invoice Details ---
    doc.fontSize(10).fillColor('#000000');
    
    // Customer Information
    doc.fontSize(14).text('Bill To:', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(invoiceData?.customerName || 'N/A');
    if (invoiceData?.customerEmail) {
      doc.fontSize(10).fillColor('#666666').text(invoiceData.customerEmail);
    }
    
    doc.moveDown(1.5);

    // Invoice Information
    doc.fontSize(14).fillColor('#000000').text('Invoice Details:', { underline: true });
    doc.moveDown(0.3);
    
    const invoiceDetails = [
      { label: 'Invoice Number:', value: invoiceId },
      { label: 'Issue Date:', value: invoiceData?.createdAt?.toDate?.()?.toLocaleDateString() || invoiceData?.issueDate || 'N/A' },
      { label: 'Due Date:', value: invoiceData?.dueDate || 'N/A' },
      { label: 'Status:', value: invoiceData?.status || 'Pending' }
    ];

    invoiceDetails.forEach(({ label, value }) => {
      doc.fontSize(10)
         .fillColor('#000000')
         .text(label, { continued: true })
         .fillColor('#666666')
         .text(` ${value}`);
    });

    doc.moveDown(2);

    // --- Line Items Table ---
    doc.fontSize(14).fillColor('#000000').text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10)
       .fillColor('#ffffff')
       .rect(50, tableTop, 495, 20)
       .fill('#2563eb');
    
    doc.fillColor('#ffffff')
       .text('Description', 55, tableTop + 5, { width: 250 })
       .text('Quantity', 305, tableTop + 5, { width: 60, align: 'center' })
       .text('Price', 365, tableTop + 5, { width: 80, align: 'right' })
       .text('Amount', 445, tableTop + 5, { width: 95, align: 'right' });

    // Table rows
    const items = invoiceData?.items || [];
    let yPosition = tableTop + 25;
    let subtotal = 0;

    if (items.length === 0) {
      // Fallback to single item if no items array
      const singleItem = {
        description: invoiceData?.description || 'Service/Product',
        quantity: 1,
          price: Number(invoiceData?.amount) || 0
      };
      items.push(singleItem);
    }

    items.forEach((item: any, index: number) => {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price || item.amount) || 0;
    const itemAmount = quantity * price;
      subtotal += itemAmount;

      doc.fillColor('#000000')
         .text(item.description || item.name || 'Item', 55, yPosition, { width: 250 })
      .text(String(quantity), 305, yPosition, { width: 60, align: 'center' })
      .text(`${invoiceData?.currency || 'USD'} ${price.toFixed(2)}`, 365, yPosition, { width: 80, align: 'right' })
         .text(`${invoiceData?.currency || 'USD'} ${itemAmount.toFixed(2)}`, 445, yPosition, { width: 95, align: 'right' });

      yPosition += 25;

      // Draw line after each row
      if (index < items.length - 1) {
        doc.strokeColor('#e5e7eb')
           .moveTo(50, yPosition - 5)
           .lineTo(545, yPosition - 5)
           .stroke();
      }
    });

    // Total line
    doc.strokeColor('#2563eb')
       .lineWidth(2)
       .moveTo(50, yPosition)
       .lineTo(545, yPosition)
       .stroke();

    yPosition += 10;

    // Subtotal, Tax, Total
  const tax = Number(invoiceData?.tax) || 0;
  const discount = Number(invoiceData?.discount) || 0;
    const total = subtotal + tax - discount;

    doc.fontSize(11)
       .fillColor('#000000')
       .text('Subtotal:', 365, yPosition, { width: 80, align: 'right' })
       .text(`${invoiceData?.currency || 'USD'} ${subtotal.toFixed(2)}`, 445, yPosition, { width: 95, align: 'right' });

    if (tax > 0) {
      yPosition += 20;
      doc.text('Tax:', 365, yPosition, { width: 80, align: 'right' })
         .text(`${invoiceData?.currency || 'USD'} ${tax.toFixed(2)}`, 445, yPosition, { width: 95, align: 'right' });
    }

    if (discount > 0) {
      yPosition += 20;
      doc.fillColor('#ef4444')
         .text('Discount:', 365, yPosition, { width: 80, align: 'right' })
         .text(`-${invoiceData?.currency || 'USD'} ${discount.toFixed(2)}`, 445, yPosition, { width: 95, align: 'right' });
    }

    yPosition += 20;
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Total:', 365, yPosition, { width: 80, align: 'right' })
       .text(`${invoiceData?.currency || 'USD'} ${total.toFixed(2)}`, 445, yPosition, { width: 95, align: 'right' });

    // --- Notes/Terms ---
    if (invoiceData?.notes) {
      doc.moveDown(3);
      doc.fontSize(12).fillColor('#000000').text('Notes:', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#666666').text(invoiceData.notes, { width: 495 });
    }

    // --- Footer ---
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         'Thank you for your business!',
         50,
         doc.page.height - 50,
         { align: 'center', width: 495 }
       );

    // Finalize PDF
    doc.end();
    
    console.log(`✅ Successfully generated PDF for invoice ${invoiceId}`);

  } catch (err: any) {
    console.error('PDF generation error:', err);
    console.error('Error stack:', err.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate invoice PDF',
        details: err.message 
      });
    }
  }
});

// --- Public JSON invoice endpoint (bypasses client Firestore rules) ---
// Use this for public invoice pages to avoid client-side permission issues.
app.get('/public/invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Try the legacy invoices collection first
    let invoiceDoc = await db.collection('invoices').doc(invoiceId).get();

    // If not found, try businessInvoices
    if (!invoiceDoc.exists) {
      invoiceDoc = await db.collection('businessInvoices').doc(invoiceId).get();
    }

    if (!invoiceDoc.exists) return res.status(404).json({ error: 'Invoice not found' });

    const invoiceData = invoiceDoc.data();
    if (!invoiceData?.isPublic) return res.status(403).json({ error: 'Invoice is not public' });

    // Return the invoice data as JSON (sanitize sensitive fields if needed)
    return res.status(200).json({ id: invoiceDoc.id, ...invoiceData });
  } catch (err) {
    console.error('Error in public invoice endpoint:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Download transactions as CSV ---
app.get('/download/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get();
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());

    if (!transactions.length) return res.status(404).send('No transactions found');

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(transactions);

    res.setHeader('Content-Disposition', `attachment; filename=transactions-${userId}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate transactions CSV');
  }
});

// --- Export Express app as Firebase Function (Gen 2) with cost-optimized scaling ---
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',       // Sufficient for PDF generation and API calls
    timeoutSeconds: 60,     // 60 seconds for PDF/CSV generation
    maxInstances: 20,       // Limit to 20 instances maximum
  },
  app
);

// Temporary alias to avoid name conflict while Cloud Run 'api' service exists
export const api2 = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 20,
  },
  app
);

// Re-export triggers so the CLI discovers them consistently
export {
  onNewLogin,
  onBusinessStatusChange,
  onTransactionStatusChange,
  onPaymentLinkCreated,
  onInvoiceStatusChange,
  sendInvoiceReminders,
};



// =============================================================
// === OneSignal Email Integration (KYC verification trigger) ===
// =============================================================

// OneSignal config - using environment variables (v2 compatible)
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || '';

// OneSignal client
// The OneSignal SDK types are strict; cast the configuration to any to avoid type mismatch
const configuration = OneSignal.createConfiguration({
  apiKey: ONESIGNAL_API_KEY,
} as any);
const client = new OneSignal.DefaultApi(configuration);

// Helper to send welcome email using a template
async function sendVerificationWelcomeEmail(toEmail: string, toName: string) {
  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_APP_ID;
  notification.include_email_tokens = [toEmail];
  notification.template_id = 'e93c127c-9194-4799-b545-4a91cfc3226b'; // Your OneSignal template ID

  try {
    const response = await client.createNotification(notification);
    console.log(`✅ Welcome email sent to ${toEmail} (${response.id})`);
  } catch (error: any) {
    console.error('❌ Error sending OneSignal email:', error.body || error);
  }
}

// Firestore trigger: send email when KYC becomes "Verified"
