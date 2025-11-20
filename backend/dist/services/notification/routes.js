"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplates = void 0;
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const nodemailer_1 = __importDefault(require("nodemailer"));
const fcm_1 = require("./fcm");
const twilio_1 = require("./twilio");
const logger_1 = require("../../common/logger");
const router = (0, express_1.Router)();
// Initialize Nodemailer with Mailgun SMTP
const emailTransporter = nodemailer_1.default.createTransport({
    host: process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org',
    port: parseInt(process.env.MAILGUN_SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.MAILGUN_SMTP_LOGIN || '',
        pass: process.env.MAILGUN_SMTP_PASSWORD || '',
    },
});
// Check if email service is configured
const isEmailConfigured = !!(process.env.MAILGUN_SMTP_LOGIN && process.env.MAILGUN_SMTP_PASSWORD);
if (!isEmailConfigured) {
    logger_1.logger.warn('Mailgun SMTP not configured. Email notifications will be disabled.');
}
// Initialize Twilio
(0, twilio_1.initTwilio)();
/**
 * POST /api/notification/send
 * Send an email notification (replaced push notification)
 */
router.post('/send', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { email, subject, template, variables } = req.body;
        if (!email || !subject || !template) {
            throw new index_1.ValidationError('email, subject, and template are required');
        }
        const result = await sendEmailNotification({
            email,
            subject,
            template,
            variables,
        });
        res.status(200).json({
            success: result.success,
            messageId: result.messageId,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error sending notification');
        res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
});
/**
 * POST /api/notification/send-email
 * Send an email notification
 */
router.post('/send-email', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { email, subject, template, variables } = req.body;
        if (!email || !template) {
            throw new index_1.ValidationError('email and template are required');
        }
        const result = await sendEmailNotification({
            email,
            subject: subject || 'Notification from Payvost',
            template,
            variables,
        });
        res.status(200).json({
            success: result.success,
            messageId: result.messageId,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error sending email');
        res.status(500).json({ error: error.message || 'Failed to send email' });
    }
});
/**
 * POST /api/notification/send-batch
 * Send notifications to multiple users
 */
router.post('/send-batch', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { emails, subject, template, variables } = req.body;
        if (!emails || !Array.isArray(emails) || !template) {
            throw new index_1.ValidationError('emails (array) and template are required');
        }
        const results = await Promise.allSettled(emails.map(email => sendEmailNotification({
            email,
            subject: subject || 'Notification from Payvost',
            template,
            variables,
        })));
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
        res.status(200).json({
            total: emails.length,
            successful,
            failed,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error sending batch notifications');
        res.status(500).json({ error: error.message || 'Failed to send batch notifications' });
    }
});
/**
 * POST /api/notification/send-sms
 * Send an SMS notification (Twilio placeholder)
 */
router.post('/send-sms', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        if (!phoneNumber || !message) {
            throw new index_1.ValidationError('phoneNumber and message are required');
        }
        const result = await sendSMSNotification({
            phoneNumber,
            message,
        });
        res.status(200).json({
            success: result.success,
            messageId: result.messageId,
            error: result.error,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error sending SMS');
        res.status(500).json({ error: error.message || 'Failed to send SMS' });
    }
});
/**
 * POST /api/notification/send-push
 * Send a push notification to a single device
 */
router.post('/send-push', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { token, title, body, data, imageUrl, clickAction } = req.body;
        if (!token || !title || !body) {
            throw new index_1.ValidationError('token, title, and body are required');
        }
        const result = await (0, fcm_1.sendPushNotification)({
            token,
            title,
            body,
            data,
            imageUrl,
            clickAction,
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error sending push notification:', error);
        res.status(500).json({ error: error.message || 'Failed to send push notification' });
    }
});
/**
 * POST /api/notification/send-push-batch
 * Send push notifications to multiple devices
 */
router.post('/send-push-batch', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { tokens, title, body, data, imageUrl, clickAction } = req.body;
        if (!tokens || !Array.isArray(tokens) || !title || !body) {
            throw new index_1.ValidationError('tokens (array), title, and body are required');
        }
        const result = await (0, fcm_1.sendMulticastNotification)({
            tokens,
            title,
            body,
            data,
            imageUrl,
            clickAction,
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error sending multicast notification:', error);
        res.status(500).json({ error: error.message || 'Failed to send multicast notification' });
    }
});
/**
 * POST /api/notification/send-topic
 * Send push notification to a topic
 */
router.post('/send-topic', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { topic, title, body, data, imageUrl, clickAction } = req.body;
        if (!topic || !title || !body) {
            throw new index_1.ValidationError('topic, title, and body are required');
        }
        const result = await (0, fcm_1.sendTopicNotification)({
            topic,
            title,
            body,
            data,
            imageUrl,
            clickAction,
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error sending topic notification:', error);
        res.status(500).json({ error: error.message || 'Failed to send topic notification' });
    }
});
/**
 * POST /api/notification/subscribe-topic
 * Subscribe tokens to a topic
 */
router.post('/subscribe-topic', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { tokens, topic } = req.body;
        if (!tokens || !Array.isArray(tokens) || !topic) {
            throw new index_1.ValidationError('tokens (array) and topic are required');
        }
        const result = await (0, fcm_1.subscribeToTopic)(tokens, topic);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error subscribing to topic:', error);
        res.status(500).json({ error: error.message || 'Failed to subscribe to topic' });
    }
});
/**
 * POST /api/notification/unsubscribe-topic
 * Unsubscribe tokens from a topic
 */
router.post('/unsubscribe-topic', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { tokens, topic } = req.body;
        if (!tokens || !Array.isArray(tokens) || !topic) {
            throw new index_1.ValidationError('tokens (array) and topic are required');
        }
        const result = await (0, fcm_1.unsubscribeFromTopic)(tokens, topic);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error unsubscribing from topic:', error);
        res.status(500).json({ error: error.message || 'Failed to unsubscribe from topic' });
    }
});
/**
 * POST /api/notification/preferences
 * Update notification preferences for a user
 */
router.post('/preferences', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { email, push, sms, transactionAlerts, marketingEmails } = req.body;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        // Store preferences (would typically use Firestore or database)
        const preferences = {
            userId,
            email: email !== undefined ? email : true,
            push: push !== undefined ? push : false, // Disabled since we removed OneSignal
            sms: sms !== undefined ? sms : false,
            transactionAlerts: transactionAlerts !== undefined ? transactionAlerts : true,
            marketingEmails: marketingEmails !== undefined ? marketingEmails : false,
            updatedAt: new Date().toISOString(),
        };
        // TODO: Save to database
        logger_1.logger.info({ userId, preferences }, 'Updated notification preferences');
        res.status(200).json({
            success: true,
            preferences,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error updating preferences');
        res.status(500).json({ error: error.message || 'Failed to update preferences' });
    }
});
/**
 * Helper function to send email notification
 */
async function sendEmailNotification(params) {
    const { email, subject, template, variables } = params;
    if (!isEmailConfigured) {
        logger_1.logger.warn('Email service not configured, skipping email notification');
        return { success: false, error: 'Email service not configured' };
    }
    try {
        const html = getEmailTemplate(template, variables || {});
        const info = await emailTransporter.sendMail({
            from: `Payvost <${process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com'}>`,
            to: email,
            subject,
            html,
        });
        logger_1.logger.info({ messageId: info.messageId, email }, 'Email sent successfully');
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        logger_1.logger.error({ err: error, email }, 'Email sending error');
        return { success: false, error: error.message };
    }
}
/**
 * Helper function to send SMS notification via Twilio
 */
async function sendSMSNotification(params) {
    const { phoneNumber, message } = params;
    return (0, twilio_1.sendSMS)(phoneNumber, message);
}
/**
 * Get email template HTML
 */
function getEmailTemplate(template, variables) {
    const templates = {
        transaction_success: (vars) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Transaction Successful ✓</h2>
        <p>Hello ${vars.name},</p>
        <p>Your transaction has been completed successfully.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
          <p><strong>Recipient:</strong> ${vars.recipient}</p>
          <p><strong>Date:</strong> ${vars.date}</p>
          <p><strong>Transaction ID:</strong> ${vars.transactionId}</p>
        </div>
        <p>Best regards,<br>Payvost Team</p>
      </div>
    `,
        transaction_failed: (vars) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Transaction Failed ✗</h2>
        <p>Hello ${vars.name},</p>
        <p>Unfortunately, your transaction could not be completed.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Reason:</strong> ${vars.reason}</p>
          <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
        </div>
        <p>Best regards,<br>Payvost Team</p>
      </div>
    `,
        bill_payment_success: (vars) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Bill Payment Successful ✓</h2>
        <p>Hello ${vars.name},</p>
        <p>Your bill payment has been processed successfully.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Biller:</strong> ${vars.billerName}</p>
          <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
          <p><strong>Reference:</strong> ${vars.reference}</p>
        </div>
        <p>Best regards,<br>Payvost Team</p>
      </div>
    `,
        kyc_verified: (vars) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Account Verified ✓</h2>
        <p>Hello ${vars.name},</p>
        <p>Congratulations! Your account has been successfully verified.</p>
        <p>You now have full access to all Payvost features.</p>
        <p>Best regards,<br>Payvost Team</p>
      </div>
    `,
    };
    return templates[template] ? templates[template](variables) : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>${variables.message || 'Notification from Payvost'}</p>
      <p>Best regards,<br>Payvost Team</p>
    </div>
  `;
}
/**
 * Transaction notification templates
 */
exports.NotificationTemplates = {
    TRANSFER_SENT: {
        title: 'Transfer Sent',
        message: (amount, currency, recipient) => `You sent ${amount} ${currency} to ${recipient}`,
    },
    TRANSFER_RECEIVED: {
        title: 'Transfer Received',
        message: (amount, currency, sender) => `You received ${amount} ${currency} from ${sender}`,
    },
    PAYMENT_SUCCESSFUL: {
        title: 'Payment Successful',
        message: (amount, currency) => `Your payment of ${amount} ${currency} was successful`,
    },
    PAYMENT_FAILED: {
        title: 'Payment Failed',
        message: (amount, currency, reason) => `Your payment of ${amount} ${currency} failed: ${reason}`,
    },
    KYC_APPROVED: {
        title: 'KYC Approved',
        message: 'Your identity verification has been approved',
    },
    KYC_REJECTED: {
        title: 'KYC Rejected',
        message: (reason) => `Your identity verification was rejected: ${reason}`,
    },
    ACCOUNT_LOCKED: {
        title: 'Account Locked',
        message: (reason) => `Your account has been locked: ${reason}`,
    },
    SUSPICIOUS_ACTIVITY: {
        title: 'Suspicious Activity Detected',
        message: 'We detected suspicious activity on your account. Please review your recent transactions.',
    },
};
exports.default = router;
