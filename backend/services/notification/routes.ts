import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import * as OneSignal from '@onesignal/node-onesignal';

const router = Router();

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
router.post('/send', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, title, message, type, data } = req.body;

    if (!userId || !title || !message) {
      throw new ValidationError('userId, title, and message are required');
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
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
});

/**
 * POST /api/notification/send-email
 * Send an email notification
 */
router.post('/send-email', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, templateId, subject, variables } = req.body;

    if (!email || !templateId) {
      throw new ValidationError('email and templateId are required');
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
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

/**
 * POST /api/notification/send-batch
 * Send notifications to multiple users
 */
router.post('/send-batch', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userIds, title, message, type, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !message) {
      throw new ValidationError('userIds (array), title, and message are required');
    }

    const results = await Promise.allSettled(
      userIds.map(userId =>
        sendPushNotification({
          userId,
          title,
          message,
          type,
          data,
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({
      total: userIds.length,
      successful,
      failed,
    });
  } catch (error: any) {
    console.error('Error sending batch notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to send batch notifications' });
  }
});

/**
 * POST /api/notification/preferences
 * Update notification preferences for a user
 */
router.post('/preferences', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { email, push, sms, transactionAlerts, marketingEmails } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
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
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: error.message || 'Failed to update preferences' });
  }
});

/**
 * Helper function to send push notification
 */
async function sendPushNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  data?: any;
}): Promise<any> {
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
  } catch (error: any) {
    console.error('OneSignal error:', error);
    throw new Error('Failed to send push notification');
  }
}

/**
 * Helper function to send email notification
 */
async function sendEmailNotification(params: {
  email: string;
  templateId: string;
  subject?: string;
  variables?: any;
}): Promise<any> {
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
      const emailData: any = {};
      if (subject) emailData.subject = subject;
      if (variables) emailData.variables = variables;
      notification.data = emailData;
    }

    const response = await oneSignalClient.createNotification(notification);
    return { id: response.id, success: true };
  } catch (error: any) {
    console.error('OneSignal email error:', error);
    throw new Error('Failed to send email notification');
  }
}

/**
 * Transaction notification templates
 */
export const NotificationTemplates = {
  TRANSFER_SENT: {
    title: 'Transfer Sent',
    message: (amount: string, currency: string, recipient: string) =>
      `You sent ${amount} ${currency} to ${recipient}`,
  },
  TRANSFER_RECEIVED: {
    title: 'Transfer Received',
    message: (amount: string, currency: string, sender: string) =>
      `You received ${amount} ${currency} from ${sender}`,
  },
  PAYMENT_SUCCESSFUL: {
    title: 'Payment Successful',
    message: (amount: string, currency: string) =>
      `Your payment of ${amount} ${currency} was successful`,
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: (amount: string, currency: string, reason: string) =>
      `Your payment of ${amount} ${currency} failed: ${reason}`,
  },
  KYC_APPROVED: {
    title: 'KYC Approved',
    message: 'Your identity verification has been approved',
  },
  KYC_REJECTED: {
    title: 'KYC Rejected',
    message: (reason: string) =>
      `Your identity verification was rejected: ${reason}`,
  },
  ACCOUNT_LOCKED: {
    title: 'Account Locked',
    message: (reason: string) =>
      `Your account has been locked: ${reason}`,
  },
  SUSPICIOUS_ACTIVITY: {
    title: 'Suspicious Activity Detected',
    message: 'We detected suspicious activity on your account. Please review your recent transactions.',
  },
};

export default router;
