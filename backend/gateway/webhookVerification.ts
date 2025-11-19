import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../common/logger';
import { ValidationError } from './index';

/**
 * Webhook signature verification middleware
 * Supports multiple providers with different signature algorithms
 */

export interface WebhookVerificationOptions {
  secret: string;
  algorithm?: 'sha256' | 'sha1' | 'hmac-sha256';
  headerName?: string;
  signaturePrefix?: string;
}

/**
 * Verify webhook signature for Reloadly
 */
export function verifyReloadlyWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = process.env.RELOADLY_WEBHOOK_SECRET;
  
  if (!secret) {
    logger.warn('RELOADLY_WEBHOOK_SECRET not configured. Webhook verification disabled.');
    return next();
  }

  try {
    const signature = req.headers['x-reloadly-signature'] as string;
    const timestamp = req.headers['x-reloadly-timestamp'] as string;

    if (!signature || !timestamp) {
      logger.warn('Missing Reloadly webhook signature or timestamp');
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Reloadly uses HMAC SHA256
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + payload)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      logger.warn({ ip: req.ip }, 'Invalid Reloadly webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Verify timestamp to prevent replay attacks (within 5 minutes)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 300) { // 5 minutes
      logger.warn({ timeDiff }, 'Reloadly webhook timestamp too old');
      return res.status(401).json({ error: 'Webhook timestamp expired' });
    }

    logger.info('Reloadly webhook signature verified');
    next();
  } catch (error) {
    logger.error({ err: error }, 'Error verifying Reloadly webhook');
    return res.status(500).json({ error: 'Webhook verification failed' });
  }
}

/**
 * Verify webhook signature for Stripe
 */
export function verifyStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!secret) {
    logger.warn('STRIPE_WEBHOOK_SECRET not configured. Webhook verification disabled.');
    return next();
  }

  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      logger.warn('Missing Stripe webhook signature');
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Stripe uses a specific signature format: timestamp,signature
    // We need the raw body for Stripe verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    
    // For production, you should use stripe.webhooks.constructEvent()
    // This is a simplified version
    const elements = signature.split(',');
    const timestamp = elements.find((e: string) => e.startsWith('t='))?.substring(2);
    const signatures = elements.filter((e: string) => e.startsWith('v1='));

    if (!timestamp || signatures.length === 0) {
      return res.status(401).json({ error: 'Invalid signature format' });
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const isValid = signatures.some((sig: string) => {
      const sigValue = sig.substring(3);
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sigValue),
          Buffer.from(expectedSignature)
        );
      } catch {
        return false;
      }
    });

    if (!isValid) {
      logger.warn({ ip: req.ip }, 'Invalid Stripe webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Verify timestamp
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 300) {
      logger.warn({ timeDiff }, 'Stripe webhook timestamp too old');
      return res.status(401).json({ error: 'Webhook timestamp expired' });
    }

    logger.info('Stripe webhook signature verified');
    next();
  } catch (error) {
    logger.error({ err: error }, 'Error verifying Stripe webhook');
    return res.status(500).json({ error: 'Webhook verification failed' });
  }
}

/**
 * Generic webhook signature verification
 */
export function verifyWebhookSignature(options: WebhookVerificationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      secret,
      algorithm = 'sha256',
      headerName = 'x-webhook-signature',
      signaturePrefix = '',
    } = options;

    if (!secret) {
      logger.warn('Webhook secret not configured. Verification disabled.');
      return next();
    }

    try {
      const signature = req.headers[headerName.toLowerCase()] as string;

      if (!signature) {
        logger.warn('Missing webhook signature');
        return res.status(401).json({ error: 'Missing webhook signature' });
      }

      const payload = JSON.stringify(req.body);
      let expectedSignature: string;

      if (algorithm === 'hmac-sha256' || algorithm === 'sha256') {
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');
      } else if (algorithm === 'sha1') {
        expectedSignature = crypto
          .createHmac('sha1', secret)
          .update(payload)
          .digest('hex');
      } else {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }

      // Remove prefix if present
      const cleanSignature = signaturePrefix
        ? signature.replace(signaturePrefix, '')
        : signature;

      // Constant-time comparison
      if (!crypto.timingSafeEqual(
        Buffer.from(cleanSignature),
        Buffer.from(expectedSignature)
      )) {
        logger.warn({ ip: req.ip }, 'Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      logger.info('Webhook signature verified');
      next();
    } catch (error) {
      logger.error({ err: error }, 'Error verifying webhook');
      return res.status(500).json({ error: 'Webhook verification failed' });
    }
  };
}

/**
 * Middleware to capture raw body for webhook verification
 * Must be used before body parsing middleware
 */
export function captureRawBody(req: Request, res: Response, next: NextFunction) {
  const chunks: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    (req as any).rawBody = Buffer.concat(chunks).toString('utf8');
    next();
  });
}

