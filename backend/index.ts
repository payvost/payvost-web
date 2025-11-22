// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes

// Load environment variables first
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '.env') });

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

// Initialize Firebase first
const localRequire = createRequire(__filename);

// Helper to load modules in both TS (dev) and JS (prod) builds
function loadService(modPath: string) {
  const candidates = [
    modPath,
    `${modPath}.ts`,
    `${modPath}.js`,
    `${modPath}/index.ts`,
    `${modPath}/index.js`,
  ];
  for (const p of candidates) {
    try {
      const m = localRequire(p);
      return m && m.default ? m.default : m;
    } catch (error) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      console.warn(`⚠️  Failed to load module candidate ${p}: ${detail}`);
      // try next candidate
    }
  }
  throw new Error(`Cannot load module: ${modPath}`);
}

let userRoutes: any;
let walletRoutes: any;
let transactionRoutes: any;
let fraudRoutes: any;
let notificationRoutes: any;
let currencyRoutes: any;
let paymentRoutes: any;
let escrowRoutes: any;
let errorTrackerRoutes: any;
let invoiceRoutes: any;
let businessRoutes: any;
let contentRoutes: any;

try {
  logger.info('Firebase Admin SDK initialized');
  // Load service routes
  userRoutes = loadService('./services/user/routes/userRoutes');
  walletRoutes = loadService('./services/wallet/routes');
  transactionRoutes = loadService('./services/transaction/routes');
  fraudRoutes = loadService('./services/fraud/routes');
  notificationRoutes = loadService('./services/notification/routes');
  currencyRoutes = loadService('./services/currency/routes');
  paymentRoutes = loadService('./services/payment/src/routes');
  escrowRoutes = loadService('./services/escrow/routes');
  errorTrackerRoutes = loadService('./services/error-tracker/routes');
  invoiceRoutes = loadService('./services/invoice/routes');
  businessRoutes = loadService('./services/business/routes');
  contentRoutes = loadService('./services/content/routes');
  logger.info('All service routes loaded');
} catch (err) {
  logger.error({ err }, 'Failed to load backend modules');
  process.exit(1);
}

// Create gateway application
import { createGateway, registerServiceRoutes, errorHandler } from './gateway/index';

const app = createGateway();
const port = process.env.PORT || 3001;

// Register service routes
try {
  if (userRoutes) {
    registerServiceRoutes(app, 'User Service', '/api/user', userRoutes);
  }
  
  if (walletRoutes) {
    registerServiceRoutes(app, 'Wallet Service', '/api/wallet', walletRoutes);
  }
  
  if (transactionRoutes) {
    registerServiceRoutes(app, 'Transaction Service', '/api/transaction', transactionRoutes);
  }
  
  if (fraudRoutes) {
    registerServiceRoutes(app, 'Fraud Service', '/api/fraud', fraudRoutes);
  }
  
  if (notificationRoutes) {
    registerServiceRoutes(app, 'Notification Service', '/api/notification', notificationRoutes);
  }
  
  if (currencyRoutes) {
    registerServiceRoutes(app, 'Currency Service', '/api/currency', currencyRoutes);
  }
  
  if (paymentRoutes) {
    registerServiceRoutes(app, 'Payment Service', '/api/payment', paymentRoutes);
  }
  
  if (escrowRoutes) {
    registerServiceRoutes(app, 'Escrow Service', '/api/escrow', escrowRoutes);
  }
  
  if (errorTrackerRoutes) {
    registerServiceRoutes(app, 'Error Tracker Service', '/api/error-tracker', errorTrackerRoutes);
  }
  
  if (invoiceRoutes) {
    registerServiceRoutes(app, 'Invoice Service', '/api/invoices', invoiceRoutes);
  }
  
  if (businessRoutes) {
    registerServiceRoutes(app, 'Business Service', '/api/business', businessRoutes);
  }
  
  if (contentRoutes) {
    registerServiceRoutes(app, 'Content Service', '/api/content', contentRoutes);
  }
  
  logger.info('All service routes registered');
} catch (err) {
  logger.error({ err }, 'Failed to register service routes');
  process.exit(1);
}

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

app.listen(port, () => {
  logger.info({ port, env: process.env.NODE_ENV || 'development' }, 'Payvost API Gateway started');
});
