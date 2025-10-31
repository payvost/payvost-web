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
exports.sendInvoiceReminders = exports.onInvoiceStatusChange = exports.onPaymentLinkCreated = exports.onTransactionStatusChange = exports.onBusinessStatusChange = exports.onNewLogin = exports.api2 = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const puppeteer_1 = __importDefault(require("puppeteer"));
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
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://www.payvost.com';
// === Express App for API routes ===
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// --- Test route ---
app.get('/', (_req, res) => {
    res.send('API is working via Firebase Functions 🚀');
});
// --- Download invoice as PDF (Puppeteer, 1:1 with public page) ---
app.get('/download/invoice/:invoiceId', async (req, res) => {
    const { invoiceId } = req.params;
    if (!invoiceId || typeof invoiceId !== 'string') {
        return res.status(400).send('Invalid invoice id');
    }
    // Fetch invoice data server-side to ensure access and data completeness
    // Try both collections
    let invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
        invoiceDoc = await db.collection('businessInvoices').doc(invoiceId).get();
    }
    if (!invoiceDoc.exists) {
        return res.status(404).send('Invoice not found');
    }
    const invoiceData = invoiceDoc.data();
    if (!invoiceData?.isPublic) {
        return res.status(403).send('Invoice is not public');
    }
    const safe = (v) => (v ?? '').toString();
    const currency = invoiceData.currency || 'USD';
    const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
    const rowsHtml = (items.length ? items : [{ description: invoiceData.description || 'Item', quantity: 1, price: invoiceData.amount || 0 }])
        .map((it) => {
        const q = Number(it.quantity) || 1;
        const p = Number(it.price ?? it.amount) || 0;
        const t = q * p;
        return `<tr>
        <td>${safe(it.description ?? it.name ?? 'Item')}</td>
        <td class="center">${q}</td>
        <td class="right">${currency} ${p.toFixed(2)}</td>
        <td class="right">${currency} ${t.toFixed(2)}</td>
      </tr>`;
    })
        .join('');
    const subtotal = (items.length ? items : [{ quantity: 1, price: Number(invoiceData.amount) || 0 }])
        .reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.price ?? it.amount) || 0), 0);
    const tax = Number(invoiceData.tax || 0);
    const discount = Number(invoiceData.discount || 0);
    const total = subtotal + tax - discount;
    const issueDate = invoiceData.issueDate?.toDate?.()?.toLocaleDateString?.() || invoiceData.createdAt?.toDate?.()?.toLocaleDateString?.() || '';
    const dueDate = invoiceData.dueDate?.toDate?.()?.toLocaleDateString?.() || safe(invoiceData.dueDate || '');
    const status = safe(invoiceData.status || 'Pending');
    const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Invoice ${invoiceId}</title>
      <style>
        :root { --primary:#2563eb; --muted:#6b7280; --border:#e5e7eb; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; margin: 0; padding: 24px; color: #0f172a; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:#f8fafc; border-radius:12px; border:1px solid var(--border); }
        .title { color: var(--primary); font-size: 24px; font-weight: 700; margin:0; }
        .badge { padding:6px 10px; border-radius:10px; font-weight:600; font-size:14px; background:#e5f0ff; color:#1e40af; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin:20px 0; }
        .section h3 { margin:0 0 6px 0; font-size:14px; font-weight:600; }
        .muted { color: var(--muted); font-size:12px; }
        table { width:100%; border-collapse: collapse; margin-top:16px; }
        th, td { padding:12px; border-bottom:1px solid var(--border); font-size: 14px; }
        th { text-align:left; color:#334155; background:#f8fafc; }
        .center { text-align:center; }
        .right { text-align:right; }
        .totals { width:100%; display:flex; justify-content:flex-end; margin-top:16px; }
        .totals-box { width:320px; }
        .row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
        .row .label { color: var(--muted); }
        .grand { font-weight:800; font-size:18px; padding-top:10px; border-top:1px solid var(--border); margin-top:8px; }
        .notes { margin-top:20px; }
        .notes h4 { margin:0 0 6px 0; font-size:14px; font-weight:600; }
        .notes p { margin:0; color: var(--muted); font-size:13px; }
        @media print { body { padding:0; } .header { border:none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <div class="title">INVOICE</div>
            <div class="muted"># ${invoiceId}</div>
          </div>
          <div class="badge">${status}</div>
        </div>
        <div class="grid">
          <div class="section">
            <h3>Billed To</h3>
            <div>${safe(invoiceData.toName)}</div>
            <div class="muted">${safe(invoiceData.toAddress)}</div>
            <div class="muted">${safe(invoiceData.toEmail)}</div>
          </div>
          <div class="section">
            <h3>From</h3>
            <div>${safe(invoiceData.fromName)}</div>
            <div class="muted">${safe(invoiceData.fromAddress)}</div>
            <div class="muted">Issue: ${issueDate || '-'}</div>
            <div class="muted">Due: ${dueDate || '-'}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:60%">Description</th>
              <th class="center">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-box">
            <div class="row"><span class="label">Subtotal</span><span>${currency} ${subtotal.toFixed(2)}</span></div>
            ${tax > 0 ? `<div class="row"><span class="label">Tax</span><span>${currency} ${tax.toFixed(2)}</span></div>` : ''}
            ${discount > 0 ? `<div class="row"><span class="label">Discount</span><span>- ${currency} ${discount.toFixed(2)}</span></div>` : ''}
            <div class="row grand"><span>Grand Total</span><span>${currency} ${(total).toFixed(2)}</span></div>
          </div>
        </div>
        ${invoiceData.notes ? `<div class="notes"><h4>Notes</h4><p>${safe(invoiceData.notes)}</p></div>` : ''}
      </div>
    </body>
  </html>`;
    let browser = null;
    try {
        browser = await puppeteer_1.default.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36');
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            preferCSSPageSize: true,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
        res.send(pdfBuffer);
    }
    catch (err) {
        console.error('Puppeteer PDF generation failed, falling back to PDFKit:', err?.message || err);
        // Fallback to PDFKit rendering to avoid broken downloads
        try {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
            res.setHeader('Content-Type', 'application/pdf');
            doc.on('error', (e) => console.error('PDFKit error:', e));
            doc.pipe(res);
            // Header
            doc.fontSize(24).fillColor('#2563eb').text('INVOICE', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('#666666').text(`# ${invoiceId}`, { align: 'center' });
            doc.moveDown(1.5);
            // Billed To / From
            doc.fontSize(14).fillColor('#000').text('Billed To', 50, doc.y, { continued: false });
            doc.fontSize(10).fillColor('#000').text(safe(invoiceData.toName));
            if (invoiceData.toAddress)
                doc.fillColor('#666').text(safe(invoiceData.toAddress));
            if (invoiceData.toEmail)
                doc.fillColor('#666').text(safe(invoiceData.toEmail));
            doc.moveDown(0.8);
            doc.fontSize(14).fillColor('#000').text('From', 50, doc.y);
            doc.fontSize(10).fillColor('#000').text(safe(invoiceData.fromName));
            if (invoiceData.fromAddress)
                doc.fillColor('#666').text(safe(invoiceData.fromAddress));
            if (issueDate || dueDate) {
                doc.fillColor('#666').text(`Issue: ${issueDate || '-'}`);
                doc.fillColor('#666').text(`Due: ${dueDate || '-'}`);
            }
            doc.moveDown(1);
            // Table header
            const tableTop = doc.y;
            doc.fontSize(10).fillColor('#ffffff').rect(50, tableTop, 495, 20).fill('#2563eb');
            doc.fillColor('#ffffff')
                .text('Description', 55, tableTop + 5, { width: 250 })
                .text('Qty', 305, tableTop + 5, { width: 60, align: 'center' })
                .text('Price', 365, tableTop + 5, { width: 80, align: 'right' })
                .text('Total', 445, tableTop + 5, { width: 95, align: 'right' });
            let y = tableTop + 25;
            const list = items.length ? items : [{ description: invoiceData.description || 'Item', quantity: 1, price: Number(invoiceData.amount) || 0 }];
            list.forEach((it, i) => {
                const q = Number(it.quantity) || 1;
                const p = Number(it.price ?? it.amount) || 0;
                const t = q * p;
                doc.fillColor('#000')
                    .text(safe(it.description ?? it.name ?? 'Item'), 55, y, { width: 250 })
                    .text(String(q), 305, y, { width: 60, align: 'center' })
                    .text(`${currency} ${p.toFixed(2)}`, 365, y, { width: 80, align: 'right' })
                    .text(`${currency} ${t.toFixed(2)}`, 445, y, { width: 95, align: 'right' });
                y += 25;
                if (i < list.length - 1) {
                    doc.strokeColor('#e5e7eb').moveTo(50, y - 5).lineTo(545, y - 5).stroke();
                }
            });
            // Totals
            doc.strokeColor('#2563eb').lineWidth(2).moveTo(50, y).lineTo(545, y).stroke();
            y += 10;
            doc.fontSize(11).fillColor('#000')
                .text('Subtotal:', 365, y, { width: 80, align: 'right' })
                .text(`${currency} ${subtotal.toFixed(2)}`, 445, y, { width: 95, align: 'right' });
            if (tax > 0) {
                y += 20;
                doc.text('Tax:', 365, y, { width: 80, align: 'right' })
                    .text(`${currency} ${tax.toFixed(2)}`, 445, y, { width: 95, align: 'right' });
            }
            if (discount > 0) {
                y += 20;
                doc.fillColor('#ef4444').text('Discount:', 365, y, { width: 80, align: 'right' })
                    .text(`-${currency} ${discount.toFixed(2)}`, 445, y, { width: 95, align: 'right' });
            }
            y += 20;
            doc.fontSize(14).fillColor('#2563eb').text('Total:', 365, y, { width: 80, align: 'right' })
                .text(`${currency} ${total.toFixed(2)}`, 445, y, { width: 95, align: 'right' });
            if (invoiceData.notes) {
                doc.moveDown(2);
                doc.fontSize(12).fillColor('#000').text('Notes:', { underline: true });
                doc.fontSize(10).fillColor('#666').text(safe(invoiceData.notes), { width: 495 });
            }
            doc.end();
        }
        catch (fallbackErr) {
            console.error('PDFKit fallback also failed:', fallbackErr?.message || fallbackErr);
            if (!res.headersSent)
                res.status(500).send('Failed to generate invoice PDF');
        }
    }
    finally {
        if (browser)
            await browser.close().catch(() => { });
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
// --- Export Express app as Firebase Function (Gen 2) with cost-optimized scaling ---
exports.api = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '512MiB', // Sufficient for PDF generation and API calls
    timeoutSeconds: 60, // 60 seconds for PDF/CSV generation
    maxInstances: 20, // Limit to 20 instances maximum
}, app);
// Temporary alias to avoid name conflict while Cloud Run 'api' service exists
exports.api2 = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '1GiB', // headless Chrome needs more memory
    timeoutSeconds: 120, // allow time for page rendering
    maxInstances: 20, // cap burst cost
}, app);
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
// Firestore trigger: send email when KYC becomes "Verified"
