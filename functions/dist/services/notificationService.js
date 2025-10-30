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
exports.sendLoginNotification = sendLoginNotification;
exports.sendKycStatusNotification = sendKycStatusNotification;
exports.sendBusinessStatusNotification = sendBusinessStatusNotification;
exports.sendTransactionNotification = sendTransactionNotification;
exports.sendPaymentLinkNotification = sendPaymentLinkNotification;
exports.sendInvoiceNotification = sendInvoiceNotification;
const OneSignal = __importStar(require("@onesignal/node-onesignal"));
// --- OneSignal Client Initialization ---
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || '';
// Initialize OneSignal client
const configuration = OneSignal.createConfiguration({
    appKey: ONESIGNAL_API_KEY,
});
const client = new OneSignal.DefaultApi(configuration);
// --- Notification Templates ---
const EMAIL_TEMPLATES = {
    AUTH: {
        LOGIN: 'template_id_for_login',
        SIGNUP: 'template_id_for_signup',
        PASSWORD_RESET: 'template_id_for_password_reset',
        NEW_DEVICE: 'template_id_for_new_device',
    },
    KYC: {
        SUBMISSION_RECEIVED: 'template_id_for_kyc_submission',
        APPROVED: 'template_id_for_kyc_approved',
        REJECTED: 'template_id_for_kyc_rejected',
    },
    BUSINESS: {
        SUBMISSION_RECEIVED: 'template_id_for_business_submission',
        APPROVED: 'template_id_for_business_approved',
        REJECTED: 'template_id_for_business_rejected',
    },
    TRANSACTION: {
        INITIATED: 'template_id_for_transaction_initiated',
        SUCCESS: 'template_id_for_transaction_success',
        FAILED: 'template_id_for_transaction_failed',
        STATUS_UPDATE: 'template_id_for_transaction_status',
        REFUND_INITIATED: 'template_id_for_refund_initiated',
        REFUND_COMPLETED: 'template_id_for_refund_completed',
    },
    PAYMENT: {
        LINK_GENERATED: 'template_id_for_payment_link',
        PAYMENT_RECEIVED: 'template_id_for_payment_received',
    },
    INVOICE: {
        GENERATED: 'template_id_for_invoice_generated',
        REMINDER: 'template_id_for_invoice_reminder',
        PAID: 'template_id_for_invoice_paid',
    },
};
// --- Notification Functions ---
// Authentication Notifications
async function sendLoginNotification(data) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [data.email];
    notification.template_id = EMAIL_TEMPLATES.AUTH.LOGIN;
    notification.email_from_name = "Payvost Security";
    notification.email_from_address = "noreply@payvost.com";
    notification.contents = {
        en: "New login to your Payvost account"
    };
    notification.data = {
        name: data.name,
        deviceInfo: data.deviceInfo,
        location: data.location,
        timestamp: data.timestamp.toISOString(),
    };
    try {
        const response = await client.createNotification(notification);
        console.log('✅ Login notification sent:', response.id);
        return { success: true, id: response.id };
    }
    catch (error) {
        console.error('❌ Failed to send login notification:', error.body || error);
        throw new Error('Failed to send login notification');
    }
}
// KYC Notifications
async function sendKycStatusNotification(data) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [data.email];
    notification.template_id = data.status === 'approved' ?
        EMAIL_TEMPLATES.KYC.APPROVED :
        EMAIL_TEMPLATES.KYC.REJECTED;
    notification.email_from_name = "Payvost Compliance";
    notification.email_from_address = "noreply@payvost.com";
    notification.contents = {
        en: `Your KYC verification has been ${data.status}`
    };
    notification.data = {
        name: data.name,
        status: data.status,
        reason: data.reason,
        nextSteps: data.nextSteps,
    };
    try {
        const response = await client.createNotification(notification);
        console.log('✅ KYC status notification sent:', response.id);
        return { success: true, id: response.id };
    }
    catch (error) {
        console.error('❌ Failed to send KYC status notification:', error.body || error);
        throw new Error('Failed to send KYC status notification');
    }
}
// Business Notifications
async function sendBusinessStatusNotification(data) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [data.email];
    notification.template_id = data.status === 'approved' ?
        EMAIL_TEMPLATES.BUSINESS.APPROVED :
        EMAIL_TEMPLATES.BUSINESS.REJECTED;
    notification.email_from_name = "Payvost Business";
    notification.email_from_address = "noreply@payvost.com";
    notification.contents = {
        en: `Your business verification has been ${data.status}`
    };
    notification.data = {
        name: data.name,
        businessName: data.businessName,
        status: data.status,
        reason: data.reason,
        nextSteps: data.nextSteps,
    };
    try {
        const response = await client.createNotification(notification);
        console.log('✅ Business status notification sent:', response.id);
        return { success: true, id: response.id };
    }
    catch (error) {
        console.error('❌ Failed to send business status notification:', error.body || error);
        throw new Error('Failed to send business status notification');
    }
}
// Transaction Notifications
async function sendTransactionNotification(data) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [data.email];
    notification.template_id = EMAIL_TEMPLATES.TRANSACTION[data.status.toUpperCase()];
    notification.email_from_name = "Payvost Transactions";
    notification.email_from_address = "noreply@payvost.com";
    notification.contents = {
        en: `Transaction ${data.status}: ${data.amount} ${data.currency}`
    };
    notification.data = {
        name: data.name,
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        recipientName: data.recipientName,
        reason: data.reason,
    };
    try {
        const response = await client.createNotification(notification);
        console.log('✅ Transaction notification sent:', response.id);
        return { success: true, id: response.id };
    }
    catch (error) {
        console.error('❌ Failed to send transaction notification:', error.body || error);
        throw new Error('Failed to send transaction notification');
    }
}
// Payment Link Notifications
async function sendPaymentLinkNotification(data) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [data.email];
    notification.template_id = EMAIL_TEMPLATES.PAYMENT.LINK_GENERATED;
    notification.email_from_name = "Payvost Payments";
    notification.email_from_address = "noreply@payvost.com";
    notification.contents = {
        en: `Payment request for ${data.amount} ${data.currency}`
    };
    notification.data = {
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        paymentLink: data.paymentLink,
        expiryDate: data.expiryDate?.toISOString(),
        description: data.description,
    };
    try {
        const response = await client.createNotification(notification);
        console.log('✅ Payment link notification sent:', response.id);
        return { success: true, id: response.id };
    }
    catch (error) {
        console.error('❌ Failed to send payment link notification:', error.body || error);
        throw new Error('Failed to send payment link notification');
    }
}
// Invoice Notifications
async function sendInvoiceNotification(data, type) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [data.email];
    notification.template_id = EMAIL_TEMPLATES.INVOICE[type.toUpperCase()];
    notification.email_from_name = "Payvost Invoicing";
    notification.email_from_address = "noreply@payvost.com";
    notification.contents = {
        en: `Invoice ${type}: ${data.amount} ${data.currency}`
    };
    notification.data = {
        name: data.name,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate.toISOString(),
        businessName: data.businessName,
        downloadLink: data.downloadLink,
    };
    try {
        const response = await client.createNotification(notification);
        console.log('✅ Invoice notification sent:', response.id);
        return { success: true, id: response.id };
    }
    catch (error) {
        console.error('❌ Failed to send invoice notification:', error.body || error);
        throw new Error('Failed to send invoice notification');
    }
}
