// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes

// Load environment variables first
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '.env') });

import { createRequire } from 'module';
import './firebase';

// Initialize monitoring and infrastructure
import { initSentry } from './common/sentry';
import { initRedis } from './common/redis';
import { logger } from './common/logger';

// Initialize Sentry (must be early)
initSentry();

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
