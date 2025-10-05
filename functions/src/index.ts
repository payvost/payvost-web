import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const app = express();
app.use(cors());

// Test route
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

// Export Express app as Firebase Function
export const api = functions.https.onRequest(app);
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const app = express();
app.use(cors());

// Test route
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

// Export Express app as Firebase Function
export const api = functions.https.onRequest(app);
