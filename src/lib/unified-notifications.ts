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

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'transaction' | 'kyc' | 'payment' | 'bill' | 'security' | 'announcement' | 'general';
  data?: Record<string, string>;
  clickAction?: string;
  emailTemplate?: EmailTemplate;
  emailVariables?: Record<string, any>;
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
  const { userId, title, body, type, data, clickAction, emailTemplate, emailVariables } = payload;

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
        const validTemplate = emailTemplate && ['transaction_success', 'transaction_failed', 'bill_payment_success', 'bill_payment_failed', 'gift_card_delivered', 'airtime_topup_success', 'kyc_verified', 'account_welcome', 'password_reset', 'login_alert', 'withdrawal_request', 'deposit_received'].includes(emailTemplate);
        
        if (validTemplate) {
          const emailResult = await notificationService.sendEmail({
            to: userData.email,
            subject: title,
            template: emailTemplate as any,
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

    // 3. Create In-App Notification
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message: body,
        type: mapTypeToIcon(type),
        icon: getIconForType(type),
        read: false,
        createdAt: serverTimestamp(),
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

    // Create broadcast in-app notification
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
  };

  return iconMap[type] || 'bell';
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
  }
): Promise<boolean> {
  try {
    const { updateDoc } = await import('firebase/firestore');
    
    await updateDoc(doc(db, 'users', userId), {
      'preferences.push': preferences.push,
      'preferences.email': preferences.email,
      'preferences.sms': preferences.sms,
      'preferences.transactionAlerts': preferences.transactionAlerts,
      'preferences.marketingEmails': preferences.marketingEmails,
    });

    console.log('✅ Notification preferences updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    return false;
  }
}
