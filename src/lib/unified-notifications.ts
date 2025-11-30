/**
 * Unified Notification Helper
 * Sends notifications via all channels: Push (FCM), Email, In-App
 */

import { notificationService } from '@/services/notificationService';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

/**
 * Send push notification via backend API
 */
async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('/api/notification/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to send push notification' };
    }
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send topic notification via backend API
 */
async function sendTopicNotification(params: {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('/api/notification/send-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to send topic notification' };
    }
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import type { EmailTemplate } from '@/services/notificationService';
import { getAllValidTemplates, isValidTemplate } from '@/lib/email-template-mapper';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'transaction' | 'kyc' | 'payment' | 'bill' | 'security' | 'announcement' | 'general' | 'wallet' | 'support' | 'dispute';
  data?: Record<string, string>;
  clickAction?: string;
  emailTemplate?: EmailTemplate;
  emailVariables?: Record<string, any>;
  context?: 'personal' | 'business';
}

/**
 * Send notification via all channels
 * This is the main function to use throughout your app
 */
export async function sendUnifiedNotification(payload: NotificationPayload): Promise<{
  push: { success: boolean; error?: string };
  email: { success: boolean; error?: string };
  inApp: { success: boolean; error?: string };
}> {
  const { userId, title, body, type, data, clickAction, emailTemplate, emailVariables, context = 'personal' } = payload;

  const results = {
    push: { success: false } as { success: boolean; error?: string },
    email: { success: false } as { success: boolean; error?: string },
    inApp: { success: false } as { success: boolean; error?: string },
  };

  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData) {
      console.error(`User ${userId} not found`);
      return results;
    }

    // 1. Send Push Notification (FCM)
    if (userData.fcmToken && userData.preferences?.push !== false) {
      try {
        const pushResult = await sendPushNotification({
          token: userData.fcmToken,
          title,
          body,
          data: {
            type,
            userId,
            ...data,
          },
          clickAction: clickAction || '/dashboard/notifications',
        });

        results.push = pushResult;
      } catch (error: any) {
        console.error('Error sending push notification:', error);
        results.push = { success: false, error: error.message };
      }
    }

    // 2. Send Email
    if (userData.email && userData.preferences?.email !== false) {
      try {
        // Use a valid template or skip email if template is invalid
        const validTemplate = emailTemplate && isValidTemplate(emailTemplate);
        
        if (validTemplate) {
          const emailResult = await notificationService.sendEmail({
            to: userData.email,
            subject: title,
            template: emailTemplate,
            variables: {
              name: userData.fullName || userData.displayName || 'User',
              message: body,
              ...emailVariables,
            },
          });
          results.email = emailResult;
        } else {
          // Skip email if no valid template
          results.email = { success: false, error: 'No valid email template provided' };
        }
      } catch (error: any) {
        console.error('Error sending email:', error);
        results.email = { success: false, error: error.message };
      }
    }

    // 3. Create In-App Notification (store in user's notifications subcollection)
    try {
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        userId,
        title,
        description: body,
        message: body,
        type: mapTypeToIcon(type),
        icon: getIconForType(type),
        context: context,
        read: false,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        href: clickAction || '/dashboard/notifications',
        link: clickAction || '/dashboard/notifications',
        data: data || {},
      });

      results.inApp = { success: true };
    } catch (error: any) {
      console.error('Error creating in-app notification:', error);
      results.inApp = { success: false, error: error.message };
    }
  } catch (error: any) {
    console.error('Error in sendUnifiedNotification:', error);
  }

  return results;
}

/**
 * Convenience functions for common notification types
 */

export async function notifyTransactionSuccess(
  userId: string,
  amount: number,
  currency: string,
  recipient: string,
  transactionId: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Transaction Successful',
    body: `You sent ${amount} ${currency} to ${recipient}`,
    type: 'transaction',
    data: {
      transactionId,
      status: 'success',
    },
    clickAction: '/dashboard/transactions',
    emailTemplate: 'transaction_success',
    emailVariables: {
      amount: amount.toString(),
      currency,
      recipient,
      date: new Date().toLocaleString(),
      transactionId,
    },
  });
}

export async function notifyTransactionFailed(
  userId: string,
  amount: number,
  currency: string,
  reason: string,
  transactionId: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Transaction Failed',
    body: `Your transaction of ${amount} ${currency} failed: ${reason}`,
    type: 'transaction',
    data: {
      transactionId,
      status: 'failed',
    },
    clickAction: '/dashboard/transactions',
    emailTemplate: 'transaction_failed',
    emailVariables: {
      amount: amount.toString(),
      currency,
      reason,
      date: new Date().toLocaleString(),
      transactionId,
    },
  });
}

export async function notifyKYCApproved(userId: string) {
  return sendUnifiedNotification({
    userId,
    title: 'KYC Approved ✓',
    body: 'Congratulations! Your identity verification has been approved.',
    type: 'kyc',
    data: {
      status: 'approved',
    },
    clickAction: '/dashboard/settings',
    emailTemplate: 'kyc_verified',
    emailVariables: {},
  });
}

export async function notifyKYCRejected(userId: string, reason: string) {
  return sendUnifiedNotification({
    userId,
    title: 'KYC Rejected',
    body: `Your identity verification was rejected: ${reason}`,
    type: 'kyc',
    data: {
      status: 'rejected',
      reason,
    },
    clickAction: '/dashboard/settings',
    emailTemplate: 'kyc_rejected',
    emailVariables: {
      reason,
    },
  });
}

export async function notifyPaymentSuccess(
  userId: string,
  amount: number,
  currency: string,
  billerName: string,
  reference: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Bill Payment Successful',
    body: `Your payment of ${amount} ${currency} to ${billerName} was successful`,
    type: 'bill',
    data: {
      billerName,
      reference,
    },
    clickAction: '/dashboard/bills',
    emailTemplate: 'bill_payment_success',
    emailVariables: {
      amount: amount.toString(),
      currency,
      billerName,
      reference,
      date: new Date().toLocaleString(),
    },
  });
}

export async function notifySecurityAlert(
  userId: string,
  alertType: string,
  description: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Security Alert',
    body: description,
    type: 'security',
    data: {
      alertType,
    },
    clickAction: '/dashboard/settings/security',
  });
}

export async function notifyDeposit(
  userId: string,
  amount: number,
  currency: string,
  source: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Deposit Received',
    body: `You received ${amount} ${currency} from ${source}`,
    type: 'transaction',
    data: {
      type: 'deposit',
      source,
    },
    clickAction: '/dashboard/wallet',
    emailTemplate: 'deposit_received',
    emailVariables: {
      amount: amount.toString(),
      currency,
      paymentMethod: source,
      date: new Date().toLocaleString(),
    },
  });
}

export async function notifyWithdrawal(
  userId: string,
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'failed'
) {
  const statusMessages = {
    pending: 'Your withdrawal request is being processed',
    completed: `Your withdrawal of ${amount} ${currency} has been completed`,
    failed: `Your withdrawal request failed`,
  };

  return sendUnifiedNotification({
    userId,
    title: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    body: statusMessages[status],
    type: 'transaction',
    data: {
      type: 'withdrawal',
      status,
    },
    clickAction: '/dashboard/wallet',
    emailTemplate: 'withdrawal_request',
    emailVariables: {
      amount: amount.toString(),
      currency,
      date: new Date().toLocaleString(),
    },
  });
}

/**
 * Invoice notification convenience functions
 */

export async function notifyInvoiceGenerated(
  userId: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  dueDate: Date | string,
  businessName?: string,
  downloadLink?: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'New Invoice Generated',
    body: `Invoice #${invoiceNumber} for ${amount} ${currency} has been generated`,
    type: 'payment',
    data: {
      type: 'invoice',
      invoiceNumber,
      amount: amount.toString(),
      currency,
    },
    clickAction: '/dashboard/invoices',
    emailTemplate: 'invoice_generated',
    emailVariables: {
      invoice_number: invoiceNumber,
      invoiceNumber,
      amount: amount.toString(),
      currency,
      due_date: typeof dueDate === 'string' ? dueDate : dueDate.toLocaleDateString(),
      dueDate: typeof dueDate === 'string' ? dueDate : dueDate.toLocaleDateString(),
      business_name: businessName || 'Payvost',
      businessName: businessName || 'Payvost',
      download_link: downloadLink || '',
      downloadLink: downloadLink || '',
    },
  });
}

export async function notifyInvoiceReminder(
  userId: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  dueDate: Date | string,
  businessName?: string,
  downloadLink?: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Invoice Payment Reminder',
    body: `Reminder: Invoice #${invoiceNumber} for ${amount} ${currency} is due soon`,
    type: 'payment',
    data: {
      type: 'invoice_reminder',
      invoiceNumber,
      amount: amount.toString(),
      currency,
    },
    clickAction: '/dashboard/invoices',
    emailTemplate: 'invoice_reminder',
    emailVariables: {
      invoice_number: invoiceNumber,
      invoiceNumber,
      amount: amount.toString(),
      currency,
      due_date: typeof dueDate === 'string' ? dueDate : dueDate.toLocaleDateString(),
      dueDate: typeof dueDate === 'string' ? dueDate : dueDate.toLocaleDateString(),
      business_name: businessName || 'Payvost',
      businessName: businessName || 'Payvost',
      download_link: downloadLink || '',
      downloadLink: downloadLink || '',
    },
  });
}

export async function notifyInvoicePaid(
  userId: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  businessName?: string,
  downloadLink?: string
) {
  return sendUnifiedNotification({
    userId,
    title: 'Invoice Paid Successfully',
    body: `Invoice #${invoiceNumber} for ${amount} ${currency} has been paid`,
    type: 'payment',
    data: {
      type: 'invoice_paid',
      invoiceNumber,
      amount: amount.toString(),
      currency,
    },
    clickAction: '/dashboard/invoices',
    emailTemplate: 'invoice_paid',
    emailVariables: {
      invoice_number: invoiceNumber,
      invoiceNumber,
      amount: amount.toString(),
      currency,
      payment_date: new Date().toLocaleDateString(),
      paymentDate: new Date().toLocaleDateString(),
      business_name: businessName || 'Payvost',
      businessName: businessName || 'Payvost',
      download_link: downloadLink || '',
      downloadLink: downloadLink || '',
    },
  });
}

/**
 * Broadcast notification to all users
 */
export async function broadcastNotification(payload: {
  title: string;
  body: string;
  type: 'announcement' | 'maintenance' | 'feature';
  clickAction?: string;
  topic?: string;
}) {
  const { title, body, type, clickAction, topic } = payload;

  try {
    // Send to FCM topic via API
    await sendTopicNotification({
      topic: topic || 'all_users',
      title,
      body,
      data: {
        type,
      },
      clickAction: clickAction || '/dashboard',
    });

    // Create broadcast in-app notification for all users
    // Note: This would need to be done via a batch operation for all users
    // For now, we'll create it in a global notifications collection
    // In production, you'd want to iterate through all users and add to their subcollections
    await addDoc(collection(db, 'notifications'), {
      broadcast: true,
      title,
      message: body,
      type: 'info',
      icon: 'bell',
      read: false,
      createdAt: serverTimestamp(),
      link: clickAction || '/dashboard',
    });

    console.log('✅ Broadcast notification sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending broadcast notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper functions
 */

function mapTypeToIcon(type: string): string {
  const iconMap: Record<string, string> = {
    transaction: 'success',
    kyc: 'info',
    payment: 'success',
    bill: 'success',
    security: 'alert',
    announcement: 'info',
    general: 'info',
    wallet: 'success',
    support: 'info',
    dispute: 'alert',
  };

  return iconMap[type] || 'info';
}

function getIconForType(type: string): string {
  const iconMap: Record<string, string> = {
    transaction: 'gift',
    kyc: 'shield',
    payment: 'gift',
    bill: 'gift',
    security: 'alert',
    announcement: 'bell',
    general: 'bell',
    wallet: 'gift',
    support: 'bell',
    dispute: 'alert',
  };

  return iconMap[type] || 'bell';
}

/**
 * Security Event Notifications
 */

export async function notifyPasswordChanged(userId: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Password Changed',
    body: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
    type: 'security',
    data: {
      eventType: 'password_changed',
    },
    clickAction: '/dashboard/settings/security',
  });
}

export async function notifyEmailChanged(userId: string, newEmail: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Email Address Changed',
    body: `Your email address has been changed to ${newEmail}. If you did not make this change, please contact support immediately.`,
    type: 'security',
    data: {
      eventType: 'email_changed',
      newEmail,
    },
    clickAction: '/dashboard/settings',
  });
}

export async function notifySuspiciousLogin(userId: string, deviceInfo: string, location: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Suspicious Login Detected',
    body: `A login was detected from ${deviceInfo} in ${location}. If this wasn't you, please secure your account immediately.`,
    type: 'security',
    data: {
      eventType: 'suspicious_login',
      deviceInfo,
      location,
    },
    clickAction: '/dashboard/settings/security',
    emailTemplate: 'login_alert',
    emailVariables: {
      deviceInfo,
      location,
    },
  });
}

export async function notifyTwoFactorEnabled(userId: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Two-Factor Authentication Enabled',
    body: 'Two-factor authentication has been enabled on your account for added security.',
    type: 'security',
    data: {
      eventType: '2fa_enabled',
    },
    clickAction: '/dashboard/settings/security',
  });
}

export async function notifyTwoFactorDisabled(userId: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Two-Factor Authentication Disabled',
    body: 'Two-factor authentication has been disabled on your account. Your account security has been reduced.',
    type: 'security',
    data: {
      eventType: '2fa_disabled',
    },
    clickAction: '/dashboard/settings/security',
  });
}

export async function notifyPinChanged(userId: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Transaction PIN Changed',
    body: 'Your transaction PIN has been successfully changed.',
    type: 'security',
    data: {
      eventType: 'pin_changed',
    },
    clickAction: '/dashboard/settings/security',
  });
}

export async function notifyAccountLocked(userId: string, reason: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Account Temporarily Locked',
    body: `Your account has been temporarily locked for security reasons: ${reason}. Please contact support if you need assistance.`,
    type: 'security',
    data: {
      eventType: 'account_locked',
      reason,
    },
    clickAction: '/dashboard/support',
  });
}

/**
 * Wallet & Balance Notifications
 */

export async function notifyLowBalance(userId: string, balance: number, currency: string, threshold: number = 10) {
  return sendUnifiedNotification({
    userId,
    title: 'Low Balance Alert',
    body: `Your wallet balance is low: ${balance} ${currency}. Consider adding funds to avoid service interruptions.`,
    type: 'wallet',
    data: {
      balance: balance.toString(),
      currency,
      threshold: threshold.toString(),
      alertType: 'low_balance',
    },
    clickAction: '/dashboard/wallet',
    emailTemplate: 'low_balance_alert',
    emailVariables: {
      balance: balance.toString(),
      currency,
      threshold: threshold.toString(),
    },
  });
}

export async function notifyLargeDeposit(userId: string, amount: number, currency: string, threshold: number = 1000) {
  return sendUnifiedNotification({
    userId,
    title: 'Large Deposit Received',
    body: `You received a large deposit of ${amount} ${currency}. Your funds are now available in your wallet.`,
    type: 'wallet',
    data: {
      amount: amount.toString(),
      currency,
      alertType: 'large_deposit',
    },
    clickAction: '/dashboard/wallet',
    emailTemplate: 'deposit_received',
    emailVariables: {
      amount: amount.toString(),
      currency,
      date: new Date().toLocaleString(),
    },
  });
}

export async function notifyBalanceThreshold(userId: string, balance: number, currency: string, threshold: number) {
  return sendUnifiedNotification({
    userId,
    title: 'Balance Threshold Reached',
    body: `Your wallet balance has reached ${balance} ${currency}, which is below your set threshold of ${threshold} ${currency}.`,
    type: 'wallet',
    data: {
      balance: balance.toString(),
      currency,
      threshold: threshold.toString(),
      alertType: 'threshold_reached',
    },
    clickAction: '/dashboard/wallet',
  });
}

/**
 * Dispute & Support Notifications
 */

export async function notifyDisputeRaised(userId: string, disputeId: string, reason: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Dispute Raised',
    body: `Your dispute has been raised successfully. Reason: ${reason}. We will review and respond within 7 business days.`,
    type: 'dispute',
    data: {
      disputeId,
      reason,
      status: 'open',
    },
    clickAction: '/dashboard/disputes',
  });
}

export async function notifyDisputeStatusChange(userId: string, disputeId: string, status: string, resolution?: string) {
  const statusMessages: Record<string, string> = {
    resolved: 'Your dispute has been resolved.',
    closed: 'Your dispute has been closed.',
    under_review: 'Your dispute is under review.',
    rejected: 'Your dispute has been rejected.',
  };

  return sendUnifiedNotification({
    userId,
    title: `Dispute ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    body: resolution 
      ? `${statusMessages[status] || 'Your dispute status has changed.'} ${resolution}`
      : statusMessages[status] || 'Your dispute status has changed.',
    type: 'dispute',
    data: {
      disputeId,
      status,
      resolution: resolution || null,
    },
    clickAction: '/dashboard/disputes',
  });
}

export async function notifySupportTicketCreated(userId: string, ticketId: string, subject: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Support Ticket Created',
    body: `Your support ticket "${subject}" has been created. Ticket ID: ${ticketId}. We'll respond as soon as possible.`,
    type: 'support',
    data: {
      ticketId,
      subject,
      status: 'open',
    },
    clickAction: '/dashboard/support',
  });
}

export async function notifySupportTicketResponse(userId: string, ticketId: string, subject: string, response: string) {
  return sendUnifiedNotification({
    userId,
    title: 'New Response to Your Support Ticket',
    body: `You have a new response to your support ticket "${subject}". ${response.substring(0, 100)}...`,
    type: 'support',
    data: {
      ticketId,
      subject,
    },
    clickAction: '/dashboard/support',
  });
}

export async function notifySupportTicketResolved(userId: string, ticketId: string, subject: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Support Ticket Resolved',
    body: `Your support ticket "${subject}" has been marked as resolved. If you need further assistance, please reopen the ticket.`,
    type: 'support',
    data: {
      ticketId,
      subject,
      status: 'resolved',
    },
    clickAction: '/dashboard/support',
  });
}

/**
 * Payment Method Notifications
 */

export async function notifyPaymentMethodAdded(userId: string, methodType: string, last4?: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Payment Method Added',
    body: `A new ${methodType}${last4 ? ` ending in ${last4}` : ''} has been added to your account.`,
    type: 'security',
    data: {
      eventType: 'payment_method_added',
      methodType,
      last4: last4 || null,
    },
    clickAction: '/dashboard/settings/payment-methods',
  });
}

export async function notifyPaymentMethodRemoved(userId: string, methodType: string, last4?: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Payment Method Removed',
    body: `Your ${methodType}${last4 ? ` ending in ${last4}` : ''} has been removed from your account.`,
    type: 'security',
    data: {
      eventType: 'payment_method_removed',
      methodType,
      last4: last4 || null,
    },
    clickAction: '/dashboard/settings/payment-methods',
  });
}

/**
 * Transaction Limit Notifications
 */

export async function notifyTransactionLimitReached(userId: string, limitType: 'daily' | 'monthly', amount: number, currency: string) {
  return sendUnifiedNotification({
    userId,
    title: `${limitType.charAt(0).toUpperCase() + limitType.slice(1)} Transaction Limit Reached`,
    body: `You have reached your ${limitType} transaction limit of ${amount} ${currency}. Please upgrade your account tier for higher limits.`,
    type: 'transaction',
    data: {
      limitType,
      amount: amount.toString(),
      currency,
    },
    clickAction: '/dashboard/settings',
  });
}

export async function notifyTransactionLimitWarning(userId: string, limitType: 'daily' | 'monthly', remaining: number, currency: string, percentage: number) {
  return sendUnifiedNotification({
    userId,
    title: `${limitType.charAt(0).toUpperCase() + limitType.slice(1)} Limit Warning`,
    body: `You have used ${100 - percentage}% of your ${limitType} limit. ${remaining} ${currency} remaining.`,
    type: 'transaction',
    data: {
      limitType,
      remaining: remaining.toString(),
      currency,
      percentage: percentage.toString(),
    },
    clickAction: '/dashboard/transactions',
  });
}

/**
 * Large Transaction Alerts
 */

export async function notifyLargeTransaction(userId: string, amount: number, currency: string, recipient: string, transactionId: string) {
  return sendUnifiedNotification({
    userId,
    title: 'Large Transaction Alert',
    body: `A large transaction of ${amount} ${currency} to ${recipient} has been processed.`,
    type: 'transaction',
    data: {
      transactionId,
      amount: amount.toString(),
      currency,
      alertType: 'large_transaction',
    },
    clickAction: '/dashboard/transactions',
    emailTemplate: 'transaction_success',
    emailVariables: {
      amount: amount.toString(),
      currency,
      recipient,
      transactionId,
    },
  });
}

/**
 * Check if user has notifications enabled
 */
export async function getUserNotificationPreferences(userId: string): Promise<{
  push: boolean;
  email: boolean;
  sms: boolean;
  transactionAlerts: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  lowBalanceAlerts: boolean;
  largeTransactionAlerts: boolean;
} | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData) return null;

    return {
      push: userData.preferences?.push !== false,
      email: userData.preferences?.email !== false,
      sms: userData.preferences?.sms !== false,
      transactionAlerts: userData.preferences?.transactionAlerts !== false,
      marketingEmails: userData.preferences?.marketingEmails === true,
      securityAlerts: userData.preferences?.securityAlerts !== false,
      lowBalanceAlerts: userData.preferences?.lowBalanceAlerts !== false,
      largeTransactionAlerts: userData.preferences?.largeTransactionAlerts !== false,
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    transactionAlerts?: boolean;
    marketingEmails?: boolean;
    securityAlerts?: boolean;
    lowBalanceAlerts?: boolean;
    largeTransactionAlerts?: boolean;
  }
): Promise<boolean> {
  try {
    const { updateDoc } = await import('firebase/firestore');
    
    const updateData: any = {};
    if (preferences.push !== undefined) updateData['preferences.push'] = preferences.push;
    if (preferences.email !== undefined) updateData['preferences.email'] = preferences.email;
    if (preferences.sms !== undefined) updateData['preferences.sms'] = preferences.sms;
    if (preferences.transactionAlerts !== undefined) updateData['preferences.transactionAlerts'] = preferences.transactionAlerts;
    if (preferences.marketingEmails !== undefined) updateData['preferences.marketingEmails'] = preferences.marketingEmails;
    if (preferences.securityAlerts !== undefined) updateData['preferences.securityAlerts'] = preferences.securityAlerts;
    if (preferences.lowBalanceAlerts !== undefined) updateData['preferences.lowBalanceAlerts'] = preferences.lowBalanceAlerts;
    if (preferences.largeTransactionAlerts !== undefined) updateData['preferences.largeTransactionAlerts'] = preferences.largeTransactionAlerts;
    
    await updateDoc(doc(db, 'users', userId), updateData);

    console.log('✅ Notification preferences updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    return false;
  }
}
