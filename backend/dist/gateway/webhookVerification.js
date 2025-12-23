"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyReloadlyWebhook = verifyReloadlyWebhook;
exports.verifyStripeWebhook = verifyStripeWebhook;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.verifyMailgunWebhook = verifyMailgunWebhook;
exports.captureRawBody = captureRawBody;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../common/logger");
/**
 * Verify webhook signature for Reloadly
 */
function verifyReloadlyWebhook(req, res, next) {
    const secret = process.env.RELOADLY_WEBHOOK_SECRET;
    if (!secret) {
        logger_1.logger.warn('RELOADLY_WEBHOOK_SECRET not configured. Webhook verification disabled.');
        return next();
    }
    try {
        const signature = req.headers['x-reloadly-signature'];
        const timestamp = req.headers['x-reloadly-timestamp'];
        if (!signature || !timestamp) {
            logger_1.logger.warn('Missing Reloadly webhook signature or timestamp');
            return res.status(401).json({ error: 'Missing webhook signature' });
        }
        // Reloadly uses HMAC SHA256
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(timestamp + payload)
            .digest('hex');
        // Use constant-time comparison to prevent timing attacks
        if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            logger_1.logger.warn({ ip: req.ip }, 'Invalid Reloadly webhook signature');
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
        // Verify timestamp to prevent replay attacks (within 5 minutes)
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);
        if (timeDiff > 300) { // 5 minutes
            logger_1.logger.warn({ timeDiff }, 'Reloadly webhook timestamp too old');
            return res.status(401).json({ error: 'Webhook timestamp expired' });
        }
        logger_1.logger.info('Reloadly webhook signature verified');
        next();
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error verifying Reloadly webhook');
        return res.status(500).json({ error: 'Webhook verification failed' });
    }
}
/**
 * Verify webhook signature for Stripe
 */
function verifyStripeWebhook(req, res, next) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        logger_1.logger.warn('STRIPE_WEBHOOK_SECRET not configured. Webhook verification disabled.');
        return next();
    }
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            logger_1.logger.warn('Missing Stripe webhook signature');
            return res.status(401).json({ error: 'Missing webhook signature' });
        }
        // Stripe uses a specific signature format: timestamp,signature
        // We need the raw body for Stripe verification
        const rawBody = req.rawBody || JSON.stringify(req.body);
        // For production, you should use stripe.webhooks.constructEvent()
        // This is a simplified version
        const elements = signature.split(',');
        const timestamp = elements.find((e) => e.startsWith('t='))?.substring(2);
        const signatures = elements.filter((e) => e.startsWith('v1='));
        if (!timestamp || signatures.length === 0) {
            return res.status(401).json({ error: 'Invalid signature format' });
        }
        const signedPayload = `${timestamp}.${rawBody}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');
        const isValid = signatures.some((sig) => {
            const sigValue = sig.substring(3);
            try {
                return crypto_1.default.timingSafeEqual(Buffer.from(sigValue), Buffer.from(expectedSignature));
            }
            catch {
                return false;
            }
        });
        if (!isValid) {
            logger_1.logger.warn({ ip: req.ip }, 'Invalid Stripe webhook signature');
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
        // Verify timestamp
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);
        if (timeDiff > 300) {
            logger_1.logger.warn({ timeDiff }, 'Stripe webhook timestamp too old');
            return res.status(401).json({ error: 'Webhook timestamp expired' });
        }
        logger_1.logger.info('Stripe webhook signature verified');
        next();
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error verifying Stripe webhook');
        return res.status(500).json({ error: 'Webhook verification failed' });
    }
}
/**
 * Generic webhook signature verification
 */
function verifyWebhookSignature(options) {
    return (req, res, next) => {
        const { secret, algorithm = 'sha256', headerName = 'x-webhook-signature', signaturePrefix = '', } = options;
        if (!secret) {
            logger_1.logger.warn('Webhook secret not configured. Verification disabled.');
            return next();
        }
        try {
            const signature = req.headers[headerName.toLowerCase()];
            if (!signature) {
                logger_1.logger.warn('Missing webhook signature');
                return res.status(401).json({ error: 'Missing webhook signature' });
            }
            const payload = JSON.stringify(req.body);
            let expectedSignature;
            if (algorithm === 'hmac-sha256' || algorithm === 'sha256') {
                expectedSignature = crypto_1.default
                    .createHmac('sha256', secret)
                    .update(payload)
                    .digest('hex');
            }
            else if (algorithm === 'sha1') {
                expectedSignature = crypto_1.default
                    .createHmac('sha1', secret)
                    .update(payload)
                    .digest('hex');
            }
            else {
                throw new Error(`Unsupported algorithm: ${algorithm}`);
            }
            // Remove prefix if present
            const cleanSignature = signaturePrefix
                ? signature.replace(signaturePrefix, '')
                : signature;
            // Constant-time comparison
            if (!crypto_1.default.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(expectedSignature))) {
                logger_1.logger.warn({ ip: req.ip }, 'Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid webhook signature' });
            }
            logger_1.logger.info('Webhook signature verified');
            next();
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error verifying webhook');
            return res.status(500).json({ error: 'Webhook verification failed' });
        }
    };
}
/**
 * Verify webhook signature for Mailgun
 * Mailgun uses HMAC SHA256 with timestamp and token
 * Format: signature = HMAC-SHA256(timestamp + token, signing_key)
 */
function verifyMailgunWebhook(req, res, next) {
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!signingKey) {
        logger_1.logger.warn('MAILGUN_WEBHOOK_SIGNING_KEY not configured. Webhook verification disabled.');
        return next();
    }
    try {
        // Mailgun sends signature, timestamp, and token
        // Can be in body (form-encoded) or headers
        const signature = req.body?.signature ||
            req.body?.['signature']?.signature ||
            req.headers['x-mailgun-signature'];
        const timestamp = req.body?.timestamp ||
            req.body?.['signature']?.timestamp ||
            req.headers['x-mailgun-timestamp'];
        const token = req.body?.token ||
            req.body?.['signature']?.token ||
            req.headers['x-mailgun-token'];
        if (!signature || !timestamp || !token) {
            logger_1.logger.warn('Missing Mailgun webhook signature, timestamp, or token');
            return res.status(401).json({ error: 'Missing webhook signature' });
        }
        // Mailgun signature verification: HMAC-SHA256(timestamp + token, signing_key)
        const signedString = timestamp + token;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', signingKey)
            .update(signedString)
            .digest('hex');
        // Use constant-time comparison to prevent timing attacks
        if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            logger_1.logger.warn({ ip: req.ip }, 'Invalid Mailgun webhook signature');
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
        // Verify timestamp to prevent replay attacks (within 15 minutes)
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);
        if (timeDiff > 900) { // 15 minutes
            logger_1.logger.warn({ timeDiff }, 'Mailgun webhook timestamp too old');
            return res.status(401).json({ error: 'Webhook timestamp expired' });
        }
        logger_1.logger.info('Mailgun webhook signature verified');
        next();
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error verifying Mailgun webhook');
        return res.status(500).json({ error: 'Webhook verification failed' });
    }
}
/**
 * Middleware to capture raw body for webhook verification
 * Must be used before body parsing middleware
 */
function captureRawBody(req, res, next) {
    const chunks = [];
    req.on('data', (chunk) => {
        chunks.push(chunk);
    });
    req.on('end', () => {
        req.rawBody = Buffer.concat(chunks).toString('utf8');
        next();
    });
}
