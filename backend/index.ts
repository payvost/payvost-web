// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes

// Load environment variables first
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '.env') });

import { createRequire } from 'module';
import './firebase';

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
    } catch {
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

try {
  console.log('✅ Firebase Admin SDK initialized');
  // Load service routes
  userRoutes = loadService('./services/user/routes/userRoutes');
  walletRoutes = loadService('./services/wallet/routes');
  transactionRoutes = loadService('./services/transaction/routes');
  fraudRoutes = loadService('./services/fraud/routes');
  notificationRoutes = loadService('./services/notification/routes');
  currencyRoutes = loadService('./services/currency/routes');
  paymentRoutes = loadService('./services/payment/src/routes');
  console.log('✅ All service routes loaded');
} catch (err) {
  console.error('❌ Failed to load backend modules:', err);
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
  
  console.log('✅ All service routes registered');
} catch (err) {
  console.error('❌ Failed to register service routes:', err);
  process.exit(1);
}

// Global error handler (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Payvost API Gateway running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
