import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { prisma } from './prisma';
import { sendEmailViaMailgun } from './mailgun';
import { invoiceReminderCronJob } from './cron-jobs';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3006;

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

function buildTemplateAndSubject(kind: string, payload: Record<string, any>) {
  const subjectOverride = payload.subject;
  switch (kind) {
    case 'login': {
      return {
        template: 'login-notification',
        subject: subjectOverride || 'New login to your Payvost account',
      };
    }
    case 'kyc': {
      const status = payload.status === 'approved' ? 'approved' : 'rejected';
      return {
        template: status === 'approved' ? 'kyc-approved' : 'kyc-rejected',
        subject: subjectOverride || (status === 'approved' ? 'KYC Approved' : 'KYC Rejected'),
      };
    }
    case 'business': {
      const status = payload.status === 'approved' ? 'approved' : 'rejected';
      return {
        template: status === 'approved' ? 'business-approved' : 'business-rejected',
        subject: subjectOverride || (status === 'approved' ? 'Business Approved' : 'Business Review Complete'),
      };
    }
    case 'transaction': {
      const status = payload.status || 'initiated';
      const template =
        status === 'success' ? 'transaction-success' :
        status === 'failed' ? 'transaction-failed' :
        'transaction-initiated';
      const subject =
        status === 'success' ? 'Transaction Successful' :
        status === 'failed' ? 'Transaction Failed' :
        'Transaction Initiated';
      return { template, subject: subjectOverride || subject };
    }
    case 'payment-link': {
      return {
        template: 'payment-link',
        subject: subjectOverride || 'Payment Link Created',
      };
    }
    case 'invoice': {
      const type = payload.type || 'generated';
      const template =
        type === 'paid' ? 'invoice-paid' :
        type === 'reminder' ? 'invoice-reminder' :
        'invoice-generated';
      const subject =
        type === 'paid' ? 'Invoice Paid' :
        type === 'reminder' ? 'Invoice Reminder' :
        'Invoice Generated';
      return { template, subject: subjectOverride || subject };
    }
    default:
      return { template: payload.template || 'general', subject: subjectOverride || 'Notification' };
  }
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

    const { template, subject } = buildTemplateAndSubject('login', req.body || {});

    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template,
      variables: {
        name: name || 'User',
        deviceInfo: deviceInfo || 'Unknown',
        device: deviceInfo || 'Unknown',
        location: location || 'Unknown',
        timestamp: formatTimestamp(timestamp),
        ipAddress: ipAddress || 'Unknown',
      },
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

    const { template, subject } = buildTemplateAndSubject('kyc', { ...req.body, status });

    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template,
      variables: {
        name: name || 'User',
        status: status || 'rejected',
        reason: reason || '',
        nextSteps: nextSteps || '',
      },
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

    const { template, subject } = buildTemplateAndSubject('business', { ...req.body, status });

    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template,
      variables: {
        name: name || 'User',
        status: status || 'rejected',
        businessName: businessName || 'Business',
        reason: reason || '',
        nextSteps: nextSteps || '',
      },
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

    const { template, subject } = buildTemplateAndSubject('transaction', { ...req.body, status });

    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template,
      variables: {
        name: name || 'User',
        transactionId: transactionId || '',
        amount: amount != null ? String(amount) : '',
        currency: currency || '',
        status: status || 'initiated',
        recipientName: recipientName || '',
        reason: reason || '',
        date: new Date().toLocaleString(),
      },
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

    const { template, subject } = buildTemplateAndSubject('payment-link', req.body || {});

    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template,
      variables: {
        name: name || 'User',
        amount: amount != null ? String(amount) : '',
        currency: currency || '',
        paymentLink: paymentLink || '',
        expiryDate: expiryDate ? formatTimestamp(expiryDate) : '',
        description: description || '',
      },
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

    const { template, subject } = buildTemplateAndSubject('invoice', { ...req.body, type });

    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template,
      variables: {
        name: name || 'User',
        invoiceNumber: invoiceNumber || '',
        invoice_number: invoiceNumber || '',
        amount: amount != null ? String(amount) : '',
        currency: currency || '',
        dueDate: dueDate ? formatTimestamp(dueDate) : '',
        due_date: dueDate ? formatTimestamp(dueDate) : '',
        businessName: businessName || 'Payvost',
        business_name: businessName || 'Payvost',
        downloadLink: downloadLink || '',
        download_link: downloadLink || '',
        type: type || 'generated',
      },
    });

    return res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Error sending invoice notification:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send invoice notification' });
  }
});

// Send notification endpoint
app.post('/send', async (req: Request, res: Response) => {
  try {
    const { type, email, subject, template, variables } = req.body;

    // Validate required fields
    if (!email || !type || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: email, type, subject',
      });
    }

    // Send email
    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template: template || type,
      variables: variables || {},
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
