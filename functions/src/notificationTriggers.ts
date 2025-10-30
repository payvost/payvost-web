import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as functionsV1 from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import {
  sendLoginNotification,
  sendKycStatusNotification,
  sendBusinessStatusNotification,
  sendTransactionNotification,
  sendPaymentLinkNotification,
  sendInvoiceNotification
} from './services/notificationService';

// Helper function to get user data
async function getUserData(userId: string): Promise<admin.firestore.DocumentData | undefined> {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  if (!userDoc.exists) throw new Error('User not found');
  return userDoc.data();
}

export const onNewLogin = functionsV1.analytics.event('login').onLog(async (event: functionsV1.analytics.AnalyticsEvent) => {
  try {
    const userId = event.user?.userId;
    if (!userId) return;

    const userData = await getUserData(userId);
    if (!userData) return;

    await sendLoginNotification({
      email: userData.email ?? '',
      name: userData.fullName || userData.displayName || 'User',
      deviceInfo: 'Web Browser',
      location: 'Unknown',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
});

// KYC Status Change Notifications
export const onKycStatusChange = onDocumentUpdated(
  { document: 'users/{userId}', region: 'us-central1' },
  async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) return;

  try {
    if (beforeData.kycStatus === afterData.kycStatus) return;
    
    await sendKycStatusNotification({
      email: afterData.email ?? '',
      name: afterData.fullName || afterData.displayName || '',
      status: afterData.kycStatus === 'verified' ? 'approved' : 'rejected',
      reason: afterData.kycRejectionReason ?? '',
      nextSteps: afterData.kycNextSteps ?? ''
    });
  } catch (error) {
    console.error('Failed to send KYC status notification:', error);
  }
});

// Business Status Change Notifications
export const onBusinessStatusChange = onDocumentUpdated(
  { document: 'businesses/{businessId}', region: 'us-central1' },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) return;

    // Validate required fields
    if (!afterData.ownerId) {
      console.error('Business missing ownerId, skipping notification');
      return;
    }

    // Only proceed if business status has changed
    if (beforeData.status === afterData.status) return;

    try {
      const userData = await getUserData(afterData.ownerId);
      if (!userData) return;

      await sendBusinessStatusNotification({
        email: userData.email ?? '',
        name: userData.fullName || userData.displayName || '',
        status: afterData.status === 'approved' ? 'approved' : 'rejected',
        businessName: afterData.businessName ?? '',
        reason: afterData.rejectionReason ?? '',
        nextSteps: afterData.nextSteps ?? ''
      });
    } catch (error) {
      console.error('Failed to send business status notification:', error);
    }
  });

// Transaction Status Change Notifications
export const onTransactionStatusChange = onDocumentWritten(
  { document: 'transactions/{transactionId}', region: 'us-central1' },
  async (event) => {
    if (!event.data?.after.exists) return; // Transaction deleted
    
    const transaction = event.data?.after.data();
    const beforeData = event.data?.before.exists ? event.data?.before.data() : null;

    if (!transaction) return;

    // Validate required fields
    if (!transaction.userId) {
      console.error('Transaction missing userId, skipping notification');
      return;
    }

    // Only proceed if status has changed or this is a new transaction
    if (beforeData && beforeData.status === transaction.status) return;

    try {
      const userData = await getUserData(transaction.userId);
      if (!userData) return;

      await sendTransactionNotification({
        email: userData.email ?? '',
        name: userData.fullName || userData.displayName || '',
        transactionId: event.params.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        recipientName: transaction.recipientName ?? '',
        reason: transaction.failureReason ?? ''
      });
    } catch (error) {
      console.error('Failed to send transaction notification:', error);
    }
  });

// Payment Link Generation Notifications
export const onPaymentLinkCreated = onDocumentCreated(
  { document: 'paymentLinks/{linkId}', region: 'us-central1' },
  async (event) => {
    const paymentLink = event.data?.data();
    if (!paymentLink) return;

    // Validate required fields
    if (!paymentLink.createdBy) {
      console.error('Payment link missing createdBy, skipping notification');
      return;
    }
    
    try {
      const userData = await getUserData(paymentLink.createdBy);
      if (!userData) return;

      await sendPaymentLinkNotification({
        email: paymentLink.recipientEmail ?? '',
        name: paymentLink.recipientName ?? '',
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        paymentLink: paymentLink.url ?? '',
        expiryDate: paymentLink.expiryDate?.toDate(),
        description: paymentLink.description ?? ''
      });
    } catch (error) {
      console.error('Failed to send payment link notification:', error);
    }
  });

// Invoice Notifications
export const onInvoiceStatusChange = onDocumentWritten(
  { document: 'invoices/{invoiceId}', region: 'us-central1' },
  async (event) => {
    if (!event.data?.after.exists) return; // Invoice deleted
    
    const invoice = event.data?.after.data();
    const beforeData = event.data?.before.exists ? event.data?.before.data() : null;

    if (!invoice) return;

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
        } catch (err) {
          console.error('Failed to fetch business data:', err);
        }
      }

      // New invoice
      if (!beforeData) {
        await sendInvoiceNotification({
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
        await sendInvoiceNotification({
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
    } catch (error) {
      console.error('Failed to send invoice notification:', error);
    }
  });

// Invoice Reminder Notifications (Scheduled Function)
export const sendInvoiceReminders = onSchedule(
  { schedule: 'every 24 hours', region: 'us-central1' },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const threeDaysFromNow = new admin.firestore.Timestamp(
      now.seconds + (3 * 24 * 60 * 60),
      now.nanoseconds
    );

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

        return sendInvoiceNotification({
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
    } catch (error) {
      console.error('Failed to send invoice reminders:', error);
    }
  });