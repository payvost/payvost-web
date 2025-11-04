"use strict";
// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, '.env') });
const module_1 = require("module");
require("./firebase");
// Initialize Firebase first
const localRequire = (0, module_1.createRequire)(__filename);
// Helper to load modules in both TS (dev) and JS (prod) builds
function loadService(modPath) {
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
        }
        catch {
            // try next candidate
        }
    }
    throw new Error(`Cannot load module: ${modPath}`);
}
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
    userRoutes = loadService('./services/user/routes/userRoutes');
    walletRoutes = loadService('./services/wallet/routes');
    transactionRoutes = loadService('./services/transaction/routes');
    fraudRoutes = loadService('./services/fraud/routes');
    notificationRoutes = loadService('./services/notification/routes');
    currencyRoutes = loadService('./services/currency/routes');
    paymentRoutes = loadService('./services/payment/src/routes');
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
// PDF Service Proxy
// Forward PDF generation requests to the dedicated PDF service
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:3005';
app.get('/api/pdf/invoice/:id', async (req, res) => {
    const { id } = req.params;
    const origin = req.query.origin;
    try {
        const url = new URL(`/invoice/${id}`, PDF_SERVICE_URL);
        if (origin) {
            url.searchParams.set('origin', origin);
        }
        console.log(`[Gateway] Proxying PDF request to: ${url.toString()}`);
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Gateway] PDF service error: ${response.status} - ${errorText}`);
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
    }
    catch (error) {
        console.error('[Gateway] PDF proxy error:', error);
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
    }
    catch (error) {
        res.status(503).json({
            error: 'PDF service unavailable',
            message: error.message,
        });
    }
});
// Global error handler (must be last)
app.use(index_1.errorHandler);
app.listen(port, () => {
    console.log(`🚀 Payvost API Gateway running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
