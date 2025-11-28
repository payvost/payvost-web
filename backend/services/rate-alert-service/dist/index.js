"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRateAlertMonitor = runRateAlertMonitor;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const web_push_1 = __importDefault(require("web-push"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
// @ts-ignore - Common files are compiled separately
const mailgun_1 = require("../../../common/mailgun");
// @ts-ignore - Common files are compiled separately
const daily_email_1 = require("../../../common/daily-email");
const app = (0, express_1.default)();
const PORT = process.env.RATE_ALERT_SERVICE_PORT || 3009;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Prisma
const prisma = new client_1.PrismaClient({
    log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// Check Mailgun configuration
const mailgunConfigured = (0, mailgun_1.isMailgunConfigured)();
if (mailgunConfigured) {
    console.log('[Rate Alert Service] Mailgun API initialized');
}
else {
    console.warn('[Rate Alert Service] Mailgun not configured (MAILGUN_API_KEY or MAILGUN_DOMAIN missing)');
}
// Initialize Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'alerts@payvost.com';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    web_push_1.default.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('[Rate Alert Service] Web Push initialized');
}
else {
    console.warn('[Rate Alert Service] Web Push not configured (VAPID keys missing)');
}
// OpenExchangeRates API
const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
/**
 * Fetch FX rates from OpenExchangeRates API
 */
async function fetchRates(base = 'USD') {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID not configured');
    }
    const url = `https://openexchangerates.org/api/latest.json?app_id=${OXR_APP_ID}&base=${base}`;
    const response = await axios_1.default.get(url);
    return response.data.rates;
}
// sendRateAlertEmail is now imported from mailgun.ts with HTML template support
/**
 * Send rate alert push notification
 */
async function sendRateAlertPush(subscription, message) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('[Rate Alert Service] Cannot send push - VAPID keys not configured');
        return;
    }
    try {
        await web_push_1.default.sendNotification(subscription, message);
    }
    catch (error) {
        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[Rate Alert Service] Push subscription expired, will be cleaned up');
        }
        else {
            throw error;
        }
    }
}
/**
 * Run rate alert monitor - checks all active alerts and sends notifications
 */
async function runRateAlertMonitor() {
    console.log('[Rate Alert Service] Starting rate alert monitor...');
    try {
        // 1. Fetch all active alerts
        const alerts = await prisma.rateAlert.findMany({ where: { isActive: true } });
        if (!alerts.length) {
            console.log('[Rate Alert Service] No active alerts found');
            return { processed: 0, notified: 0, errors: 0 };
        }
        console.log(`[Rate Alert Service] Found ${alerts.length} active alerts`);
        // 2. Fetch FX rates (base: USD)
        const rates = await fetchRates('USD');
        console.log('[Rate Alert Service] Fetched exchange rates');
        let notified = 0;
        let errors = 0;
        // 3. Process each alert
        for (const alert of alerts) {
            try {
                const { sourceCurrency, targetCurrency, targetRate, email, id, pushSubscription } = alert;
                // Only support USD as base for now
                if (sourceCurrency !== 'USD') {
                    console.log(`[Rate Alert Service] Skipping alert ${id} - only USD base supported`);
                    continue;
                }
                const currentRate = rates[targetCurrency];
                if (!currentRate) {
                    console.log(`[Rate Alert Service] Rate not found for ${targetCurrency}`);
                    continue;
                }
                // Check if target rate is met
                if (Number(currentRate) >= Number(alert.targetRate)) {
                    console.log(`[Rate Alert Service] Alert triggered: ${sourceCurrency}/${targetCurrency} = ${currentRate} (target: ${targetRate})`);
                    // Send email if present
                    if (email) {
                        try {
                            await (0, mailgun_1.sendRateAlertEmail)(email, `🎯 Your FX rate alert: ${sourceCurrency}/${targetCurrency}`, `Good news! The rate for ${sourceCurrency} to ${targetCurrency} is now ${currentRate}, meeting your target of ${targetRate}.`, {
                                sourceCurrency,
                                targetCurrency,
                                currentRate: currentRate.toString(),
                                targetRate: targetRate.toString(),
                            });
                            console.log(`[Rate Alert Service] Email sent to ${email}`);
                        }
                        catch (error) {
                            console.error(`[Rate Alert Service] Failed to send email to ${email}:`, error.message);
                            errors++;
                        }
                    }
                    // Send push notification if present
                    if (pushSubscription) {
                        try {
                            await sendRateAlertPush(pushSubscription, JSON.stringify({
                                title: `FX Alert: ${sourceCurrency}/${targetCurrency}`,
                                body: `Rate is now ${currentRate} (target: ${targetRate})`,
                                icon: '/icon-192x192.png',
                            }));
                            console.log(`[Rate Alert Service] Push notification sent for alert ${id}`);
                        }
                        catch (error) {
                            console.error(`[Rate Alert Service] Failed to send push notification:`, error.message);
                            // If subscription expired, remove it
                            if (error.statusCode === 410 || error.statusCode === 404) {
                                await prisma.rateAlert.update({
                                    where: { id },
                                    data: { pushSubscription: null },
                                });
                            }
                            errors++;
                        }
                    }
                    // Mark alert as notified
                    await prisma.rateAlert.update({
                        where: { id },
                        data: {
                            isActive: false,
                            notifiedAt: new Date(),
                            notifiedCount: { increment: 1 }
                        },
                    });
                    notified++;
                }
            }
            catch (error) {
                console.error(`[Rate Alert Service] Error processing alert ${alert.id}:`, error.message);
                errors++;
            }
        }
        console.log(`[Rate Alert Service] Monitor complete: ${notified} alerts notified, ${errors} errors`);
        return { processed: alerts.length, notified, errors };
    }
    catch (error) {
        console.error('[Rate Alert Service] Monitor error:', error);
        throw error;
    }
}
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'rate-alert-service',
        timestamp: new Date().toISOString(),
        prismaConnected: true,
        mailgunConfigured: mailgunConfigured,
        webpushConfigured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
        oxrConfigured: !!OXR_APP_ID,
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'Payvost Rate Alert Service',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            run: 'POST /run',
            dailyEmail: 'POST /daily-email',
        },
    });
});
// Manual trigger endpoint (for testing or cron)
app.post('/run', async (_req, res) => {
    try {
        console.log('[Rate Alert Service] Manual trigger received');
        const result = await runRateAlertMonitor();
        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        console.error('[Rate Alert Service] Error running monitor:', error);
        return res.status(500).json({
            error: 'Failed to run rate alert monitor',
            message: error.message,
            details: NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
// Daily email endpoint (for cron job - call every hour)
app.post('/daily-email', async (_req, res) => {
    try {
        console.log('[Rate Alert Service] Daily email trigger received');
        const result = await (0, daily_email_1.processDailyEmails)();
        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        console.error('[Rate Alert Service] Error processing daily emails:', error);
        return res.status(500).json({
            error: 'Failed to process daily emails',
            message: error.message,
            details: NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
// Graceful shutdown
const shutdown = async () => {
    console.log('[Rate Alert Service] Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
app.listen(PORT, () => {
    console.log(`[Rate Alert Service] Running on port ${PORT}`);
    console.log(`[Rate Alert Service] Environment: ${NODE_ENV}`);
    console.log(`[Rate Alert Service] Endpoints:`);
    console.log(`  - GET http://localhost:${PORT}/health`);
    console.log(`  - POST http://localhost:${PORT}/run`);
    console.log(`  - POST http://localhost:${PORT}/daily-email`);
    // Auto-run on startup if configured (for Render Cron Jobs)
    if (process.env.AUTO_RUN_ON_STARTUP === 'true') {
        console.log('[Rate Alert Service] Auto-running monitor on startup...');
        runRateAlertMonitor().catch((error) => {
            console.error('[Rate Alert Service] Auto-run failed:', error);
        });
    }
});
//# sourceMappingURL=index.js.map