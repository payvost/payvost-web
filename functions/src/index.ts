import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

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
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://www.payvost.com';
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || '';


// === Express App for API routes ===
const app = express();
app.use(cors());

// --- Test route ---
app.get('/', (_req, res) => {
  res.send('API is working via Firebase Functions 🚀');
});

// --- Download invoice as PDF (proxy to Cloud Run PDF service) ---
app.get('/download/invoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  if (!invoiceId || typeof invoiceId !== 'string') {
    return res.status(400).send('Invalid invoice id');
  }

  // Validate invoice exists and is public
  let invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
  if (!invoiceDoc.exists) {
    invoiceDoc = await db.collection('businessInvoices').doc(invoiceId).get();
  }
  if (!invoiceDoc.exists) return res.status(404).send('Invoice not found');
  const invoiceData: any = invoiceDoc.data();
  if (!invoiceData?.isPublic) return res.status(403).send('Invoice is not public');

  if (!PDF_SERVICE_URL) {
    console.error('Missing PDF_SERVICE_URL environment variable');
    return res.status(500).send('PDF service not configured');
  }

  try {
    // Build the public invoice URL with print=1 for print-friendly CSS
    const invoiceUrl = new URL(`${PUBLIC_SITE_URL.replace(/\/$/, '')}/invoice/${invoiceId}`);
    invoiceUrl.searchParams.set('print', '1');

    const target = `${PDF_SERVICE_URL.replace(/\/$/, '')}/pdf?url=${encodeURIComponent(invoiceUrl.toString())}`;

    const resp = await fetch(target, { method: 'GET' });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('PDF service error', resp.status, text);
      return res.status(502).send('Failed to render PDF');
    }

    // Stream/forward the PDF back to the client
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/pdf');
    const cd = resp.headers.get('content-disposition') || `attachment; filename=invoice-${invoiceId}.pdf`;
    res.setHeader('Content-Disposition', cd);

    const buf = Buffer.from(await resp.arrayBuffer());
    return res.status(200).send(buf);
  } catch (err: any) {
    console.error('Error proxying to PDF service:', err?.message || err);
    return res.status(500).send('Internal server error');
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
    memory: '1GiB',         // headless Chrome needs more memory
    timeoutSeconds: 120,    // allow time for page rendering
    maxInstances: 20,       // cap burst cost
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
