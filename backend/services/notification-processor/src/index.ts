import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { prisma } from './prisma';
import { sendEmailViaMailgun } from './mailgun';
import { invoiceReminderCronJob } from './cron-jobs';
import {
  renderInvoiceEmail,
  renderKycEmail,
  renderLoginEmail,
  renderPaymentLinkEmail,
  renderTransactionEmail,
  renderBusinessEmail,
  type RenderedEmail,
} from './email-templates';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3006;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Middleware
app.use(cors());
app.use(express.json());

type NotifyRequest = Request & {
  body: Record<string, any>;
};

function formatTimestamp(value?: Date | string): string {
  if (!value) return new Date().toISOString();
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function isAuthorized(req: Request): boolean {
  if (!INTERNAL_TOKEN) return false;
  const token = req.headers['x-internal-token'];
  return typeof token === 'string' && token === INTERNAL_TOKEN;
}

function renderByType(type: string, payload: Record<string, any>): RenderedEmail {
  const t = (type || '').toLowerCase().trim();

  // Support legacy type ids from various callers
  if (t === 'login' || t === 'login-notification' || t === 'login_notification' || t === 'login_alert') {
    return renderLoginEmail({
      to: payload.email || payload.to,
      name: payload.name,
      device: payload.deviceInfo || payload.device,
      location: payload.location,
      ipAddress: payload.ipAddress,
      timestamp: payload.timestamp,
    });
  }

  if (t === 'kyc' || t === 'kyc-approved' || t === 'kyc_verified' || t === 'kyc-approved-template') {
    return renderKycEmail({
      to: payload.email || payload.to,
      name: payload.name,
      status: 'approved',
      reason: payload.reason,
      nextSteps: payload.nextSteps,
    });
  }

  if (t === 'kyc-rejected' || t === 'kyc_rejected') {
    return renderKycEmail({
      to: payload.email || payload.to,
      name: payload.name,
      status: 'rejected',
      reason: payload.reason,
      nextSteps: payload.nextSteps,
    });
  }

  if (t === 'transaction' || t === 'transaction-success' || t === 'transaction_success') {
    return renderTransactionEmail({
      to: payload.email || payload.to,
      name: payload.name,
      status: payload.status || (t.includes('success') ? 'success' : 'initiated'),
      amount: payload.amount,
      currency: payload.currency,
      recipientName: payload.recipientName || payload.recipient,
      transactionId: payload.transactionId,
      reason: payload.reason,
    });
  }

  if (t === 'transaction-failed' || t === 'transaction_failed') {
    return renderTransactionEmail({
      to: payload.email || payload.to,
      name: payload.name,
      status: 'failed',
      amount: payload.amount,
      currency: payload.currency,
      recipientName: payload.recipientName || payload.recipient,
      transactionId: payload.transactionId,
      reason: payload.reason,
    });
  }

  if (t === 'invoice' || t === 'invoice-generated' || t === 'invoice_generated') {
    return renderInvoiceEmail({
      to: payload.email || payload.to,
      name: payload.name || payload.customerName,
      type: payload.type || 'generated',
      invoiceNumber: payload.invoiceNumber || payload.invoice_number,
      amount: payload.amount,
      currency: payload.currency,
      dueDate: payload.dueDate || payload.due_date,
      businessName: payload.businessName || payload.business_name,
      downloadLink: payload.downloadLink || payload.download_link,
    });
  }

  if (t === 'invoice-reminder' || t === 'invoice_reminder') {
    return renderInvoiceEmail({
      to: payload.email || payload.to,
      name: payload.name || payload.customerName,
      type: 'reminder',
      invoiceNumber: payload.invoiceNumber || payload.invoice_number,
      amount: payload.amount,
      currency: payload.currency,
      dueDate: payload.dueDate || payload.due_date,
      businessName: payload.businessName || payload.business_name,
      downloadLink: payload.downloadLink || payload.download_link,
    });
  }

  if (t === 'invoice-paid' || t === 'invoice_paid') {
    return renderInvoiceEmail({
      to: payload.email || payload.to,
      name: payload.name || payload.customerName,
      type: 'paid',
      invoiceNumber: payload.invoiceNumber || payload.invoice_number,
      amount: payload.amount,
      currency: payload.currency,
      dueDate: payload.dueDate || payload.due_date,
      businessName: payload.businessName || payload.business_name,
      downloadLink: payload.downloadLink || payload.download_link,
    });
  }

  if (t === 'payment-link' || t === 'payment_link') {
    return renderPaymentLinkEmail({
      to: payload.email || payload.to,
      name: payload.name,
      amount: payload.amount,
      currency: payload.currency,
      paymentLink: payload.paymentLink,
      expiryDate: payload.expiryDate,
      description: payload.description,
    });
  }

  if (t === 'business') {
    return renderBusinessEmail({
      to: payload.email || payload.to,
      name: payload.name,
      status: payload.status === 'approved' ? 'approved' : 'rejected',
      businessName: payload.businessName || payload.business_name || 'Business',
      reason: payload.reason,
      nextSteps: payload.nextSteps,
    });
  }

  // Fallback: treat as a generic transaction update to avoid silent failure
  return renderTransactionEmail({
    to: payload.email || payload.to,
    name: payload.name,
    status: 'initiated',
    amount: payload.amount,
    currency: payload.currency,
    recipientName: payload.recipientName || payload.recipient,
    transactionId: payload.transactionId,
    reason: payload.reason,
  });
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-processor',
    timestamp: new Date().toISOString(),
    mailgunConfigured: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Payvost Notification Processor',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      send: 'POST /send',
      test: 'GET /test',
    },
  });
});

// New: Notification endpoints used by the frontend webhook client
app.post('/notify/login', async (req: NotifyRequest, res: Response) => {
  try {
    const { email, name, deviceInfo, location, timestamp, ipAddress } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const rendered = renderLoginEmail({
      to: email,
      name: name || 'User',
      device: deviceInfo || 'Unknown',
      location: location || 'Unknown',
      timestamp: formatTimestamp(timestamp),
      ipAddress: ipAddress || 'Unknown',
    });

    const result = await sendEmailViaMailgun({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending login notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send login notification' });
  }
});

app.post('/notify/kyc', async (req: NotifyRequest, res: Response) => {
  try {
    const { email, name, status, reason, nextSteps } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const rendered = renderKycEmail({
      to: email,
      name: name || 'User',
      status: status === 'approved' ? 'approved' : 'rejected',
      reason,
      nextSteps,
    });

    const result = await sendEmailViaMailgun({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending KYC notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send KYC notification' });
  }
});

app.post('/notify/business', async (req: NotifyRequest, res: Response) => {
  try {
    const { email, name, status, businessName, reason, nextSteps } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    if (!businessName) {
      return res.status(400).json({ error: 'Missing required field: businessName' });
    }

    const rendered = renderBusinessEmail({
      to: email,
      name: name || 'User',
      status: status === 'approved' ? 'approved' : 'rejected',
      businessName,
      reason,
      nextSteps,
    });

    const result = await sendEmailViaMailgun({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending business notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send business notification' });
  }
});

app.post('/notify/transaction', async (req: NotifyRequest, res: Response) => {
  try {
    const { email, name, transactionId, amount, currency, status, recipientName, reason } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const rendered = renderTransactionEmail({
      to: email,
      name: name || 'User',
      status: status || 'initiated',
      amount,
      currency,
      recipientName,
      transactionId,
      reason,
    });

    const result = await sendEmailViaMailgun({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending transaction notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send transaction notification' });
  }
});

app.post('/notify/payment-link', async (req: NotifyRequest, res: Response) => {
  try {
    const { email, name, amount, currency, paymentLink, expiryDate, description } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const rendered = renderPaymentLinkEmail({
      to: email,
      name: name || 'User',
      amount,
      currency,
      paymentLink,
      expiryDate,
      description,
    });

    const result = await sendEmailViaMailgun({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending payment link notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send payment link notification' });
  }
});

app.post('/notify/invoice', async (req: NotifyRequest, res: Response) => {
  try {
    const { email, name, invoiceNumber, amount, currency, dueDate, businessName, downloadLink, type } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const rendered = renderInvoiceEmail({
      to: email,
      name: name || 'User',
      type: type || 'generated',
      invoiceNumber,
      amount,
      currency,
      dueDate,
      businessName,
      downloadLink,
    });

    const result = await sendEmailViaMailgun({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending invoice notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send invoice notification' });
  }
});

// Debug-only: echoes payload to verify request routing
app.post('/notify/test', (req: NotifyRequest, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  res.json({
    success: true,
    receivedAt: new Date().toISOString(),
    body: req.body || {},
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    },
  });
});

// Debug-only: render an email without sending it (useful for verifying HTML quickly)
app.post('/notify/preview', (req: NotifyRequest, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { type, variables } = req.body || {};
  if (!type) return res.status(400).json({ success: false, error: 'Missing required field: type' });

  const payload = { ...(variables || {}), email: variables?.email || 'preview@example.com' };
  const rendered = renderByType(String(type), payload);
  return res.json({ success: true, subject: rendered.subject, tags: rendered.tags, html: rendered.html, text: rendered.text });
});

// Debug-only: sends one email per supported trigger to a single recipient
app.post('/notify/test-all', async (req: NotifyRequest, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: 'Missing required field: email' });
  }

  const tests: Array<{ type: string; vars: Record<string, any> }> = [
    { type: 'login', vars: { email, name: 'Test User', deviceInfo: 'Chrome', location: 'Unknown', ipAddress: '127.0.0.1', timestamp: new Date().toISOString() } },
    { type: 'kyc-approved', vars: { email, name: 'Test User', status: 'approved' } },
    { type: 'kyc-rejected', vars: { email, name: 'Test User', status: 'rejected', reason: 'Document image unclear', nextSteps: 'Re-upload a clear photo of the document.' } },
    { type: 'transaction-success', vars: { email, name: 'Test User', status: 'success', amount: 500, currency: 'USD', recipientName: 'John Doe', transactionId: 'TXN-TEST-001' } },
    { type: 'transaction-failed', vars: { email, name: 'Test User', status: 'failed', amount: 500, currency: 'USD', recipientName: 'John Doe', transactionId: 'TXN-TEST-002', reason: 'Insufficient funds' } },
    { type: 'invoice-generated', vars: { email, name: 'Test User', type: 'generated', invoiceNumber: 'INV-TEST-001', amount: 1000, currency: 'USD', dueDate: new Date().toISOString(), businessName: 'Payvost', downloadLink: 'https://payvost.com/invoice/INV-TEST-001' } },
    { type: 'invoice-reminder', vars: { email, name: 'Test User', type: 'reminder', invoiceNumber: 'INV-TEST-002', amount: 1000, currency: 'USD', dueDate: new Date().toISOString(), businessName: 'Payvost', downloadLink: 'https://payvost.com/invoice/INV-TEST-002' } },
    { type: 'invoice-paid', vars: { email, name: 'Test User', type: 'paid', invoiceNumber: 'INV-TEST-003', amount: 1000, currency: 'USD', dueDate: new Date().toISOString(), businessName: 'Payvost', downloadLink: 'https://payvost.com/invoice/INV-TEST-003' } },
    { type: 'payment-link', vars: { email, name: 'Test User', amount: 250, currency: 'USD', paymentLink: 'https://payvost.com/pay/TEST', expiryDate: new Date(Date.now() + 86400000).toISOString(), description: 'Test payment link' } },
    { type: 'business', vars: { email, name: 'Test User', status: 'approved', businessName: 'Test Business Ltd' } },
  ];

  const results: Array<{ type: string; ok: boolean; messageId?: string; error?: string }> = [];
  for (const t of tests) {
    try {
      const rendered = renderByType(t.type, t.vars);
      const r = await sendEmailViaMailgun({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        tags: rendered.tags,
      });
      results.push({ type: t.type, ok: true, messageId: r.id });
    } catch (e: any) {
      results.push({ type: t.type, ok: false, error: e?.message || String(e) });
    }
  }

  return res.json({ success: true, count: results.length, results });
});

// Send notification endpoint
app.post('/send', async (req: Request, res: Response) => {
  try {
    const { type, email, subject, variables } = req.body;

    // Validate required fields
    if (!email || !type) {
      return res.status(400).json({
        error: 'Missing required fields: email, type',
      });
    }

    const payload = { ...(variables || {}), email };
    const rendered = renderByType(type, payload);

    const result = await sendEmailViaMailgun({
      to: email,
      subject: subject || rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: rendered.tags,
    });

    res.json({
      success: true,
      messageId: result.id,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});

// Test endpoint
app.get('/test', (_req: Request, res: Response) => {
  res.json({
    message: 'Notification processor is running',
    availableEndpoints: {
      'POST /send': 'Send a notification',
      'GET /health': 'Health check',
      'GET /': 'Service info',
    },
  });
});

// Initialize cron jobs
function initializeCronJobs() {
  console.log('🕐 Initializing cron jobs...');

  if (process.env.INVOICE_REMINDER_ENABLED === 'true') {
    const schedule = process.env.INVOICE_REMINDER_SCHEDULE || '0 9 * * *'; // Default: 9 AM UTC daily
    console.log(`📅 Scheduling invoice reminder cron job: ${schedule}`);

    cron.schedule(schedule, async () => {
      console.log('⏰ Running invoice reminder cron job...');
      try {
        await invoiceReminderCronJob();
        console.log('✅ Invoice reminder cron job completed successfully');
      } catch (error) {
        console.error('❌ Error running invoice reminder cron job:', error);
      }
    });
  }

  console.log('✅ Cron jobs initialized');
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     🚀 Notification Processor Started                  ║
║     Port: ${PORT}                                           ║
║     Environment: ${process.env.NODE_ENV || 'development'}                            ║
║     Timestamp: ${new Date().toISOString()}  ║
╚════════════════════════════════════════════════════════╝
  `);

  // Initialize cron jobs after server starts
  initializeCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
