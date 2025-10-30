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
exports.sendInvoiceReminders = exports.onInvoiceStatusChange = exports.onPaymentLinkCreated = exports.onTransactionStatusChange = exports.onBusinessStatusChange = exports.onKycStatusChange = exports.onNewLogin = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const functionsV1 = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const notificationService_1 = require("./services/notificationService");
// Helper function to get user data
async function getUserData(userId) {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists)
        throw new Error('User not found');
    return userDoc.data();
}
exports.onNewLogin = functionsV1.analytics.event('login').onLog(async (event) => {
    try {
        const userId = event.user?.userId;
        if (!userId)
            return;
        const userData = await getUserData(userId);
        if (!userData)
            return;
        await (0, notificationService_1.sendLoginNotification)({
            email: userData.email ?? '',
            name: userData.fullName || userData.displayName || 'User',
            deviceInfo: 'Web Browser',
            location: 'Unknown',
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to send login notification:', error);
    }
});
// KYC Status Change Notifications
exports.onKycStatusChange = (0, firestore_1.onDocumentUpdated)({ document: 'users/{userId}', region: 'us-central1' }, async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    if (!beforeData || !afterData)
        return;
    try {
        if (beforeData.kycStatus === afterData.kycStatus)
            return;
        await (0, notificationService_1.sendKycStatusNotification)({
            email: afterData.email ?? '',
            name: afterData.fullName || afterData.displayName || '',
            status: afterData.kycStatus === 'verified' ? 'approved' : 'rejected',
            reason: afterData.kycRejectionReason ?? '',
            nextSteps: afterData.kycNextSteps ?? ''
        });
    }
    catch (error) {
        console.error('Failed to send KYC status notification:', error);
    }
});
// Business Status Change Notifications
exports.onBusinessStatusChange = (0, firestore_1.onDocumentUpdated)({ document: 'businesses/{businessId}', region: 'us-central1' }, async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    if (!beforeData || !afterData)
        return;
    // Validate required fields
    if (!afterData.ownerId) {
        console.error('Business missing ownerId, skipping notification');
        return;
    }
    // Only proceed if business status has changed
    if (beforeData.status === afterData.status)
        return;
    try {
        const userData = await getUserData(afterData.ownerId);
        if (!userData)
            return;
        await (0, notificationService_1.sendBusinessStatusNotification)({
            email: userData.email ?? '',
            name: userData.fullName || userData.displayName || '',
            status: afterData.status === 'approved' ? 'approved' : 'rejected',
            businessName: afterData.businessName ?? '',
            reason: afterData.rejectionReason ?? '',
            nextSteps: afterData.nextSteps ?? ''
        });
    }
    catch (error) {
        console.error('Failed to send business status notification:', error);
    }
});
// Transaction Status Change Notifications
exports.onTransactionStatusChange = (0, firestore_1.onDocumentWritten)({ document: 'transactions/{transactionId}', region: 'us-central1' }, async (event) => {
    if (!event.data?.after.exists)
        return; // Transaction deleted
    const transaction = event.data?.after.data();
    const beforeData = event.data?.before.exists ? event.data?.before.data() : null;
    if (!transaction)
        return;
    // Validate required fields
    if (!transaction.userId) {
        console.error('Transaction missing userId, skipping notification');
        return;
    }
    // Only proceed if status has changed or this is a new transaction
    if (beforeData && beforeData.status === transaction.status)
        return;
    try {
        const userData = await getUserData(transaction.userId);
        if (!userData)
            return;
        await (0, notificationService_1.sendTransactionNotification)({
            email: userData.email ?? '',
            name: userData.fullName || userData.displayName || '',
            transactionId: event.params.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            recipientName: transaction.recipientName ?? '',
            reason: transaction.failureReason ?? ''
        });
    }
    catch (error) {
        console.error('Failed to send transaction notification:', error);
    }
});
// Payment Link Generation Notifications
exports.onPaymentLinkCreated = (0, firestore_1.onDocumentCreated)({ document: 'paymentLinks/{linkId}', region: 'us-central1' }, async (event) => {
    const paymentLink = event.data?.data();
    if (!paymentLink)
        return;
    // Validate required fields
    if (!paymentLink.createdBy) {
        console.error('Payment link missing createdBy, skipping notification');
        return;
    }
    try {
        const userData = await getUserData(paymentLink.createdBy);
        if (!userData)
            return;
        await (0, notificationService_1.sendPaymentLinkNotification)({
            email: paymentLink.recipientEmail ?? '',
            name: paymentLink.recipientName ?? '',
            amount: paymentLink.amount,
            currency: paymentLink.currency,
            paymentLink: paymentLink.url ?? '',
            expiryDate: paymentLink.expiryDate?.toDate(),
            description: paymentLink.description ?? ''
        });
    }
    catch (error) {
        console.error('Failed to send payment link notification:', error);
    }
});
// Invoice Notifications
exports.onInvoiceStatusChange = (0, firestore_1.onDocumentWritten)({ document: 'invoices/{invoiceId}', region: 'us-central1' }, async (event) => {
    if (!event.data?.after.exists)
        return; // Invoice deleted
    const invoice = event.data?.after.data();
    const beforeData = event.data?.before.exists ? event.data?.before.data() : null;
    if (!invoice)
        return;
    try {
        // Validate required fields
        if (!invoice.userId) {
            console.error('Invoice missing userId, skipping notification');
            return;
        }
        const userData = await getUserData(invoice.userId);
        // Get business data if businessId exists
        let businessData = null;
        if (invoice.businessId && typeof invoice.businessId === 'string' && invoice.businessId.trim() !== '') {
            try {
                const businessDoc = await admin.firestore()
                    .collection('businesses')
                    .doc(invoice.businessId)
                    .get();
                businessData = businessDoc.data();
            }
            catch (err) {
                console.error('Failed to fetch business data:', err);
            }
        }
        // New invoice
        if (!beforeData) {
            await (0, notificationService_1.sendInvoiceNotification)({
                email: invoice.customerEmail ?? '',
                name: invoice.customerName ?? '',
                invoiceNumber: invoice.invoiceNumber ?? '',
                amount: invoice.amount,
                currency: invoice.currency ?? '',
                dueDate: invoice.dueDate?.toDate() ?? new Date(),
                businessName: businessData?.businessName ?? 'Payvost',
                downloadLink: invoice.downloadUrl ?? ''
            }, 'generated');
            return;
        }
        // Invoice paid
        if (beforeData.status !== 'paid' && invoice.status === 'paid') {
            await (0, notificationService_1.sendInvoiceNotification)({
                email: invoice.customerEmail ?? '',
                name: invoice.customerName ?? '',
                invoiceNumber: invoice.invoiceNumber ?? '',
                amount: invoice.amount,
                currency: invoice.currency ?? '',
                dueDate: invoice.dueDate?.toDate() ?? new Date(),
                businessName: businessData?.businessName ?? 'Payvost',
                downloadLink: invoice.downloadUrl ?? ''
            }, 'paid');
        }
    }
    catch (error) {
        console.error('Failed to send invoice notification:', error);
    }
});
// Invoice Reminder Notifications (Scheduled Function)
exports.sendInvoiceReminders = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', region: 'us-central1' }, async () => {
    const now = admin.firestore.Timestamp.now();
    const threeDaysFromNow = new admin.firestore.Timestamp(now.seconds + (3 * 24 * 60 * 60), now.nanoseconds);
    try {
        const overdueInvoices = await admin.firestore()
            .collection('invoices')
            .where('status', '==', 'pending')
            .where('dueDate', '<=', threeDaysFromNow)
            .get();
        const reminderPromises = overdueInvoices.docs.map(async (doc) => {
            const invoice = doc.data();
            const businessData = await admin.firestore()
                .collection('businesses')
                .doc(invoice.businessId)
                .get();
            return (0, notificationService_1.sendInvoiceNotification)({
                email: invoice.customerEmail,
                name: invoice.customerName,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.amount,
                currency: invoice.currency,
                dueDate: invoice.dueDate.toDate(),
                businessName: businessData.data()?.businessName,
                downloadLink: invoice.downloadUrl
            }, 'reminder');
        });
        await Promise.all(reminderPromises);
    }
    catch (error) {
        console.error('Failed to send invoice reminders:', error);
    }
});
