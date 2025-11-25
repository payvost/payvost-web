import { Request, Response } from 'express';
import { logger } from '../../../common/logger';
import { prisma } from './prisma';

/**
 * Mailgun webhook event types
 */
type MailgunEventType =
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'dropped'
  | 'failed'
  | 'complained'
  | 'unsubscribed'
  | 'stored';

interface MailgunWebhookPayload {
  signature?: {
    timestamp: string;
    token: string;
    signature: string;
  };
  'event-data': {
    event: MailgunEventType;
    timestamp: number;
    id: string;
    message?: {
      headers: {
        'message-id': string;
        to: string;
        from: string;
        subject?: string;
      };
      'user-variables'?: Record<string, any>;
    };
    recipient: string;
    'recipient-domain': string;
    'log-level'?: string;
    reason?: string;
    'delivery-status'?: {
      message: string;
      code: number;
      description: string;
    };
    'user-variables'?: Record<string, any>;
    flags?: {
      'is-routed'?: boolean;
      'is-authenticated'?: boolean;
      'is-system-test'?: boolean;
      'is-test-mode'?: boolean;
    };
    'geolocation'?: {
      country: string;
      region: string;
      city: string;
    };
    ip?: string;
    'client-info'?: {
      'client-type': string;
      'client-os': string;
      'device-type': string;
      'client-name': string;
      'user-agent': string;
    };
    'storage'?: {
      url: string;
      key: string;
    };
    url?: string; // For clicked events
    'mailing-list'?: {
      address: string;
      name?: string;
    };
  };
}

/**
 * Handle delivered event
 */
async function handleDelivered(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;

  logger.info(
    { messageId, recipient, eventId: eventData.id },
    'Mailgun: Email delivered'
  );

  // Log delivery event for analytics
  try {
    // You can store this in a database table for email tracking
    // Example: await prisma.emailEvent.create({ ... });
  } catch (error) {
    logger.error({ err: error }, 'Error handling delivered event');
  }
}

/**
 * Handle opened event
 */
async function handleOpened(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;

  logger.info(
    { messageId, recipient, eventId: eventData.id },
    'Mailgun: Email opened'
  );

  // Track email opens for analytics
  try {
    // Update email tracking
  } catch (error) {
    logger.error({ err: error }, 'Error handling opened event');
  }
}

/**
 * Handle clicked event
 */
async function handleClicked(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;
  const url = eventData.url;

  logger.info(
    { messageId, recipient, url, eventId: eventData.id },
    'Mailgun: Email link clicked'
  );

  // Track email clicks for analytics
  try {
    // Update email tracking with click data
  } catch (error) {
    logger.error({ err: error }, 'Error handling clicked event');
  }
}

/**
 * Handle bounced event
 */
async function handleBounced(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;
  const reason = eventData.reason || eventData['delivery-status']?.message;

  logger.warn(
    { messageId, recipient, reason, eventId: eventData.id },
    'Mailgun: Email bounced'
  );

  // Handle bounce - mark email as invalid, update user record, etc.
  try {
    // Example: Mark email as bounced in user record
    // await prisma.user.updateMany({
    //   where: { email: recipient },
    //   data: { emailBounced: true, emailBounceReason: reason },
    // });
  } catch (error) {
    logger.error({ err: error }, 'Error handling bounced event');
  }
}

/**
 * Handle failed event
 */
async function handleFailed(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;
  const reason = eventData.reason || eventData['delivery-status']?.message;

  logger.error(
    { messageId, recipient, reason, eventId: eventData.id },
    'Mailgun: Email failed'
  );

  // Handle failure - log for investigation
  try {
    // Log failure for investigation
  } catch (error) {
    logger.error({ err: error }, 'Error handling failed event');
  }
}

/**
 * Handle complained event (spam complaint)
 */
async function handleComplained(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;

  logger.warn(
    { messageId, recipient, eventId: eventData.id },
    'Mailgun: Spam complaint received'
  );

  // Handle spam complaint - unsubscribe user, flag account, etc.
  try {
    // Example: Unsubscribe user from emails
    // await prisma.user.updateMany({
    //   where: { email: recipient },
    //   data: { emailUnsubscribed: true, emailUnsubscribedAt: new Date() },
    // });
  } catch (error) {
    logger.error({ err: error }, 'Error handling complained event');
  }
}

/**
 * Handle unsubscribed event
 */
async function handleUnsubscribed(payload: MailgunWebhookPayload) {
  const eventData = payload['event-data'];
  const messageId = eventData.message?.headers['message-id'];
  const recipient = eventData.recipient;

  logger.info(
    { messageId, recipient, eventId: eventData.id },
    'Mailgun: User unsubscribed'
  );

  // Handle unsubscribe
  try {
    // Update user unsubscribe status
    // await prisma.user.updateMany({
    //   where: { email: recipient },
    //   data: { emailUnsubscribed: true, emailUnsubscribedAt: new Date() },
    // });
  } catch (error) {
    logger.error({ err: error }, 'Error handling unsubscribed event');
  }
}

/**
 * Main Mailgun webhook handler
 */
export async function handleMailgunWebhook(req: Request, res: Response) {
  try {
    // Mailgun can send webhooks as form-encoded or JSON
    // Handle both formats
    let payload: MailgunWebhookPayload;
    
    if (typeof req.body === 'string') {
      // Form-encoded data
      payload = req.body as any;
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body as MailgunWebhookPayload;
    } else {
      logger.warn('Invalid Mailgun webhook payload format');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Check for event-data (JSON format) or event (form-encoded format)
    if (!payload['event-data'] && !(payload as any).event) {
      logger.warn('Missing event data in Mailgun webhook payload');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Normalize to event-data format
    let eventData;
    let eventType: MailgunEventType;

    if (payload['event-data']) {
      // JSON format
      eventData = payload['event-data'];
      eventType = eventData.event;
    } else {
      // Form-encoded format - convert to event-data structure
      const formPayload = payload as any;
      eventType = formPayload.event as MailgunEventType;
      eventData = {
        event: eventType,
        timestamp: parseInt(formPayload.timestamp || '0', 10),
        id: formPayload.id || formPayload['event-id'] || '',
        recipient: formPayload.recipient || '',
        'recipient-domain': formPayload['recipient-domain'] || '',
        message: formPayload.message ? {
          headers: {
            'message-id': formPayload.message['message-id'] || '',
            to: formPayload.message.to || '',
            from: formPayload.message.from || '',
            subject: formPayload.message.subject,
          },
        } : undefined,
      };
    }

    logger.info({ eventType, eventId: eventData.id }, 'Processing Mailgun webhook');

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'delivered':
        await handleDelivered({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'opened':
        await handleOpened({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'clicked':
        await handleClicked({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'bounced':
        await handleBounced({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'failed':
      case 'dropped':
        await handleFailed({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'complained':
        await handleComplained({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'unsubscribed':
        await handleUnsubscribed({ 'event-data': eventData } as MailgunWebhookPayload);
        break;
      case 'stored':
        // Email stored in Mailgun storage
        logger.debug({ eventId: eventData.id }, 'Mailgun: Email stored');
        break;
      default:
        logger.warn({ eventType }, 'Unhandled Mailgun event type');
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ received: true, event: eventType });
  } catch (error) {
    logger.error({ err: error }, 'Error processing Mailgun webhook');
    // Still return 200 to prevent Mailgun from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
}

