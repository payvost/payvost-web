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
// Initialize monitoring and infrastructure
const error_tracker_1 = require("./common/error-tracker");
const redis_1 = require("./common/redis");
const logger_1 = require("./common/logger");
// Initialize error tracking (must be early)
(0, error_tracker_1.initErrorTracker)();
// Initialize Redis
(0, redis_1.initRedis)();
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
        catch (error) {
            const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
            console.warn(`⚠️  Failed to load module candidate ${p}: ${detail}`);
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
let escrowRoutes;
let errorTrackerRoutes;
let invoiceRoutes;
try {
    logger_1.logger.info('Firebase Admin SDK initialized');
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
    logger_1.logger.info('All service routes loaded');
}
catch (err) {
    logger_1.logger.error({ err }, 'Failed to load backend modules');
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
    if (escrowRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Escrow Service', '/api/escrow', escrowRoutes);
    }
    if (errorTrackerRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Error Tracker Service', '/api/error-tracker', errorTrackerRoutes);
    }
    if (invoiceRoutes) {
        (0, index_1.registerServiceRoutes)(app, 'Invoice Service', '/api/invoices', invoiceRoutes);
    }
    logger_1.logger.info('All service routes registered');
}
catch (err) {
    logger_1.logger.error({ err }, 'Failed to register service routes');
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
        logger_1.logger.debug({ url: url.toString() }, 'Proxying PDF request');
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorText = await response.text();
            logger_1.logger.error({ status: response.status, error: errorText }, 'PDF service error');
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
        logger_1.logger.error({ err: error }, 'PDF proxy error');
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
    logger_1.logger.info({ port, env: process.env.NODE_ENV || 'development' }, 'Payvost API Gateway started');
});
