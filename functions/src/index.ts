import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import * as OneSignal from '@onesignal/node-onesignal';

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
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) return res.status(404).send('Invoice not found');
    const invoiceData = invoiceDoc.data();

    // Only allow download if invoice is public
    if (!invoiceData?.isPublic) {
      return res.status(403).send('Invoice is not public');
    }

    const doc = new PDFDocument({ size: 'A4' });
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);
    doc.fontSize(20).text(`Invoice #${invoiceId}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Customer: ${invoiceData?.customerName}`);
    doc.text(`Amount: ${invoiceData?.amount} ${invoiceData?.currency}`);
    doc.text(`Due Date: ${invoiceData?.dueDate}`);
    doc.text(`Description: ${invoiceData?.description}`);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate invoice PDF');
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

// --- Export Express app as Firebase Function ---
export const api = functions.https.onRequest(app);



// =============================================================
// === OneSignal Email Integration (KYC verification trigger) ===
// =============================================================

// OneSignal config
const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID || functions.config().onesignal?.app_id;
const ONESIGNAL_API_KEY =
  process.env.ONESIGNAL_API_KEY || functions.config().onesignal?.api_key;

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
export const sendWelcomeEmailOnKYCVerified = (functions.firestore as any)
  .document('users/{userId}')
  .onUpdate(async (change: any, context: any) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.kycStatus !== 'Verified' && after.kycStatus === 'Verified') {
      const email = after.email;
      const name = after.fullName || after.displayName || 'Valued User';
      console.log(`🎉 Sending welcome email to ${email}`);
      await sendVerificationWelcomeEmail(email, name);
    }
  });
