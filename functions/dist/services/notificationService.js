"use strict";
/**
 * Notification Service using Nodemailer/Mailgun
 * Handles email notifications via SMTP
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLoginNotification = sendLoginNotification;
exports.sendKycStatusNotification = sendKycStatusNotification;
exports.sendBusinessStatusNotification = sendBusinessStatusNotification;
exports.sendTransactionNotification = sendTransactionNotification;
exports.sendPaymentLinkNotification = sendPaymentLinkNotification;
exports.sendInvoiceNotification = sendInvoiceNotification;
const nodemailer_1 = __importDefault(require("nodemailer"));
// --- Email Configuration ---
const MAILGUN_SMTP_HOST = process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org';
const MAILGUN_SMTP_PORT = parseInt(process.env.MAILGUN_SMTP_PORT || '587');
const MAILGUN_SMTP_LOGIN = process.env.MAILGUN_SMTP_LOGIN || '';
const MAILGUN_SMTP_PASSWORD = process.env.MAILGUN_SMTP_PASSWORD || '';
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';
// Initialize email transporter
const emailTransporter = nodemailer_1.default.createTransport({
    host: MAILGUN_SMTP_HOST,
    port: MAILGUN_SMTP_PORT,
    secure: false,
    auth: {
        user: MAILGUN_SMTP_LOGIN,
        pass: MAILGUN_SMTP_PASSWORD,
    },
});
// Check if email service is configured
const isEmailConfigured = !!(MAILGUN_SMTP_LOGIN && MAILGUN_SMTP_PASSWORD);
if (!isEmailConfigured) {
    console.warn('⚠️ Mailgun SMTP not configured. Email notifications will be disabled.');
}
else {
    console.log('✅ Email service configured with Mailgun');
}
// --- Email Subjects ---
const EMAIL_SUBJECTS = {
    AUTH: {
        LOGIN: 'New Login to Your Payvost Account',
        SIGNUP: 'Welcome to Payvost',
        PASSWORD_RESET: 'Password Reset Request',
        NEW_DEVICE: 'New Device Login Detected',
    },
    KYC: {
        SUBMISSION_RECEIVED: 'KYC Submission Received',
        APPROVED: 'KYC Verification Approved',
        REJECTED: 'KYC Verification Update',
    },
    BUSINESS: {
        SUBMISSION_RECEIVED: 'Business Application Received',
        APPROVED: 'Business Account Approved',
        REJECTED: 'Business Application Update',
    },
    TRANSACTION: {
        INITIATED: 'Transaction Initiated',
        SUCCESS: 'Transaction Successful',
        FAILED: 'Transaction Failed',
        STATUS_UPDATE: 'Transaction Status Update',
        REFUND_INITIATED: 'Refund Initiated',
        REFUND_COMPLETED: 'Refund Completed',
    },
    PAYMENT: {
        LINK_GENERATED: 'Payment Link Generated',
        PAYMENT_RECEIVED: 'Payment Received',
    },
    INVOICE: {
        GENERATED: 'New Invoice',
        REMINDER: 'Invoice Payment Reminder',
        PAID: 'Invoice Paid',
    },
};
// --- Helper function to send email ---
async function sendEmail(params) {
    if (!isEmailConfigured) {
        console.warn('Email service not configured, skipping email');
        return { success: false, error: 'Email service not configured' };
    }
    try {
        const info = await emailTransporter.sendMail({
            from: params.from || `Payvost <${MAILGUN_FROM_EMAIL}>`,
            to: params.to,
            subject: params.subject,
            html: params.html,
        });
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('❌ Failed to send email:', error);
        return { success: false, error: error.message };
    }
}
// --- HTML Email Templates ---
function getEmailHTML(type, data) {
    const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  `;
    const baseEnd = `
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Payvost. All rights reserved.</p>
      </div>
    </div>
  `;
    switch (type) {
        case 'login':
            return baseStyle + `
        <h2 style="color: #1f2937; margin-bottom: 20px;">New Login Detected</h2>
        <p>Hello ${data.name},</p>
        <p>We detected a new login to your Payvost account.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Device:</strong> ${data.deviceInfo}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Time:</strong> ${data.timestamp}</p>
        </div>
        <p>If this wasn't you, please secure your account immediately.</p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'kyc_approved':
            return baseStyle + `
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ KYC Verification Approved</h2>
        <p>Hello ${data.name},</p>
        <p>Congratulations! Your identity verification has been approved.</p>
        <p>You now have full access to all Payvost features.</p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'kyc_rejected':
            return baseStyle + `
        <h2 style="color: #ef4444; margin-bottom: 20px;">KYC Verification Update</h2>
        <p>Hello ${data.name},</p>
        <p>Unfortunately, we were unable to verify your identity at this time.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        ${data.nextSteps ? `<p><strong>Next Steps:</strong> ${data.nextSteps}</p>` : ''}
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'business_approved':
            return baseStyle + `
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ Business Account Approved</h2>
        <p>Hello ${data.name},</p>
        <p>Great news! Your business account "<strong>${data.businessName}</strong>" has been approved.</p>
        <p>You can now start accepting payments and using business features.</p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'business_rejected':
            return baseStyle + `
        <h2 style="color: #ef4444; margin-bottom: 20px;">Business Application Update</h2>
        <p>Hello ${data.name},</p>
        <p>We were unable to approve your business account "${data.businessName}" at this time.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        ${data.nextSteps ? `<p><strong>Next Steps:</strong> ${data.nextSteps}</p>` : ''}
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'transaction_success':
            return baseStyle + `
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ Transaction Successful</h2>
        <p>Hello ${data.name},</p>
        <p>Your transaction has been completed successfully.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          ${data.recipientName ? `<p><strong>Recipient:</strong> ${data.recipientName}</p>` : ''}
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        </div>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'transaction_failed':
            return baseStyle + `
        <h2 style="color: #ef4444; margin-bottom: 20px;">Transaction Failed</h2>
        <p>Hello ${data.name},</p>
        <p>Unfortunately, your transaction could not be completed.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        </div>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'payment_link':
            return baseStyle + `
        <h2 style="color: #1f2937; margin-bottom: 20px;">Payment Request</h2>
        <p>Hello ${data.name},</p>
        <p>You have received a payment request.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          ${data.expiryDate ? `<p><strong>Expires:</strong> ${data.expiryDate}</p>` : ''}
        </div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.paymentLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
        </p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'invoice_generated':
            return baseStyle + `
        <h2 style="color: #1f2937; margin-bottom: 20px;">New Invoice</h2>
        <p>Hello ${data.name},</p>
        <p>You have received a new invoice from ${data.businessName}.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        ${data.downloadLink ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a>
        </p>
        ` : ''}
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'invoice_reminder':
            return baseStyle + `
        <h2 style="color: #f59e0b; margin-bottom: 20px;">Invoice Payment Reminder</h2>
        <p>Hello ${data.name},</p>
        <p>This is a reminder that your invoice from ${data.businessName} is due soon.</p>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        ${data.downloadLink ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
        </p>
        ` : ''}
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        case 'invoice_paid':
            return baseStyle + `
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ Invoice Paid</h2>
        <p>Hello ${data.name},</p>
        <p>Thank you! Your invoice has been paid successfully.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
        </div>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
        default:
            return baseStyle + `
        <p>Hello ${data.name},</p>
        <p>You have a new notification from Payvost.</p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
    }
}
// --- Notification Functions ---
// Authentication Notifications
async function sendLoginNotification(data) {
    return sendEmail({
        to: data.email,
        subject: EMAIL_SUBJECTS.AUTH.LOGIN,
        html: getEmailHTML('login', data),
        from: `Payvost Security <${MAILGUN_FROM_EMAIL}>`,
    });
}
// KYC Notifications
async function sendKycStatusNotification(data) {
    return sendEmail({
        to: data.email,
        subject: data.status === 'approved' ? EMAIL_SUBJECTS.KYC.APPROVED : EMAIL_SUBJECTS.KYC.REJECTED,
        html: getEmailHTML(data.status === 'approved' ? 'kyc_approved' : 'kyc_rejected', data),
        from: `Payvost Compliance <${MAILGUN_FROM_EMAIL}>`,
    });
}
// Business Notifications
async function sendBusinessStatusNotification(data) {
    return sendEmail({
        to: data.email,
        subject: data.status === 'approved' ? EMAIL_SUBJECTS.BUSINESS.APPROVED : EMAIL_SUBJECTS.BUSINESS.REJECTED,
        html: getEmailHTML(data.status === 'approved' ? 'business_approved' : 'business_rejected', data),
        from: `Payvost Business <${MAILGUN_FROM_EMAIL}>`,
    });
}
// Transaction Notifications
async function sendTransactionNotification(data) {
    const subject = data.status === 'success' ? EMAIL_SUBJECTS.TRANSACTION.SUCCESS :
        data.status === 'failed' ? EMAIL_SUBJECTS.TRANSACTION.FAILED :
            EMAIL_SUBJECTS.TRANSACTION.INITIATED;
    const type = data.status === 'success' ? 'transaction_success' :
        data.status === 'failed' ? 'transaction_failed' :
            'transaction_initiated';
    return sendEmail({
        to: data.email,
        subject,
        html: getEmailHTML(type, data),
        from: `Payvost Transactions <${MAILGUN_FROM_EMAIL}>`,
    });
}
// Payment Link Notifications
async function sendPaymentLinkNotification(data) {
    return sendEmail({
        to: data.email,
        subject: EMAIL_SUBJECTS.PAYMENT.LINK_GENERATED,
        html: getEmailHTML('payment_link', data),
        from: `Payvost Payments <${MAILGUN_FROM_EMAIL}>`,
    });
}
// Invoice Notifications
async function sendInvoiceNotification(data, type) {
    const subject = type === 'generated' ? EMAIL_SUBJECTS.INVOICE.GENERATED :
        type === 'reminder' ? EMAIL_SUBJECTS.INVOICE.REMINDER :
            EMAIL_SUBJECTS.INVOICE.PAID;
    const emailType = type === 'generated' ? 'invoice_generated' :
        type === 'reminder' ? 'invoice_reminder' :
            'invoice_paid';
    return sendEmail({
        to: data.email,
        subject,
        html: getEmailHTML(emailType, data),
        from: `Payvost Invoicing <${MAILGUN_FROM_EMAIL}>`,
    });
}
