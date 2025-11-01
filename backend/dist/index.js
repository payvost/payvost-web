"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("module");
require("./firebase");
// Initialize Firebase first
const localRequire = (0, module_1.createRequire)(__filename);
let userRoutes;
let walletRoutes;
let transactionRoutes;
let fraudRoutes;
let notificationRoutes;
let currencyRoutes;
let paymentRoutes;
try {
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
    const paymentMod = localRequire('./services/payment/src/routes');
    paymentRoutes = paymentMod && paymentMod.default ? paymentMod.default : paymentMod;
    console.log('✅ All service routes loaded');
}
catch (err) {
    console.error('❌ Failed to load backend modules:', err);
    process.exit(1);
}
// Create gateway application
const index_1 = require("./gateway/index");
const app = (0, index_1.createGateway)();
const port = process.env.PORT || 3001;
// Register service routes
try {
    if (userRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'User Service', '/api/user', userRoutes);
    }
    if (walletRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Wallet Service', '/api/wallet', walletRoutes);
    }
    if (transactionRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Transaction Service', '/api/transaction', transactionRoutes);
    }
    if (fraudRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Fraud Service', '/api/fraud', fraudRoutes);
    }
    if (notificationRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Notification Service', '/api/notification', notificationRoutes);
    }
    if (currencyRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Currency Service', '/api/currency', currencyRoutes);
    }
    if (paymentRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Payment Service', '/api/payment', paymentRoutes);
    }
    console.log('✅ All service routes registered');
}
catch (err) {
    console.error('❌ Failed to register service routes:', err);
    process.exit(1);
}
// Global error handler (must be last)
app.use(index_1.errorHandler);
app.listen(port, () => {
    console.log(`🚀 Payvost API Gateway running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
