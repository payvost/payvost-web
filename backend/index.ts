// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes

// Load environment variables first
// Try loading from multiple locations to support both root and backend .env files
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load both .env files: root first, then backend (backend can override root)
// This allows shared variables in root .env and service-specific in backend/.env
const rootEnvPath = path.resolve(__dirname, '..', '.env');
const backendEnvPath = path.resolve(__dirname, '.env');

// Load root .env first
if (fs.existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
}

// Load backend .env second (will override root vars if override: true)
// Default behavior (override: false) means root vars take precedence
if (fs.existsSync(backendEnvPath)) {
  config({ path: backendEnvPath, override: true }); // Backend .env overrides root
}

// Validate environment variables before proceeding
import { validateEnvironmentOrExit } from './common/env-validation';
validateEnvironmentOrExit();

import { createRequire } from 'module';
import './firebase';

// Initialize monitoring and infrastructure
import { initErrorTracker } from './common/error-tracker';
import { initRedis } from './common/redis';
import { logger } from './common/logger';

// Initialize error tracking (must be early)
initErrorTracker();

// Initialize Redis
initRedis();

const localRequire = createRequire(__filename);

import userRoutes from './services/user/routes/userRoutes';
import walletRoutes from './services/wallet/routes';
import transactionRoutes from './services/transaction/routes';
import fraudRoutes from './services/fraud/routes';
import notificationRoutes from './services/notification/routes';
import currencyRoutes from './services/currency/routes';
import paymentRoutes from './services/payment/src/routes';
import escrowRoutes from './services/escrow/routes';
import errorTrackerRoutes from './services/error-tracker/routes';
import invoiceRoutes from './services/invoice/routes';
import businessRoutes from './services/business/routes';
import contentRoutes from './services/content/routes';
import supportRoutes from './services/support/routes';
import referralRoutes from './services/referral/routes';
import { startRecurringInvoiceScheduler } from './services/invoice/src/scheduler';

logger.info('Static service imports loaded');

// Create gateway application
import { createGateway, registerServiceRoutes, errorHandler } from './gateway/index';
import { verifyMailgunWebhook } from './gateway/webhookVerification';

const app = createGateway();
const port = process.env.PORT || 3001;

// API Versioning middleware (must be before route registration)
import { extractApiVersion } from './gateway/api-versioning';
app.use('/api', extractApiVersion);

// Register service routes with versioning support
import { registerVersionedRoutes } from './gateway/api-versioning';

registerVersionedRoutes(app, 'User Service', '/api/user', userRoutes, ['v1']);
registerVersionedRoutes(app, 'Wallet Service', '/api/wallet', walletRoutes, ['v1']);
registerVersionedRoutes(app, 'Transaction Service', '/api/transaction', transactionRoutes, ['v1']);
registerVersionedRoutes(app, 'Notification Service', '/api/notification', notificationRoutes, ['v1']);
registerVersionedRoutes(app, 'Currency Service', '/api/currency', currencyRoutes, ['v1']);
registerVersionedRoutes(app, 'Payment Service', '/api/payment', paymentRoutes, ['v1']);
registerVersionedRoutes(app, 'Escrow Service', '/api/escrow', escrowRoutes, ['v1']);
registerVersionedRoutes(app, 'Error Tracker Service', '/api/error-tracker', errorTrackerRoutes, ['v1']);
registerVersionedRoutes(app, 'Invoice Service', '/api/invoices', invoiceRoutes, ['v1']);
registerVersionedRoutes(app, 'Business Service', '/api/business', businessRoutes, ['v1']);
registerVersionedRoutes(app, 'Content Service', '/api/content', contentRoutes, ['v1']);
registerVersionedRoutes(app, 'Support Service', '/api/support', supportRoutes, ['v1']);
registerVersionedRoutes(app, 'Referral Service', '/referral', referralRoutes, ['v1']);

// Fraud service might be optional or handled differently, but importing statically
registerVersionedRoutes(app, 'Fraud Service', '/api/fraud', fraudRoutes, ['v1']);

logger.info('All service routes registered with versioning support');
// PDF Service Proxy
// Forward PDF generation requests to the dedicated PDF service
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:3005';

app.get('/api/pdf/invoice/:id', async (req, res) => {
  const { id } = req.params;
  const origin = req.query.origin as string;

  try {
    const url = new URL(`/invoice/${id}`, PDF_SERVICE_URL);
    if (origin) {
      url.searchParams.set('origin', origin);
    }

    logger.debug({ url: url.toString() }, 'Proxying PDF request');

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'PDF service error');
      return res.status(response.status).json({
        error: 'PDF generation failed',
        message: errorText,
      });
    }

    // Forward headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/pdf');
    res.setHeader('Content-Disposition', response.headers.get('content-disposition') || `attachment; filename="invoice-${id}.pdf"`);

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (error: any) {
    logger.error({ err: error }, 'PDF proxy error');
    res.status(500).json({
      error: 'Failed to connect to PDF service',
      message: error.message,
    });
  }
});

// Email Service Proxy
// Forward email requests to the dedicated email service
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3006';

app.post('/api/email/single', async (req, res) => {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Email service proxy error');
    res.status(500).json({
      error: 'Failed to connect to email service',
      message: error.message,
    });
  }
});

app.post('/api/email/batch', async (req, res) => {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Email service proxy error');
    res.status(500).json({
      error: 'Failed to connect to email service',
      message: error.message,
    });
  }
});

// Admin Stats Service Proxy
// Forward admin stats requests to the dedicated admin stats service
const ADMIN_STATS_SERVICE_URL = process.env.ADMIN_STATS_SERVICE_URL || 'http://localhost:3007';

app.get('/api/admin-stats/stats', async (req, res) => {
  try {
    const queryParams = new URLSearchParams();
    if (req.query.startDate) queryParams.set('startDate', req.query.startDate as string);
    if (req.query.endDate) queryParams.set('endDate', req.query.endDate as string);
    if (req.query.currency) queryParams.set('currency', req.query.currency as string);

    const url = `${ADMIN_STATS_SERVICE_URL}/stats?${queryParams.toString()}`;
    const response = await fetch(url);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Admin stats service proxy error');
    res.status(500).json({
      error: 'Failed to connect to admin stats service',
      message: error.message,
    });
  }
});

app.get('/api/admin-stats/volume-over-time', async (req, res) => {
  try {
    const queryParams = new URLSearchParams();
    if (req.query.startDate) queryParams.set('startDate', req.query.startDate as string);
    if (req.query.endDate) queryParams.set('endDate', req.query.endDate as string);
    if (req.query.currency) queryParams.set('currency', req.query.currency as string);

    const url = `${ADMIN_STATS_SERVICE_URL}/volume-over-time?${queryParams.toString()}`;
    const response = await fetch(url);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Admin stats service proxy error');
    res.status(500).json({
      error: 'Failed to connect to admin stats service',
      message: error.message,
    });
  }
});

app.get('/api/admin-stats/transactions', async (req, res) => {
  try {
    const queryParams = new URLSearchParams();
    if (req.query.limit) queryParams.set('limit', req.query.limit as string);
    if (req.query.startDate) queryParams.set('startDate', req.query.startDate as string);
    if (req.query.endDate) queryParams.set('endDate', req.query.endDate as string);
    if (req.query.currency) queryParams.set('currency', req.query.currency as string);

    const url = `${ADMIN_STATS_SERVICE_URL}/transactions?${queryParams.toString()}`;
    const response = await fetch(url);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Admin stats service proxy error');
    res.status(500).json({
      error: 'Failed to connect to admin stats service',
      message: error.message,
    });
  }
});

app.get('/api/admin-stats/currency-distribution', async (req, res) => {
  try {
    const queryParams = new URLSearchParams();
    if (req.query.startDate) queryParams.set('startDate', req.query.startDate as string);
    if (req.query.endDate) queryParams.set('endDate', req.query.endDate as string);

    const url = `${ADMIN_STATS_SERVICE_URL}/currency-distribution?${queryParams.toString()}`;
    const response = await fetch(url);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Admin stats service proxy error');
    res.status(500).json({
      error: 'Failed to connect to admin stats service',
      message: error.message,
    });
  }
});

// Webhook Service Proxy
// Forward webhook requests to the dedicated webhook service
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3008';

app.post('/api/webhooks/reloadly', async (req, res) => {
  try {
    // Forward headers (especially signature headers)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const signature = req.headers['x-reloadly-signature'] || req.headers['x-webhook-signature'];
    if (signature) {
      headers['x-reloadly-signature'] = signature as string;
    }

    const response = await fetch(`${WEBHOOK_SERVICE_URL}/reloadly`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Webhook service proxy error');
    res.status(500).json({
      error: 'Failed to connect to webhook service',
      message: error.message,
    });
  }
});

// Mailgun Webhook Proxy with verification
app.post('/api/webhooks/mailgun', verifyMailgunWebhook, async (req, res) => {
  try {
    // Forward headers (especially signature headers)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward Mailgun signature headers if present
    const signature = req.headers['x-mailgun-signature'];
    const timestamp = req.headers['x-mailgun-timestamp'];
    const token = req.headers['x-mailgun-token'];

    if (signature) headers['x-mailgun-signature'] = signature as string;
    if (timestamp) headers['x-mailgun-timestamp'] = timestamp as string;
    if (token) headers['x-mailgun-token'] = token as string;

    // Mailgun may send form-encoded data, so forward as-is
    const contentType = req.headers['content-type'] || 'application/json';
    headers['Content-Type'] = contentType;

    const response = await fetch(`${WEBHOOK_SERVICE_URL}/mailgun`, {
      method: 'POST',
      headers,
      body: contentType.includes('application/x-www-form-urlencoded')
        ? new URLSearchParams(req.body as any).toString()
        : JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error({ err: error }, 'Mailgun webhook proxy error');
    res.status(500).json({
      error: 'Failed to connect to webhook service',
      message: error.message,
    });
  }
});

app.get('/api/pdf/health', async (_req, res) => {
  try {
    const response = await fetch(`${PDF_SERVICE_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(503).json({
      error: 'PDF service unavailable',
      message: error.message,
    });
  }
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize Recurring Invoice Scheduler
// Processes recurring invoices on a schedule when enabled
if (process.env.ENABLE_RECURRING_SCHEDULER === 'true') {
  try {
    // Run daily (24 hours)
    const intervalMs = 24 * 60 * 60 * 1000;
    startRecurringInvoiceScheduler(intervalMs);
    logger.info({ intervalMs }, 'Recurring invoice scheduler initialized');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize recurring invoice scheduler');
  }
} else {
  logger.debug('Recurring invoice scheduler disabled (set ENABLE_RECURRING_SCHEDULER=true to enable)');
}

// Create HTTP server for WebSocket support
import { createServer } from 'http';
import { initializeChatWebSocket } from './services/chat/websocket-server';

const httpServer = createServer(app);

// Initialize WebSocket server
initializeChatWebSocket(httpServer);

httpServer.listen(port, () => {
  logger.info({ port, env: process.env.NODE_ENV || 'development' }, 'Payvost API Gateway started');
});
