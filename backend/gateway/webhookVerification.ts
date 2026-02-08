import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Stripe from 'stripe';
import Redis from 'ioredis';
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
  signatureEncoding?: 'hex' | 'base64' | 'utf8';
}

// ---- Helpers (safe comparisons + replay protection) ----

function safeTimingEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function safeTimingEqualHex(aHex: string, bHex: string): boolean {
  if (!aHex || !bHex) return false;
  if (aHex.length !== bHex.length) return false;
  try {
    const a = Buffer.from(aHex, 'hex');
    const b = Buffer.from(bHex, 'hex');
    return safeTimingEqual(a, b);
  } catch {
    return false;
  }
}

function safeTimingEqualBase64(aB64: string, bB64: string): boolean {
  if (!aB64 || !bB64) return false;
  try {
    const a = Buffer.from(aB64, 'base64');
    const b = Buffer.from(bB64, 'base64');
    return safeTimingEqual(a, b);
  } catch {
    return false;
  }
}

function safeTimingEqualUtf8(aStr: string, bStr: string): boolean {
  if (aStr.length !== bStr.length) return false;
  return safeTimingEqual(Buffer.from(aStr, 'utf8'), Buffer.from(bStr, 'utf8'));
}

let webhookReplayRedis: Redis | null = null;
const replayMemory = new Map<string, number>(); // key -> expiresAtMs

function getWebhookReplayRedis(): Redis | null {
  if (webhookReplayRedis) return webhookReplayRedis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const client = new Redis(url, { enableReadyCheck: true, lazyConnect: true, maxRetriesPerRequest: 3 });
  webhookReplayRedis = client;
  client.connect().catch(() => {});
  return client;
}

async function markSeenOnce(key: string, ttlSeconds: number): Promise<boolean> {
  if (!key) return true;

  const redis = getWebhookReplayRedis();
  if (redis) {
    try {
      const res = await (redis as any).set(key, '1', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch (err) {
      logger.warn({ err }, 'Webhook replay Redis check failed; falling back to in-memory');
      // fall through
    }
  }

  const now = Date.now();
  // Opportunistic cleanup to keep memory bounded.
  if (replayMemory.size > 5000) {
    for (const [k, exp] of replayMemory) {
      if (exp <= now) replayMemory.delete(k);
    }
  }

  const exp = replayMemory.get(key);
  if (exp && exp > now) return false;
  replayMemory.set(key, now + ttlSeconds * 1000);
  return true;
}

/**
 * Verify webhook signature for Reloadly
 */
export async function verifyReloadlyWebhook(
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

    // Constant-time comparison (hex).
    if (!safeTimingEqualHex(signature, expectedSignature)) {
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

    const first = await markSeenOnce(`replay:reloadly:${timestamp}:${signature}`, 24 * 60 * 60);
    if (!first) {
      logger.warn('Reloadly webhook replay detected');
      return res.status(200).json({ ok: true, duplicate: true });
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
let stripeWebhookClient: Stripe | null = null;
function getStripeWebhookClient(): Stripe {
  if (stripeWebhookClient) return stripeWebhookClient;
  // API key is not used for signature verification, but Stripe's SDK requires a non-empty string.
  const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
  stripeWebhookClient = new Stripe(key, { apiVersion: '2023-10-16' as any });
  return stripeWebhookClient;
}

export async function verifyStripeWebhook(
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

    const raw = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
    const rawBody = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), 'utf8');

    let event: Stripe.Event;
    try {
      // Use Stripe's official verifier (includes timestamp tolerance).
      event = getStripeWebhookClient().webhooks.constructEvent(rawBody, signature, secret, 300);
    } catch (err: any) {
      logger.warn({ ip: req.ip, err: err?.message || err }, 'Invalid Stripe webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Attach verified event for downstream handlers (if they want it).
    (req as any).stripeEvent = event;

    const first = await markSeenOnce(`replay:stripe:${event.id}`, 24 * 60 * 60);
    if (!first) {
      logger.warn({ eventId: event.id }, 'Stripe webhook replay detected');
      return res.status(200).json({ ok: true, duplicate: true });
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
      signatureEncoding = 'utf8',
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

      const ok =
        signatureEncoding === 'hex'
          ? safeTimingEqualHex(cleanSignature, expectedSignature)
          : signatureEncoding === 'base64'
            ? safeTimingEqualBase64(cleanSignature, expectedSignature)
            : safeTimingEqualUtf8(cleanSignature, expectedSignature);

      if (!ok) {
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
 * Verify webhook signature for Mailgun
 * Mailgun uses HMAC SHA256 with timestamp and token
 * Format: signature = HMAC-SHA256(timestamp + token, signing_key)
 */
export async function verifyMailgunWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  
  if (!signingKey) {
    logger.warn('MAILGUN_WEBHOOK_SIGNING_KEY not configured. Webhook verification disabled.');
    return next();
  }

  try {
    // Mailgun sends signature, timestamp, and token
    // Can be in body (form-encoded) or headers
    const signature = req.body?.signature || 
                     (req.body as any)?.['signature']?.signature ||
                     req.headers['x-mailgun-signature'] as string;
    const timestamp = req.body?.timestamp || 
                     (req.body as any)?.['signature']?.timestamp ||
                     req.headers['x-mailgun-timestamp'] as string;
    const token = req.body?.token || 
                 (req.body as any)?.['signature']?.token ||
                 req.headers['x-mailgun-token'] as string;

    if (!signature || !timestamp || !token) {
      logger.warn('Missing Mailgun webhook signature, timestamp, or token');
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Mailgun signature verification: HMAC-SHA256(timestamp + token, signing_key)
    const signedString = timestamp + token;
    const expectedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(signedString)
      .digest('hex');

    // Constant-time comparison (Mailgun signature is hex).
    if (!safeTimingEqualHex(String(signature), expectedSignature)) {
      logger.warn({ ip: req.ip }, 'Invalid Mailgun webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Verify timestamp to prevent replay attacks (within 15 minutes)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 900) { // 15 minutes
      logger.warn({ timeDiff }, 'Mailgun webhook timestamp too old');
      return res.status(401).json({ error: 'Webhook timestamp expired' });
    }

    const first = await markSeenOnce(`replay:mailgun:${timestamp}:${token}`, 24 * 60 * 60);
    if (!first) {
      logger.warn('Mailgun webhook replay detected');
      return res.status(200).json({ ok: true, duplicate: true });
    }

    logger.info('Mailgun webhook signature verified');
    next();
  } catch (error) {
    logger.error({ err: error }, 'Error verifying Mailgun webhook');
    return res.status(500).json({ error: 'Webhook verification failed' });
  }
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
    (req as any).rawBody = Buffer.concat(chunks);
    next();
  });
}

