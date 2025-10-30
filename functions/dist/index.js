"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvoiceReminders = exports.onInvoiceStatusChange = exports.onPaymentLinkCreated = exports.onTransactionStatusChange = exports.onBusinessStatusChange = exports.onNewLogin = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const json2csv_1 = require("json2csv");
const OneSignal = __importStar(require("@onesignal/node-onesignal"));
// Import notification triggers
const notificationTriggers_1 = require("./notificationTriggers");
Object.defineProperty(exports, "onNewLogin", { enumerable: true, get: function () { return notificationTriggers_1.onNewLogin; } });
Object.defineProperty(exports, "onBusinessStatusChange", { enumerable: true, get: function () { return notificationTriggers_1.onBusinessStatusChange; } });
Object.defineProperty(exports, "onTransactionStatusChange", { enumerable: true, get: function () { return notificationTriggers_1.onTransactionStatusChange; } });
Object.defineProperty(exports, "onPaymentLinkCreated", { enumerable: true, get: function () { return notificationTriggers_1.onPaymentLinkCreated; } });
Object.defineProperty(exports, "onInvoiceStatusChange", { enumerable: true, get: function () { return notificationTriggers_1.onInvoiceStatusChange; } });
Object.defineProperty(exports, "sendInvoiceReminders", { enumerable: true, get: function () { return notificationTriggers_1.sendInvoiceReminders; } });
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
// === Express App for API routes ===
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// --- Test route ---
app.get('/', (_req, res) => {
    res.send('API is working via Firebase Functions 🚀');
});
// --- Download invoice as PDF ---
app.get('/download/invoice/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
        if (!invoiceDoc.exists)
            return res.status(404).send('Invoice not found');
        const invoiceData = invoiceDoc.data();
        // Only allow download if invoice is public
        if (!invoiceData?.isPublic) {
            return res.status(403).send('Invoice is not public');
        }
        const doc = new pdfkit_1.default({ size: 'A4' });
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Failed to generate invoice PDF');
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
        if (!invoiceDoc.exists)
            return res.status(404).json({ error: 'Invoice not found' });
        const invoiceData = invoiceDoc.data();
        if (!invoiceData?.isPublic)
            return res.status(403).json({ error: 'Invoice is not public' });
        // Return the invoice data as JSON (sanitize sensitive fields if needed)
        return res.status(200).json({ id: invoiceDoc.id, ...invoiceData });
    }
    catch (err) {
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
        if (!transactions.length)
            return res.status(404).send('No transactions found');
        const json2csvParser = new json2csv_1.Parser();
        const csv = json2csvParser.parse(transactions);
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${userId}.csv`);
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Failed to generate transactions CSV');
    }
});
// --- Export Express app as Firebase Function ---
exports.api = functions.https.onRequest(app);
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
});
const client = new OneSignal.DefaultApi(configuration);
// Helper to send welcome email using a template
async function sendVerificationWelcomeEmail(toEmail, toName) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [toEmail];
    notification.template_id = 'e93c127c-9194-4799-b545-4a91cfc3226b'; // Your OneSignal template ID
    try {
        const response = await client.createNotification(notification);
        console.log(`✅ Welcome email sent to ${toEmail} (${response.id})`);
    }
    catch (error) {
        console.error('❌ Error sending OneSignal email:', error.body || error);
    }
}
