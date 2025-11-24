import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import {
  sendPushNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
} from './fcm';
import { sendSMS, initTwilio } from './twilio';
import { logger } from '../../common/logger';
import { sendEmail, isMailgunConfigured } from '../../common/mailgun';

const router = Router();

// Check if email service is configured
const isEmailConfigured = isMailgunConfigured();
if (!isEmailConfigured) {
  logger.warn('Mailgun API not configured. Email notifications will be disabled.');
}

// Initialize Twilio
initTwilio();

/**
 * POST /api/notification/send
 * Send an email notification (replaced push notification)
 */
router.post('/send', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, subject, template, variables } = req.body;

    if (!email || !subject || !template) {
      throw new ValidationError('email, subject, and template are required');
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
  } catch (error: any) {
    logger.error({ err: error }, 'Error sending notification');
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
});

/**
 * POST /api/notification/send-email
 * Send an email notification
 */
router.post('/send-email', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, subject, template, variables } = req.body;

    if (!email || !template) {
      throw new ValidationError('email and template are required');
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
  } catch (error: any) {
    logger.error({ err: error }, 'Error sending email');
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

/**
 * POST /api/notification/send-batch
 * Send notifications to multiple users
 */
router.post('/send-batch', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emails, subject, template, variables } = req.body;

    if (!emails || !Array.isArray(emails) || !template) {
      throw new ValidationError('emails (array) and template are required');
    }

    const results = await Promise.allSettled(
      emails.map(email =>
        sendEmailNotification({
          email,
          subject: subject || 'Notification from Payvost',
          template,
          variables,
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    res.status(200).json({
      total: emails.length,
      successful,
      failed,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error sending batch notifications');
    res.status(500).json({ error: error.message || 'Failed to send batch notifications' });
  }
});

/**
 * POST /api/notification/send-sms
 * Send an SMS notification (Twilio placeholder)
 */
router.post('/send-sms', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      throw new ValidationError('phoneNumber and message are required');
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
  } catch (error: any) {
    logger.error({ err: error }, 'Error sending SMS');
    res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
});

/**
 * POST /api/notification/send-push
 * Send a push notification to a single device
 */
router.post('/send-push', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token, title, body, data, imageUrl, clickAction } = req.body;

    if (!token || !title || !body) {
      throw new ValidationError('token, title, and body are required');
    }

    const result = await sendPushNotification({
      token,
      title,
      body,
      data,
      imageUrl,
      clickAction,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send push notification' });
  }
});

/**
 * POST /api/notification/send-push-batch
 * Send push notifications to multiple devices
 */
router.post('/send-push-batch', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tokens, title, body, data, imageUrl, clickAction } = req.body;

    if (!tokens || !Array.isArray(tokens) || !title || !body) {
      throw new ValidationError('tokens (array), title, and body are required');
    }

    const result = await sendMulticastNotification({
      tokens,
      title,
      body,
      data,
      imageUrl,
      clickAction,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error sending multicast notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send multicast notification' });
  }
});

/**
 * POST /api/notification/send-topic
 * Send push notification to a topic
 */
router.post('/send-topic', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, title, body, data, imageUrl, clickAction } = req.body;

    if (!topic || !title || !body) {
      throw new ValidationError('topic, title, and body are required');
    }

    const result = await sendTopicNotification({
      topic,
      title,
      body,
      data,
      imageUrl,
      clickAction,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error sending topic notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send topic notification' });
  }
});

/**
 * POST /api/notification/subscribe-topic
 * Subscribe tokens to a topic
 */
router.post('/subscribe-topic', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || !topic) {
      throw new ValidationError('tokens (array) and topic are required');
    }

    const result = await subscribeToTopic(tokens, topic);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error subscribing to topic:', error);
    res.status(500).json({ error: error.message || 'Failed to subscribe to topic' });
  }
});

/**
 * POST /api/notification/unsubscribe-topic
 * Unsubscribe tokens from a topic
 */
router.post('/unsubscribe-topic', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || !topic) {
      throw new ValidationError('tokens (array) and topic are required');
    }

    const result = await unsubscribeFromTopic(tokens, topic);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error unsubscribing from topic:', error);
    res.status(500).json({ error: error.message || 'Failed to unsubscribe from topic' });
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
      push: push !== undefined ? push : false, // Disabled since we removed OneSignal
      sms: sms !== undefined ? sms : false,
      transactionAlerts: transactionAlerts !== undefined ? transactionAlerts : true,
      marketingEmails: marketingEmails !== undefined ? marketingEmails : false,
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save to database
    logger.info({ userId, preferences }, 'Updated notification preferences');

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error updating preferences');
    res.status(500).json({ error: error.message || 'Failed to update preferences' });
  }
});

/**
 * Helper function to send email notification
 */
async function sendEmailNotification(params: {
  email: string;
  subject: string;
  template: string;
  variables?: any;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, subject, template, variables } = params;

  if (!isEmailConfigured) {
    logger.warn('Email service not configured, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const html = getEmailTemplate(template, variables || {});
    const text = html.replace(/<[^>]*>/g, '').trim(); // Generate text version from HTML

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
      from: `Payvost <${process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com'}>`,
      tags: ['notification', template],
      variables: variables || {},
    });

    if (result.success) {
      logger.info({ messageId: result.messageId, email }, 'Email sent successfully via Mailgun API');
      return { success: true, messageId: result.messageId };
    } else {
      logger.error({ error: result.error, email }, 'Email sending error');
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    logger.error({ err: error, email }, 'Email sending error');
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to send SMS notification via Twilio
 */
async function sendSMSNotification(params: {
  phoneNumber: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumber, message } = params;
  return sendSMS(phoneNumber, message);
}

/**
 * Get email template HTML
 */
function getEmailTemplate(template: string, variables: Record<string, any>): string {
  const templates: Record<string, (vars: Record<string, any>) => string> = {
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
