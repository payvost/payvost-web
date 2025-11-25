import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3005;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Service URLs
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3006';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to call email service
async function sendEmailViaService(params: {
  to: string;
  subject: string;
  template?: string;
  templateVariables?: Record<string, any>;
  html?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // If template is provided, use Mailgun template
    // Otherwise use HTML
    const emailData: any = {
      to: params.to,
      subject: params.subject,
    };

    if (params.template) {
      // Use Mailgun template
      emailData.template = params.template;
      emailData.templateVariables = params.templateVariables || {};
    } else if (params.html) {
      emailData.html = params.html;
    } else {
      return { success: false, error: 'Either template or html must be provided' };
    }

    const response = await axios.post(`${EMAIL_SERVICE_URL}/single`, emailData, {
      headers: {
        'Content-Type': 'application/json',
        ...(INTERNAL_API_KEY && { 'X-API-Key': INTERNAL_API_KEY }),
      },
      timeout: 10000,
    });

    return {
      success: response.data.success || false,
      messageId: response.data.messageId,
      error: response.data.error,
    };
  } catch (error: any) {
    console.error('[Notification Service] Error calling email service:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send email',
    };
  }
}

// Helper function to format date for templates
function formatDateForTemplate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(date);
  }
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    emailServiceUrl: EMAIL_SERVICE_URL,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Payvost Notification Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      login: 'POST /notify/login',
      kyc: 'POST /notify/kyc',
      business: 'POST /notify/business',
      transaction: 'POST /notify/transaction',
      paymentLink: 'POST /notify/payment-link',
      invoice: 'POST /notify/invoice',
    },
  });
});

/**
 * POST /notify/login
 * Send login notification
 */
app.post('/notify/login', async (req: Request, res: Response) => {
  try {
    const { email, name, deviceInfo, location, timestamp, ipAddress } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name'],
      });
    }

    const firstName = name?.split(' ')[0] || name || 'there';

    const result = await sendEmailViaService({
      to: email,
      subject: 'New Login to Your Payvost Account',
      template: 'login-notification', // Your Mailgun template name
      templateVariables: {
        name: name || 'User',
        first_name: firstName,
        device_info: deviceInfo || 'Unknown',
        location: location || 'Unknown',
        timestamp: formatDateForTemplate(timestamp || new Date()),
        ip_address: ipAddress || '',
        year: new Date().getFullYear(),
      },
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send login notification',
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('[Notification Service] Error sending login notification:', error.message);
    return res.status(500).json({
      error: 'Failed to send login notification',
      message: error.message,
    });
  }
});

/**
 * POST /notify/kyc
 * Send KYC status notification
 */
app.post('/notify/kyc', async (req: Request, res: Response) => {
  try {
    const { email, name, status, reason, nextSteps } = req.body;

    if (!email || !name || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name', 'status'],
      });
    }

    const firstName = name?.split(' ')[0] || name || 'there';
    const templateName = status === 'approved' ? 'kyc-approved' : 'kyc-rejected';
    const subject =
      status === 'approved'
        ? 'KYC Verification Approved'
        : 'KYC Verification Update';

    const result = await sendEmailViaService({
      to: email,
      subject,
      template: templateName, // Your Mailgun template name
      templateVariables: {
        name: name || 'User',
        first_name: firstName,
        reason: reason || '',
        next_steps: nextSteps || '',
        year: new Date().getFullYear(),
      },
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send KYC notification',
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('[Notification Service] Error sending KYC notification:', error.message);
    return res.status(500).json({
      error: 'Failed to send KYC notification',
      message: error.message,
    });
  }
});

/**
 * POST /notify/business
 * Send business status notification
 */
app.post('/notify/business', async (req: Request, res: Response) => {
  try {
    const { email, name, status, businessName, reason, nextSteps } = req.body;

    if (!email || !name || !status || !businessName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name', 'status', 'businessName'],
      });
    }

    const templateName = status === 'approved' ? 'business-approved' : 'business-rejected';
    const subject =
      status === 'approved'
        ? 'Business Account Approved'
        : 'Business Application Update';

    const result = await sendEmailViaService({
      to: email,
      subject,
      template: templateName,
      templateVariables: {
        name: name || 'User',
        business_name: businessName || 'Your Business',
        reason: reason || '',
        next_steps: nextSteps || '',
        year: new Date().getFullYear(),
      },
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send business notification',
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('[Notification Service] Error sending business notification:', error.message);
    return res.status(500).json({
      error: 'Failed to send business notification',
      message: error.message,
    });
  }
});

/**
 * POST /notify/transaction
 * Send transaction notification
 */
app.post('/notify/transaction', async (req: Request, res: Response) => {
  try {
    const {
      email,
      name,
      transactionId,
      amount,
      currency,
      status,
      recipientName,
      reason,
    } = req.body;

    if (!email || !name || !transactionId || !amount || !currency || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name', 'transactionId', 'amount', 'currency', 'status'],
      });
    }

    const templateName =
      status === 'success'
        ? 'transaction-success'
        : status === 'failed'
        ? 'transaction-failed'
        : 'transaction-success';

    const subject =
      status === 'success'
        ? 'Transaction Successful'
        : status === 'failed'
        ? 'Transaction Failed'
        : 'Transaction Initiated';

    const result = await sendEmailViaService({
      to: email,
      subject,
      template: templateName,
      templateVariables: {
        name: name || 'User',
        amount: typeof amount === 'number' ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : amount,
        currency: currency || 'USD',
        recipient_name: recipientName || '',
        transaction_id: transactionId || 'N/A',
        reason: reason || '',
        year: new Date().getFullYear(),
      },
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send transaction notification',
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('[Notification Service] Error sending transaction notification:', error.message);
    return res.status(500).json({
      error: 'Failed to send transaction notification',
      message: error.message,
    });
  }
});

/**
 * POST /notify/payment-link
 * Send payment link notification
 */
app.post('/notify/payment-link', async (req: Request, res: Response) => {
  try {
    const { email, name, amount, currency, paymentLink, expiryDate, description } = req.body;

    if (!email || !name || !amount || !currency || !paymentLink) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name', 'amount', 'currency', 'paymentLink'],
      });
    }

    const result = await sendEmailViaService({
      to: email,
      subject: 'Payment Link Generated',
      template: 'payment-link',
      templateVariables: {
        name: name || 'User',
        amount: typeof amount === 'number' ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : amount,
        currency: currency || 'USD',
        payment_link: paymentLink || '',
        description: description || '',
        expiry_date: expiryDate ? formatDateForTemplate(expiryDate) : '',
        year: new Date().getFullYear(),
      },
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send payment link notification',
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('[Notification Service] Error sending payment link notification:', error.message);
    return res.status(500).json({
      error: 'Failed to send payment link notification',
      message: error.message,
    });
  }
});

/**
 * POST /notify/invoice
 * Send invoice notification
 */
app.post('/notify/invoice', async (req: Request, res: Response) => {
  try {
    const {
      email,
      name,
      invoiceNumber,
      amount,
      currency,
      dueDate,
      businessName,
      downloadLink,
      type, // 'generated' | 'reminder' | 'paid'
    } = req.body;

    if (!email || !name || !invoiceNumber || !amount || !currency || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name', 'invoiceNumber', 'amount', 'currency', 'type'],
      });
    }

    const templateName =
      type === 'generated'
        ? 'invoice-generated'
        : type === 'reminder'
        ? 'invoice-reminder'
        : 'invoice-paid';

    const subject =
      type === 'generated'
        ? 'New Invoice'
        : type === 'reminder'
        ? 'Invoice Payment Reminder'
        : 'Invoice Paid';

    const result = await sendEmailViaService({
      to: email,
      subject,
      template: templateName,
      templateVariables: {
        name: name || 'User',
        invoice_number: invoiceNumber || 'N/A',
        amount: typeof amount === 'number' ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : amount,
        currency: currency || 'USD',
        due_date: formatDateForTemplate(dueDate),
        business_name: businessName || 'Payvost',
        download_link: downloadLink || '',
        year: new Date().getFullYear(),
      },
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send invoice notification',
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('[Notification Service] Error sending invoice notification:', error.message);
    return res.status(500).json({
      error: 'Failed to send invoice notification',
      message: error.message,
    });
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Notification Service] Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`[Notification Service] Running on port ${PORT}`);
  console.log(`[Notification Service] Environment: ${NODE_ENV}`);
  console.log(`[Notification Service] Email Service URL: ${EMAIL_SERVICE_URL}`);
  console.log(`[Notification Service] Endpoints:`);
  console.log(`  - GET http://localhost:${PORT}/health`);
  console.log(`  - POST http://localhost:${PORT}/notify/login`);
  console.log(`  - POST http://localhost:${PORT}/notify/kyc`);
  console.log(`  - POST http://localhost:${PORT}/notify/business`);
  console.log(`  - POST http://localhost:${PORT}/notify/transaction`);
  console.log(`  - POST http://localhost:${PORT}/notify/payment-link`);
  console.log(`  - POST http://localhost:${PORT}/notify/invoice`);
});

