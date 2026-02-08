import { Router, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../../common/prisma';
import { rapydService } from '../rapyd';

const router = Router();

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('base64');
}

function firstFrontendOrigin(): string {
  const raw = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const origin = raw.split(',').map(s => s.trim()).filter(Boolean)[0] || 'https://www.payvost.com';
  return origin.replace(/\/$/, '');
}

function notFound(res: Response) {
  // 404 to avoid leaking whether a publicId exists.
  return res.status(404).json({ error: 'Not found' });
}

function getToken(req: any): string | null {
  const q = (req.query?.t ? String(req.query.t) : '').trim();
  if (q) return q;
  const header = String(req.headers['x-public-token'] || '').trim();
  return header || null;
}

const viewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutSchema = z.object({
  country: z.string().trim().min(2).max(2).default('US'),
  payerEmail: z.string().email().optional(),
  payerName: z.string().max(200).optional(),
  amount: z.number().positive().optional(),
  idempotencyKey: z.string().trim().min(1).max(255),
});

/**
 * GET /public/payment-links/:publicId?t=...
 * Public link view model (tokenized).
 */
router.get('/:publicId', viewLimiter, async (req: any, res: Response) => {
  try {
    const publicId = String(req.params.publicId || '').trim();
    const token = getToken(req);
    if (!publicId || !token) return notFound(res);

    const link = await prisma.paymentLink.findFirst({
      where: { publicId, publicTokenHash: tokenHash(token) },
      select: {
        publicId: true,
        title: true,
        description: true,
        linkType: true,
        amountType: true,
        amount: true,
        minAmount: true,
        maxAmount: true,
        currency: true,
        status: true,
        expiresAt: true,
        fulfilledAt: true,
      },
    });
    if (!link) return notFound(res);

    // Soft-expire server-side for reads; status can be updated lazily.
    const isExpired = link.expiresAt ? link.expiresAt.getTime() <= Date.now() : false;

    return res.json({
      paymentLink: {
        ...link,
        expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
        fulfilledAt: link.fulfilledAt ? link.fulfilledAt.toISOString() : null,
        computedStatus: isExpired ? 'EXPIRED' : link.status,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to load payment link' });
  }
});

/**
 * POST /public/payment-links/:publicId/checkout?t=...
 * Create a provider checkout for a tokenized public link.
 */
router.post('/:publicId/checkout', checkoutLimiter, async (req: any, res: Response) => {
  try {
    const publicId = String(req.params.publicId || '').trim();
    const token = getToken(req);
    if (!publicId || !token) return notFound(res);

    const body = checkoutSchema.parse(req.body || {});

    const link = await prisma.paymentLink.findFirst({
      where: { publicId, publicTokenHash: tokenHash(token) },
    });
    if (!link) return notFound(res);

    const now = Date.now();
    if (link.status !== ('ACTIVE' as any)) {
      return res.status(409).json({ error: 'Payment link is not active' });
    }
    if (link.expiresAt && link.expiresAt.getTime() <= now) {
      return res.status(410).json({ error: 'Payment link has expired' });
    }
    if (link.linkType === ('ONE_TIME' as any) && link.fulfilledAt) {
      return res.status(409).json({ error: 'This payment link has already been paid' });
    }

    // Idempotency: if checkout already exists for this link+key, return it.
    const existing = await prisma.paymentLinkCheckout.findUnique({
      where: {
        paymentLinkId_idempotencyKey: {
          paymentLinkId: link.id,
          idempotencyKey: body.idempotencyKey,
        },
      },
    });
    if (existing?.checkoutUrl) {
      return res.json({ checkoutUrl: existing.checkoutUrl, checkoutId: existing.id });
    }

    // For ONE_TIME, allow only one active checkout attempt at a time (best-effort).
    if (link.linkType === ('ONE_TIME' as any)) {
      const active = await prisma.paymentLinkCheckout.findFirst({
        where: {
          paymentLinkId: link.id,
          status: { in: ['CREATING', 'CREATED', 'REDIRECTED'] as any },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (active?.checkoutUrl) {
        return res.json({ checkoutUrl: active.checkoutUrl, checkoutId: active.id, reused: true });
      }
    }

    // Resolve amount rules
    const currency = String(link.currency || 'USD').toUpperCase();
    let amount: number;
    if (link.amountType === ('FIXED' as any)) {
      amount = parseFloat(String(link.amount || '0'));
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(500).json({ error: 'Payment link misconfigured (amount)' });
      }
    } else {
      const requested = body.amount;
      if (!Number.isFinite(requested || NaN) || (requested as number) <= 0) {
        return res.status(400).json({ error: 'amount is required for open-amount links' });
      }
      const min = link.minAmount ? parseFloat(String(link.minAmount)) : null;
      const max = link.maxAmount ? parseFloat(String(link.maxAmount)) : null;
      if (min !== null && (requested as number) < min) return res.status(400).json({ error: 'amount below minimum' });
      if (max !== null && (requested as number) > max) return res.status(400).json({ error: 'amount above maximum' });
      amount = requested as number;
    }

    const origin = firstFrontendOrigin();
    const payUrlBase = `${origin}/pay/${encodeURIComponent(publicId)}?t=${encodeURIComponent(token)}`;
    const completeUrl = `${payUrlBase}&status=success`;
    const errorUrl = `${payUrlBase}&status=error`;
    const cancelUrl = `${payUrlBase}&status=cancelled`;

    const created = await prisma.paymentLinkCheckout.create({
      data: {
        paymentLinkId: link.id,
        idempotencyKey: body.idempotencyKey,
        provider: 'RAPYD' as any,
        payerEmail: body.payerEmail || null,
        payerName: body.payerName || null,
        country: body.country,
        amount: amount.toString(),
        currency,
        status: 'CREATING' as any,
      },
    });

    const checkout = await rapydService.createCheckout({
      amount,
      currency,
      country: body.country,
      description: link.description || link.title || `Payment link ${publicId}`,
      merchant_reference_id: link.id,
      metadata: {
        paymentLinkId: link.id,
        checkoutId: created.id,
        publicId,
      },
      complete_payment_url: completeUrl,
      error_payment_url: errorUrl,
      cancel_payment_url: cancelUrl,
      complete_checkout_url: completeUrl,
      error_checkout_url: errorUrl,
      cancel_checkout_url: cancelUrl,
    });

    const updated = await prisma.$transaction(async (tx: any) => {
      const chk = await tx.paymentLinkCheckout.update({
        where: { id: created.id },
        data: {
          providerCheckoutId: checkout.id,
          checkoutUrl: checkout.checkout_url,
          status: 'CREATED',
        },
      });

      await tx.paymentLink.update({
        where: { id: link.id },
        data: { checkoutCount: { increment: 1 } },
      });

      return chk;
    });

    return res.json({ checkoutUrl: updated.checkoutUrl, checkoutId: updated.id });
  } catch (error: any) {
    const message = error instanceof z.ZodError ? 'Invalid request' : (error?.message || 'Failed to create checkout');
    return res.status(400).json({ error: message, details: error instanceof z.ZodError ? error.flatten() : undefined });
  }
});

export default router;
