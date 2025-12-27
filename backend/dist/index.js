"use strict";
// Payvost Backend - API Gateway
// Initializes Firebase Admin SDK and configures all service routes
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
// Try loading from multiple locations to support both root and backend .env files
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load both .env files: root first, then backend (backend can override root)
// This allows shared variables in root .env and service-specific in backend/.env
const rootEnvPath = path_1.default.resolve(__dirname, '..', '.env');
const backendEnvPath = path_1.default.resolve(__dirname, '.env');
// Load root .env first
if (fs_1.default.existsSync(rootEnvPath)) {
    (0, dotenv_1.config)({ path: rootEnvPath });
}
// Load backend .env second (will override root vars if override: true)
// Default behavior (override: false) means root vars take precedence
if (fs_1.default.existsSync(backendEnvPath)) {
    (0, dotenv_1.config)({ path: backendEnvPath, override: true }); // Backend .env overrides root
}
// Validate environment variables before proceeding
const env_validation_1 = require("./common/env-validation");
(0, env_validation_1.validateEnvironmentOrExit)();
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
function loadService(modPath, required = true) {
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
    if (required) {
        throw new Error(`Cannot load module: ${modPath}`);
    }
    return null;
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
let businessRoutes;
let contentRoutes;
let supportRoutes;
let referralRoutes;
try {
    logger_1.logger.info('Firebase Admin SDK initialized');
    // Load service routes (userRoutes is optional - it requires JWT_SECRET)
    userRoutes = loadService('./services/user/routes/userRoutes', false);
    walletRoutes = loadService('./services/wallet/routes', false);
    transactionRoutes = loadService('./services/transaction/routes', false);
    fraudRoutes = loadService('./services/fraud/routes', false);
    notificationRoutes = loadService('./services/notification/routes', false);
    currencyRoutes = loadService('./services/currency/routes', false);
    paymentRoutes = loadService('./services/payment/src/routes', false);
    escrowRoutes = loadService('./services/escrow/routes', false);
    errorTrackerRoutes = loadService('./services/error-tracker/routes', false);
    invoiceRoutes = loadService('./services/invoice/routes', false);
    businessRoutes = loadService('./services/business/routes', false);
    contentRoutes = loadService('./services/content/routes', false);
    supportRoutes = loadService('./services/support/routes', false);
    referralRoutes = loadService('./services/referral/routes', false);
    const loadedServices = [
        userRoutes && 'User',
        walletRoutes && 'Wallet',
        transactionRoutes && 'Transaction',
        fraudRoutes && 'Fraud',
        notificationRoutes && 'Notification',
        currencyRoutes && 'Currency',
        paymentRoutes && 'Payment',
        escrowRoutes && 'Escrow',
        errorTrackerRoutes && 'ErrorTracker',
        invoiceRoutes && 'Invoice',
        businessRoutes && 'Business',
        contentRoutes && 'Content',
        supportRoutes && 'Support',
        referralRoutes && 'Referral',
    ].filter(Boolean);
    logger_1.logger.info({ services: loadedServices }, 'Service routes loaded');
    if (!userRoutes) {
        logger_1.logger.warn('User service not loaded - JWT_SECRET may not be configured');
    }
}
catch (err) {
    logger_1.logger.error({ err }, 'Failed to load backend modules');
    // Don't exit - continue with available services
}
// Create gateway application
const index_1 = require("./gateway/index");
const webhookVerification_1 = require("./gateway/webhookVerification");
const app = (0, index_1.createGateway)();
const port = process.env.PORT || 3001;
// API Versioning middleware (must be before route registration)
const api_versioning_1 = require("./gateway/api-versioning");
app.use('/api', api_versioning_1.extractApiVersion);
// Register service routes with versioning support
const api_versioning_2 = require("./gateway/api-versioning");
try {
    if (userRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'User Service', '/api/user', userRoutes, ['v1']);
    }
    if (walletRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Wallet Service', '/api/wallet', walletRoutes, ['v1']);
    }
    if (transactionRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Transaction Service', '/api/transaction', transactionRoutes, ['v1']);
    }
    if (fraudRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Fraud Service', '/api/fraud', fraudRoutes, ['v1']);
    }
    if (notificationRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Notification Service', '/api/notification', notificationRoutes, ['v1']);
    }
    if (currencyRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Currency Service', '/api/currency', currencyRoutes, ['v1']);
    }
    if (paymentRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Payment Service', '/api/payment', paymentRoutes, ['v1']);
    }
    if (escrowRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Escrow Service', '/api/escrow', escrowRoutes, ['v1']);
    }
    if (errorTrackerRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Error Tracker Service', '/api/error-tracker', errorTrackerRoutes, ['v1']);
    }
    if (invoiceRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Invoice Service', '/api/invoices', invoiceRoutes, ['v1']);
    }
    if (businessRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Business Service', '/api/business', businessRoutes, ['v1']);
    }
    if (contentRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Content Service', '/api/content', contentRoutes, ['v1']);
    }
    if (supportRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Support Service', '/api/support', supportRoutes, ['v1']);
    }
    if (referralRoutes) {
        (0, api_versioning_2.registerVersionedRoutes)(app, 'Referral Service', '/referral', referralRoutes, ['v1']);
    }
    logger_1.logger.info('All service routes registered with versioning support');
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
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Email service proxy error');
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
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Email service proxy error');
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
        if (req.query.startDate)
            queryParams.set('startDate', req.query.startDate);
        if (req.query.endDate)
            queryParams.set('endDate', req.query.endDate);
        if (req.query.currency)
            queryParams.set('currency', req.query.currency);
        const url = `${ADMIN_STATS_SERVICE_URL}/stats?${queryParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        res.status(response.status).json(data);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Admin stats service proxy error');
        res.status(500).json({
            error: 'Failed to connect to admin stats service',
            message: error.message,
        });
    }
});
app.get('/api/admin-stats/volume-over-time', async (req, res) => {
    try {
        const queryParams = new URLSearchParams();
        if (req.query.startDate)
            queryParams.set('startDate', req.query.startDate);
        if (req.query.endDate)
            queryParams.set('endDate', req.query.endDate);
        if (req.query.currency)
            queryParams.set('currency', req.query.currency);
        const url = `${ADMIN_STATS_SERVICE_URL}/volume-over-time?${queryParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        res.status(response.status).json(data);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Admin stats service proxy error');
        res.status(500).json({
            error: 'Failed to connect to admin stats service',
            message: error.message,
        });
    }
});
app.get('/api/admin-stats/transactions', async (req, res) => {
    try {
        const queryParams = new URLSearchParams();
        if (req.query.limit)
            queryParams.set('limit', req.query.limit);
        if (req.query.startDate)
            queryParams.set('startDate', req.query.startDate);
        if (req.query.endDate)
            queryParams.set('endDate', req.query.endDate);
        if (req.query.currency)
            queryParams.set('currency', req.query.currency);
        const url = `${ADMIN_STATS_SERVICE_URL}/transactions?${queryParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        res.status(response.status).json(data);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Admin stats service proxy error');
        res.status(500).json({
            error: 'Failed to connect to admin stats service',
            message: error.message,
        });
    }
});
app.get('/api/admin-stats/currency-distribution', async (req, res) => {
    try {
        const queryParams = new URLSearchParams();
        if (req.query.startDate)
            queryParams.set('startDate', req.query.startDate);
        if (req.query.endDate)
            queryParams.set('endDate', req.query.endDate);
        const url = `${ADMIN_STATS_SERVICE_URL}/currency-distribution?${queryParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        res.status(response.status).json(data);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Admin stats service proxy error');
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
        const headers = {
            'Content-Type': 'application/json',
        };
        const signature = req.headers['x-reloadly-signature'] || req.headers['x-webhook-signature'];
        if (signature) {
            headers['x-reloadly-signature'] = signature;
        }
        const response = await fetch(`${WEBHOOK_SERVICE_URL}/reloadly`, {
            method: 'POST',
            headers,
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.status(response.status).json(data);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Webhook service proxy error');
        res.status(500).json({
            error: 'Failed to connect to webhook service',
            message: error.message,
        });
    }
});
// Mailgun Webhook Proxy with verification
app.post('/api/webhooks/mailgun', webhookVerification_1.verifyMailgunWebhook, async (req, res) => {
    try {
        // Forward headers (especially signature headers)
        const headers = {
            'Content-Type': 'application/json',
        };
        // Forward Mailgun signature headers if present
        const signature = req.headers['x-mailgun-signature'];
        const timestamp = req.headers['x-mailgun-timestamp'];
        const token = req.headers['x-mailgun-token'];
        if (signature)
            headers['x-mailgun-signature'] = signature;
        if (timestamp)
            headers['x-mailgun-timestamp'] = timestamp;
        if (token)
            headers['x-mailgun-token'] = token;
        // Mailgun may send form-encoded data, so forward as-is
        const contentType = req.headers['content-type'] || 'application/json';
        headers['Content-Type'] = contentType;
        const response = await fetch(`${WEBHOOK_SERVICE_URL}/mailgun`, {
            method: 'POST',
            headers,
            body: contentType.includes('application/x-www-form-urlencoded')
                ? new URLSearchParams(req.body).toString()
                : JSON.stringify(req.body),
        });
        const data = await response.json();
        res.status(response.status).json(data);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Mailgun webhook proxy error');
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
// Initialize Recurring Invoice Scheduler
// Processes recurring invoices on a schedule when enabled
if (process.env.ENABLE_RECURRING_SCHEDULER === 'true') {
    try {
        const { startRecurringInvoiceScheduler } = loadService('./services/invoice/src/scheduler', false);
        if (startRecurringInvoiceScheduler) {
            // Run daily (24 hours)
            const intervalMs = 24 * 60 * 60 * 1000;
            startRecurringInvoiceScheduler(intervalMs);
            logger_1.logger.info({ intervalMs }, 'Recurring invoice scheduler initialized');
        }
        else {
            logger_1.logger.warn('Recurring invoice scheduler module not found');
        }
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to initialize recurring invoice scheduler');
    }
}
else {
    logger_1.logger.debug('Recurring invoice scheduler disabled (set ENABLE_RECURRING_SCHEDULER=true to enable)');
}
// Create HTTP server for WebSocket support
const http_1 = require("http");
const websocket_server_1 = require("./services/chat/websocket-server");
const httpServer = (0, http_1.createServer)(app);
// Initialize WebSocket server
(0, websocket_server_1.initializeChatWebSocket)(httpServer);
httpServer.listen(port, () => {
    logger_1.logger.info({ port, env: process.env.NODE_ENV || 'development' }, 'Payvost API Gateway started');
});
