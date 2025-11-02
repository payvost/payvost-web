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
    console.warn('Mailgun SMTP not configured. Email notifications will be disabled.');
}
// Check if Twilio SMS is configured
const isSMSConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
if (!isSMSConfigured) {
    console.warn('Twilio not configured. SMS notifications will be disabled.');
}
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
        console.error('Error sending batch notifications:', error);
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
        console.error('Error sending SMS:', error);
        res.status(500).json({ error: error.message || 'Failed to send SMS' });
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
 * Helper function to send email notification
 */
async function sendEmailNotification(params) {
    const { email, subject, template, variables } = params;
    if (!isEmailConfigured) {
        console.warn('Email service not configured, skipping email notification');
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
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Helper function to send SMS notification (Twilio placeholder)
 */
async function sendSMSNotification(params) {
    const { phoneNumber, message } = params;
    if (!isSMSConfigured) {
        console.warn('Twilio not configured, SMS will not be sent');
        return { success: false, error: 'SMS service not configured. Twilio integration pending.' };
    }
    try {
        // TODO: Implement actual Twilio integration
        // const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // const messageResult = await twilioClient.messages.create({
        //   body: message,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phoneNumber
        // });
        console.log('SMS would be sent to:', phoneNumber);
        console.log('Message:', message);
        return {
            success: true,
            messageId: 'placeholder-' + Date.now(),
            error: 'Twilio integration pending'
        };
    }
    catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
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
