// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes
import path from 'path';
import { createRequire } from 'module';

// Initialize Firebase first
const localRequire = createRequire(path.join(process.cwd(), 'backend', 'index.js'));
let userRoutes: any;
let walletRoutes: any;
let transactionRoutes: any;
let fraudRoutes: any;
let notificationRoutes: any;
let currencyRoutes: any;

try {
  const fb = localRequire('./firebase');
  const fbDefault = fb && fb.default ? fb.default : fb;
  console.log('✅ Firebase Admin SDK initialized');
  
  // Load service routes
  const userMod = localRequire('./services/user/routes/userRoutes');
  userRoutes = userMod && userMod.default ? userMod.default : userMod;
  
  const walletMod = localRequire('./services/wallet/routes');
  walletRoutes = walletMod && walletMod.default ? walletMod.default : walletMod;
  
  const transactionMod = localRequire('./services/transaction/routes');
  transactionRoutes = transactionMod && transactionMod.default ? transactionMod.default : transactionMod;
  
  const fraudMod = localRequire('./services/fraud/routes');
  fraudRoutes = fraudMod && fraudMod.default ? fraudMod.default : fraudMod;
  
  const notificationMod = localRequire('./services/notification/routes');
  notificationRoutes = notificationMod && notificationMod.default ? notificationMod.default : notificationMod;
  
  const currencyMod = localRequire('./services/currency/routes');
  currencyRoutes = currencyMod && currencyMod.default ? currencyMod.default : currencyMod;
  
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
