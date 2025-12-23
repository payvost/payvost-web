"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = require("./prisma");
const mailgun_handler_1 = require("./mailgun-handler");
const app = (0, express_1.default)();
const PORT = process.env.WEBHOOK_SERVICE_PORT || 3008;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.text({ type: 'application/json' })); // Accept raw text for signature verification
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // For Mailgun form-encoded webhooks
// Initialize Firebase Admin
if (!firebase_admin_1.default.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
        }
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
            const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8'));
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
        }
        else {
            firebase_admin_1.default.initializeApp();
        }
        console.log('[Webhook Service] Firebase Admin initialized');
    }
    catch (error) {
        console.error('[Webhook Service] Firebase Admin initialization error:', error.message);
    }
}
// Prisma is initialized in ./prisma.ts
const db = firebase_admin_1.default.firestore();
const auth = firebase_admin_1.default.auth();
// Email service URL (for sending notifications)
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3006';
/**
 * Verify webhook signature using constant-time comparison
 */
function verifyWebhookSignature(payload, signature, secret) {
    const hmac = (0, crypto_1.createHmac)('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    if (signature.length !== digest.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
        result |= signature.charCodeAt(i) ^ digest.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Fetch user data from Firebase
 */
async function getUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return {
                email: userData?.email || '',
                name: userData?.fullName || userData?.name || userData?.username || 'User',
            };
        }
        const authUser = await auth.getUser(userId);
        return {
            email: authUser.email || '',
            name: authUser.displayName || 'User',
        };
    }
    catch (error) {
        console.error('[Webhook Service] Error fetching user data:', error);
        return null;
    }
}
/**
 * Send email notification via email service
 */
async function sendEmailNotification(to, subject, html) {
    try {
        await fetch(`${EMAIL_SERVICE_URL}/single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html }),
        });
    }
    catch (error) {
        console.error('[Webhook Service] Failed to send email notification:', error);
        // Don't throw - email failure shouldn't fail webhook processing
    }
}
/**
 * Refund balance to user account
 */
async function refundToAccount(accountId, amount, currency, description, referenceId) {
    if (!accountId) {
        console.warn('[Webhook Service] No accountId provided for refund');
        return;
    }
    try {
        const account = await prisma_1.prisma.account.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            console.error(`[Webhook Service] Account ${accountId} not found for refund`);
            return;
        }
        if (account.currency !== currency) {
            console.error(`[Webhook Service] Currency mismatch: account has ${account.currency}, refund is ${currency}`);
            return;
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            const lockedAccount = await tx.$queryRaw `
        SELECT id, balance
        FROM "Account"
        WHERE id = ${accountId}
        FOR UPDATE
      `;
            const accountData = lockedAccount[0];
            if (!accountData) {
                throw new Error('Account not found');
            }
            const currentBalance = parseFloat(accountData.balance);
            const refundAmount = parseFloat(amount.toString());
            const newBalance = (currentBalance + refundAmount).toFixed(8);
            await tx.account.update({
                where: { id: accountId },
                data: { balance: newBalance },
            });
            await tx.ledgerEntry.create({
                data: {
                    accountId,
                    amount: refundAmount.toString(),
                    balanceAfter: newBalance,
                    type: 'CREDIT',
                    description: description,
                    referenceId: referenceId || null,
                },
            });
        });
        console.log(`[Webhook Service] Refunded ${amount} ${currency} to account ${accountId}`);
    }
    catch (error) {
        console.error('[Webhook Service] Error refunding balance:', error);
        throw error;
    }
}
/**
 * Handle topup success
 */
async function handleTopupSuccess(data) {
    console.log('[Webhook Service] Topup successful:', data);
    try {
        const customId = data.customIdentifier;
        const [, userId, accountId] = customId?.split('-') || [];
        await prisma_1.prisma.externalTransaction.upsert({
            where: {
                providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
            },
            update: {
                status: 'COMPLETED',
                webhookReceived: true,
                webhookData: data,
                completedAt: new Date(),
                updatedAt: new Date(),
            },
            create: {
                userId: userId || 'unknown',
                accountId: accountId || null,
                provider: 'RELOADLY',
                providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
                type: 'AIRTIME_TOPUP',
                status: 'COMPLETED',
                amount: data.amount || 0,
                currency: data.currency || 'USD',
                recipientDetails: {
                    phone: data.recipientPhone,
                    operator: data.operatorName,
                },
                metadata: data,
                webhookReceived: true,
                webhookData: data,
                completedAt: new Date(),
            },
        });
        if (userId && userId !== 'unknown') {
            const userData = await getUserData(userId);
            if (userData) {
                const emailHtml = `
          <h2>✓ Airtime Top-up Successful</h2>
          <p>Hello ${userData.name},</p>
          <p>Your airtime top-up has been completed successfully.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Phone Number:</strong> ${data.recipientPhone}</p>
            <p><strong>Operator:</strong> ${data.operatorName}</p>
            <p><strong>Amount:</strong> ${data.amount} ${data.currency || 'USD'}</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
          </div>
          <p>Best regards,<br>The Payvost Team</p>
        `;
                await sendEmailNotification(userData.email, 'Airtime Top-up Successful', emailHtml);
            }
        }
    }
    catch (error) {
        console.error('[Webhook Service] Error updating transaction:', error);
    }
    return { success: true, message: 'Topup success processed' };
}
/**
 * Handle topup failure
 */
async function handleTopupFailed(data) {
    console.log('[Webhook Service] Topup failed:', data);
    try {
        const customId = data.customIdentifier;
        const [, userId, accountId] = customId?.split('-') || [];
        const transactionRecord = await prisma_1.prisma.externalTransaction.upsert({
            where: {
                providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
            },
            update: {
                status: 'FAILED',
                errorMessage: data.errorMessage || data.failureReason || 'Topup failed',
                webhookReceived: true,
                webhookData: data,
                updatedAt: new Date(),
            },
            create: {
                userId: userId || 'unknown',
                accountId: accountId || null,
                provider: 'RELOADLY',
                providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
                type: 'AIRTIME_TOPUP',
                status: 'FAILED',
                amount: data.amount || 0,
                currency: data.currency || 'USD',
                errorMessage: data.errorMessage || data.failureReason || 'Topup failed',
                metadata: data,
                webhookReceived: true,
                webhookData: data,
            },
        });
        if (accountId && data.amount) {
            try {
                await refundToAccount(accountId, data.amount, data.currency || 'USD', `Refund for failed airtime top-up`, transactionRecord.id);
            }
            catch (refundError) {
                console.error('[Webhook Service] Failed to refund balance:', refundError);
            }
        }
        if (userId && userId !== 'unknown') {
            const userData = await getUserData(userId);
            if (userData) {
                const emailHtml = `
          <h2>❌ Airtime Top-up Failed</h2>
          <p>Hello ${userData.name},</p>
          <p>Your airtime top-up has failed. ${data.errorMessage || data.failureReason || 'Topup failed'}</p>
          <p>If payment was deducted, it has been refunded to your account.</p>
          <p>Best regards,<br>The Payvost Team</p>
        `;
                await sendEmailNotification(userData.email, 'Airtime Top-up Failed', emailHtml);
            }
        }
    }
    catch (error) {
        console.error('[Webhook Service] Error updating failed transaction:', error);
    }
    return { success: true, message: 'Topup failure processed' };
}
/**
 * Handle gift card order success
 */
async function handleGiftCardSuccess(data) {
    console.log('[Webhook Service] Gift card order successful:', data);
    try {
        const customId = data.customIdentifier;
        const [, userId, accountId] = customId?.split('-') || [];
        await prisma_1.prisma.externalTransaction.upsert({
            where: {
                providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
            },
            update: {
                status: 'COMPLETED',
                webhookReceived: true,
                webhookData: data,
                completedAt: new Date(),
                updatedAt: new Date(),
                recipientDetails: {
                    email: data.recipientEmail,
                    productName: data.productName,
                    redeemCode: data.redeemCode || data.redemptionCode || data.code,
                    pin: data.pin || data.pinCode,
                    expiryDate: data.expiryDate,
                    cardNumber: data.cardNumber,
                },
            },
            create: {
                userId: userId || 'unknown',
                accountId: accountId || null,
                provider: 'RELOADLY',
                providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
                type: 'GIFT_CARD',
                status: 'COMPLETED',
                amount: data.amount || 0,
                currency: data.currencyCode || 'USD',
                recipientDetails: {
                    email: data.recipientEmail,
                    productName: data.productName,
                    redeemCode: data.redeemCode || data.redemptionCode || data.code,
                    pin: data.pin || data.pinCode,
                    expiryDate: data.expiryDate,
                    cardNumber: data.cardNumber,
                },
                metadata: data,
                webhookReceived: true,
                webhookData: data,
                completedAt: new Date(),
            },
        });
        if (data.recipientEmail && (data.redeemCode || data.redemptionCode || data.code)) {
            const userData = userId && userId !== 'unknown' ? await getUserData(userId) : null;
            const emailHtml = `
        <h2>🎁 Your Gift Card is Ready!</h2>
        <p>Hello ${data.recipientName || 'Valued Customer'},</p>
        <p>Your gift card order has been completed successfully.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Product:</strong> ${data.productName}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currencyCode || 'USD'}</p>
          <p><strong>Redeem Code:</strong> ${data.redeemCode || data.redemptionCode || data.code}</p>
          ${data.pin ? `<p><strong>PIN:</strong> ${data.pin}</p>` : ''}
          ${data.expiryDate ? `<p><strong>Expiry Date:</strong> ${data.expiryDate}</p>` : ''}
        </div>
        <p>Best regards,<br>${userData?.name || 'Payvost'}</p>
      `;
            await sendEmailNotification(data.recipientEmail, 'Your Gift Card is Ready!', emailHtml);
        }
    }
    catch (error) {
        console.error('[Webhook Service] Error updating gift card transaction:', error);
    }
    return { success: true, message: 'Gift card order success processed' };
}
/**
 * Handle gift card order failure
 */
async function handleGiftCardFailed(data) {
    console.log('[Webhook Service] Gift card order failed:', data);
    try {
        const customId = data.customIdentifier;
        const [, userId, accountId] = customId?.split('-') || [];
        const transactionRecord = await prisma_1.prisma.externalTransaction.upsert({
            where: {
                providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
            },
            update: {
                status: 'FAILED',
                errorMessage: data.errorMessage || 'Gift card order failed',
                webhookReceived: true,
                webhookData: data,
                updatedAt: new Date(),
            },
            create: {
                userId: userId || 'unknown',
                accountId: accountId || null,
                provider: 'RELOADLY',
                providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
                type: 'GIFT_CARD',
                status: 'FAILED',
                amount: data.amount || 0,
                currency: data.currencyCode || 'USD',
                errorMessage: data.errorMessage || 'Gift card order failed',
                metadata: data,
                webhookReceived: true,
                webhookData: data,
            },
        });
        if (accountId && data.amount) {
            try {
                await refundToAccount(accountId, data.amount, data.currencyCode || 'USD', `Refund for failed gift card order`, transactionRecord.id);
            }
            catch (refundError) {
                console.error('[Webhook Service] Failed to refund balance:', refundError);
            }
        }
    }
    catch (error) {
        console.error('[Webhook Service] Error updating failed gift card transaction:', error);
    }
    return { success: true, message: 'Gift card order failure processed' };
}
/**
 * Handle bill payment success
 */
async function handleBillPaymentSuccess(data) {
    console.log('[Webhook Service] Bill payment successful:', data);
    try {
        const customId = data.customIdentifier;
        const [, userId, accountId] = customId?.split('-') || [];
        await prisma_1.prisma.externalTransaction.upsert({
            where: {
                providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
            },
            update: {
                status: 'COMPLETED',
                webhookReceived: true,
                webhookData: data,
                completedAt: new Date(),
                updatedAt: new Date(),
                recipientDetails: {
                    billerName: data.billerName,
                    accountNumber: data.subscriberAccountNumber,
                    receiptNumber: data.receiptNumber || data.receipt || data.transactionId?.toString(),
                    receiptUrl: data.receiptUrl || data.receiptLink,
                    confirmationCode: data.confirmationCode || data.confirmationNumber,
                    paymentDate: data.paymentDate || new Date().toISOString(),
                },
            },
            create: {
                userId: userId || 'unknown',
                accountId: accountId || null,
                provider: 'RELOADLY',
                providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
                type: 'BILL_PAYMENT',
                status: 'COMPLETED',
                amount: data.amount || 0,
                currency: data.currencyCode || 'USD',
                recipientDetails: {
                    billerName: data.billerName,
                    accountNumber: data.subscriberAccountNumber,
                    receiptNumber: data.receiptNumber || data.receipt || data.transactionId?.toString(),
                    receiptUrl: data.receiptUrl || data.receiptLink,
                    confirmationCode: data.confirmationCode || data.confirmationNumber,
                    paymentDate: data.paymentDate || new Date().toISOString(),
                },
                metadata: data,
                webhookReceived: true,
                webhookData: data,
                completedAt: new Date(),
            },
        });
    }
    catch (error) {
        console.error('[Webhook Service] Error updating bill payment transaction:', error);
    }
    return { success: true, message: 'Bill payment success processed' };
}
/**
 * Handle bill payment failure
 */
async function handleBillPaymentFailed(data) {
    console.log('[Webhook Service] Bill payment failed:', data);
    try {
        const customId = data.customIdentifier;
        const [, userId, accountId] = customId?.split('-') || [];
        const transactionRecord = await prisma_1.prisma.externalTransaction.upsert({
            where: {
                providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
            },
            update: {
                status: 'FAILED',
                errorMessage: data.errorMessage || 'Bill payment failed',
                webhookReceived: true,
                webhookData: data,
                updatedAt: new Date(),
            },
            create: {
                userId: userId || 'unknown',
                accountId: accountId || null,
                provider: 'RELOADLY',
                providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
                type: 'BILL_PAYMENT',
                status: 'FAILED',
                amount: data.amount || 0,
                currency: data.currencyCode || 'USD',
                errorMessage: data.errorMessage || 'Bill payment failed',
                metadata: data,
                webhookReceived: true,
                webhookData: data,
            },
        });
        if (accountId && data.amount) {
            try {
                await refundToAccount(accountId, data.amount, data.currencyCode || 'USD', `Refund for failed bill payment`, transactionRecord.id);
            }
            catch (refundError) {
                console.error('[Webhook Service] Failed to refund balance:', refundError);
            }
        }
    }
    catch (error) {
        console.error('[Webhook Service] Error updating failed bill payment:', error);
    }
    return { success: true, message: 'Bill payment failure processed' };
}
/**
 * Route webhook to appropriate handler
 */
async function handleWebhookEvent(payload) {
    const { event, data } = payload;
    switch (event) {
        case 'topup.success':
            return handleTopupSuccess(data);
        case 'topup.failed':
            return handleTopupFailed(data);
        case 'giftcard.order.success':
            return handleGiftCardSuccess(data);
        case 'giftcard.order.failed':
            return handleGiftCardFailed(data);
        case 'bill.payment.success':
            return handleBillPaymentSuccess(data);
        case 'bill.payment.failed':
            return handleBillPaymentFailed(data);
        default:
            console.warn('[Webhook Service] Unknown webhook event:', event);
            return {
                success: false,
                message: `Unknown event type: ${event}`,
            };
    }
}
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'webhook-service',
        timestamp: new Date().toISOString(),
        firebaseInitialized: firebase_admin_1.default.apps.length > 0,
        prismaConnected: true,
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'Payvost Webhook Service',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            reloadly: 'POST /reloadly',
            mailgun: 'POST /mailgun',
        },
    });
});
// Mailgun webhook endpoint
// Note: Mailgun sends form-encoded data, which is handled by the urlencoded middleware above
app.post('/mailgun', mailgun_handler_1.handleMailgunWebhook);
// Reloadly webhook endpoint
app.post('/reloadly', async (req, res) => {
    try {
        const webhookSecret = process.env.RELOADLY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[Webhook Service] Reloadly webhook secret not configured');
            return res.status(500).json({ error: 'Webhook not configured' });
        }
        // Get signature from headers
        const signature = req.headers['x-reloadly-signature'] ||
            req.headers['x-webhook-signature'] ||
            '';
        // Get body as text for signature verification
        const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        // Verify signature
        if (!verifyWebhookSignature(bodyText, signature, webhookSecret)) {
            console.error('[Webhook Service] Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        // Parse payload
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        // Log webhook receipt
        console.log('[Webhook Service] Received Reloadly webhook:', {
            event: payload.event,
            transactionId: payload.data?.transactionId,
            timestamp: payload.timestamp,
        });
        // Handle the webhook event
        const result = await handleWebhookEvent(payload);
        // Return success response immediately (webhooks need quick response)
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('[Webhook Service] Error processing Reloadly webhook:', error);
        return res.status(500).json({
            error: 'Webhook processing failed',
            message: error.message,
            details: NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
// Graceful shutdown
const shutdown = async () => {
    console.log('[Webhook Service] Shutting down gracefully...');
    await prisma_1.prisma.$disconnect();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
app.listen(PORT, () => {
    console.log(`[Webhook Service] Running on port ${PORT}`);
    console.log(`[Webhook Service] Environment: ${NODE_ENV}`);
    console.log(`[Webhook Service] Firebase initialized: ${firebase_admin_1.default.apps.length > 0}`);
    console.log(`[Webhook Service] Email service URL: ${EMAIL_SERVICE_URL}`);
    console.log(`[Webhook Service] Endpoints:`);
    console.log(`  - GET http://localhost:${PORT}/health`);
    console.log(`  - POST http://localhost:${PORT}/reloadly`);
    console.log(`  - POST http://localhost:${PORT}/mailgun`);
});
