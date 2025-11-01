"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplates = void 0;
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const OneSignal = __importStar(require("@onesignal/node-onesignal"));
const router = (0, express_1.Router)();
// Initialize OneSignal client
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || '';
const configuration = OneSignal.createConfiguration({
    appKey: ONESIGNAL_API_KEY,
});
const oneSignalClient = new OneSignal.DefaultApi(configuration);
/**
 * POST /api/notification/send
 * Send a notification to a user
 */
router.post('/send', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { userId, title, message, type, data } = req.body;
        if (!userId || !title || !message) {
            throw new index_1.ValidationError('userId, title, and message are required');
        }
        const result = await sendPushNotification({
            userId,
            title,
            message,
            type,
            data,
        });
        res.status(200).json({
            success: true,
            notificationId: result.id,
        });
    }
    catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
});
/**
 * POST /api/notification/send-email
 * Send an email notification
 */
router.post('/send-email', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { email, templateId, subject, variables } = req.body;
        if (!email || !templateId) {
            throw new index_1.ValidationError('email and templateId are required');
        }
        const result = await sendEmailNotification({
            email,
            templateId,
            subject,
            variables,
        });
        res.status(200).json({
            success: true,
            messageId: result.id,
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message || 'Failed to send email' });
    }
});
/**
 * POST /api/notification/send-batch
 * Send notifications to multiple users
 */
router.post('/send-batch', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { userIds, title, message, type, data } = req.body;
        if (!userIds || !Array.isArray(userIds) || !title || !message) {
            throw new index_1.ValidationError('userIds (array), title, and message are required');
        }
        const results = await Promise.allSettled(userIds.map(userId => sendPushNotification({
            userId,
            title,
            message,
            type,
            data,
        })));
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        res.status(200).json({
            total: userIds.length,
            successful,
            failed,
        });
    }
    catch (error) {
        console.error('Error sending batch notifications:', error);
        res.status(500).json({ error: error.message || 'Failed to send batch notifications' });
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
            push: push !== undefined ? push : true,
            sms: sms !== undefined ? sms : false,
            transactionAlerts: transactionAlerts !== undefined ? transactionAlerts : true,
            marketingEmails: marketingEmails !== undefined ? marketingEmails : false,
            updatedAt: new Date().toISOString(),
        };
        // TODO: Save to database
        console.log('Updated notification preferences:', preferences);
        res.status(200).json({
            success: true,
            preferences,
        });
    }
    catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: error.message || 'Failed to update preferences' });
    }
});
/**
 * Helper function to send push notification
 */
async function sendPushNotification(params) {
    const { userId, title, message, type, data } = params;
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
        console.warn('OneSignal not configured, skipping push notification');
        return { id: 'mock-notification-id', success: false };
    }
    try {
        const notification = new OneSignal.Notification();
        notification.app_id = ONESIGNAL_APP_ID;
        notification.include_external_user_ids = [userId];
        notification.headings = { en: title };
        notification.contents = { en: message };
        if (type) {
            notification.data = { type, ...data };
        }
        const response = await oneSignalClient.createNotification(notification);
        return { id: response.id, success: true };
    }
    catch (error) {
        console.error('OneSignal error:', error);
        throw new Error('Failed to send push notification');
    }
}
/**
 * Helper function to send email notification
 */
async function sendEmailNotification(params) {
    const { email, templateId, subject, variables } = params;
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
        console.warn('OneSignal not configured, skipping email notification');
        return { id: 'mock-email-id', success: false };
    }
    try {
        const notification = new OneSignal.Notification();
        notification.app_id = ONESIGNAL_APP_ID;
        notification.include_email_tokens = [email];
        notification.template_id = templateId;
        // Note: subject and custom_data may not be directly available in all OneSignal SDK versions
        // Check OneSignal documentation for your SDK version
        // For now, we'll use the data field as a workaround
        if (subject || variables) {
            const emailData = {};
            if (subject)
                emailData.subject = subject;
            if (variables)
                emailData.variables = variables;
            notification.data = emailData;
        }
        const response = await oneSignalClient.createNotification(notification);
        return { id: response.id, success: true };
    }
    catch (error) {
        console.error('OneSignal email error:', error);
        throw new Error('Failed to send email notification');
    }
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
