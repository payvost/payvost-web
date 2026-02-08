import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../common/prisma';
import { verifyFirebaseToken, requireKYC, AuthenticatedRequest } from '../../gateway/middleware';

const router = Router();

function firstFrontendOrigin(): string {
  // FRONTEND_URL is configured as comma-separated list for CORS; reuse the first entry for link generation.
  const raw = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const origin = raw.split(',').map(s => s.trim()).filter(Boolean)[0] || 'https://www.payvost.com';
  return origin.replace(/\/$/, '');
}

function randomToken(): string {
  // URL-safe token; do not log.
  return crypto.randomBytes(32).toString('base64url');
}

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('base64');
}

function randomPublicId(): string {
  // Keep short and URL-safe; prefix supports routing and analytics grouping.
  return `pl_${crypto.randomBytes(8).toString('base64url')}`;
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),

  linkType: z.enum(['ONE_TIME', 'REUSABLE']),
  amountType: z.enum(['FIXED', 'OPEN']),
  amount: z.number().positive().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  currency: z.string().trim().toUpperCase().min(3).max(10),

  expiresAt: z.string().datetime().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),

  workspaceId: z.string().trim().optional(),
});

function validateAmountRules(input: z.infer<typeof createSchema>) {
  if (input.amountType === 'FIXED') {
    if (!Number.isFinite(input.amount || NaN)) {
      throw new Error('amount is required when amountType=FIXED');
    }
  } else {
    // OPEN
    if (input.amount !== undefined) {
      throw new Error('amount must be omitted when amountType=OPEN');
    }
    if (input.minAmount !== undefined && input.maxAmount !== undefined && input.minAmount > input.maxAmount) {
      throw new Error('minAmount must be <= maxAmount');
    }
  }
}

/**
 * POST /api/payment-links
 * Create a payment link (merchant, authenticated).
 */
router.post('/', verifyFirebaseToken, requireKYC, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = createSchema.parse(req.body);
    validateAmountRules(parsed);

    const publicToken = randomToken();
    const publicTokenHash = tokenHash(publicToken);

    // Retry publicId generation on unique collision (extremely unlikely).
    let publicId = randomPublicId();
    let created: any = null;
    for (let i = 0; i < 5; i++) {
      try {
        created = await prisma.paymentLink.create({
          data: {
            publicId,
            publicTokenHash,
            createdByUserId: uid,
            workspaceId: parsed.workspaceId || null,
            title: parsed.title,
            description: parsed.description || null,
            linkType: parsed.linkType as any,
            amountType: parsed.amountType as any,
            amount: parsed.amountType === 'FIXED' ? (parsed.amount !== undefined ? parsed.amount.toString() : null) : null,
            minAmount: parsed.amountType === 'OPEN' ? (parsed.minAmount !== undefined ? parsed.minAmount.toString() : null) : null,
            maxAmount: parsed.amountType === 'OPEN' ? (parsed.maxAmount !== undefined ? parsed.maxAmount.toString() : null) : null,
            currency: parsed.currency,
            status: 'ACTIVE' as any,
            expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
            successUrl: parsed.successUrl || null,
            cancelUrl: parsed.cancelUrl || null,
            failureUrl: parsed.failureUrl || null,
            metadata: {
              source: 'merchant_api',
            },
          },
        });
        break;
      } catch (e: any) {
        // Unique constraint violation: generate new publicId and retry.
        publicId = randomPublicId();
        if (i === 4) throw e;
      }
    }

    const origin = firstFrontendOrigin();
    const url = `${origin}/pay/${created.publicId}?t=${encodeURIComponent(publicToken)}`;

    return res.status(201).json({
      paymentLink: created,
      publicToken,
      url,
    });
  } catch (error: any) {
    const message = error instanceof z.ZodError ? 'Invalid request' : (error?.message || 'Failed to create payment link');
    return res.status(400).json({ error: message, details: error instanceof z.ZodError ? error.flatten() : undefined });
  }
});

/**
 * GET /api/payment-links
 * List payment links for the authenticated merchant.
 */
router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(Math.max(parseInt(String((req.query as any).limit || '20'), 10) || 20, 1), 100);
    const offset = Math.max(parseInt(String((req.query as any).offset || '0'), 10) || 0, 0);
    const status = (req.query as any).status ? String((req.query as any).status).toUpperCase() : null;

    const where: any = { createdByUserId: uid };
    if (status) where.status = status;

    const [items, total, agg] = await Promise.all([
      prisma.paymentLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
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
          viewCount: true,
          checkoutCount: true,
          paidCount: true,
          totalPaidAmount: true,
          fulfilledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.paymentLink.count({ where }),
      prisma.paymentLink.aggregate({
        where,
        _sum: { totalPaidAmount: true, paidCount: true, checkoutCount: true, viewCount: true },
        _count: { id: true },
      }),
    ]);

    return res.json({
      items,
      total,
      stats: {
        totalLinks: agg._count.id,
        totalPaidAmount: agg._sum.totalPaidAmount || 0,
        totalPaidCount: agg._sum.paidCount || 0,
        totalCheckoutCount: agg._sum.checkoutCount || 0,
        totalViewCount: agg._sum.viewCount || 0,
      },
      pagination: { limit, offset },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to list payment links' });
  }
});

/**
 * GET /api/payment-links/:id
 * Fetch one payment link (merchant view).
 */
router.get('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const id = String(req.params.id || '').trim();
    const link = await prisma.paymentLink.findFirst({
      where: { id, createdByUserId: uid },
      include: {
        checkouts: { orderBy: { createdAt: 'desc' }, take: 20 },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!link) return res.status(404).json({ error: 'Payment link not found' });
    return res.json({ paymentLink: link });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch payment link' });
  }
});

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED', 'EXPIRED']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  successUrl: z.string().url().nullable().optional(),
  cancelUrl: z.string().url().nullable().optional(),
  failureUrl: z.string().url().nullable().optional(),
});

/**
 * PATCH /api/payment-links/:id
 * Update a link (merchant).
 */
router.patch('/:id', verifyFirebaseToken, requireKYC, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const id = String(req.params.id || '').trim();
    const updates = patchSchema.parse(req.body);

    const existing = await prisma.paymentLink.findFirst({ where: { id, createdByUserId: uid } });
    if (!existing) return res.status(404).json({ error: 'Payment link not found' });

    const updated = await prisma.paymentLink.update({
      where: { id },
      data: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.status !== undefined ? { status: updates.status as any } : {}),
        ...(updates.expiresAt !== undefined ? { expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : null } : {}),
        ...(updates.successUrl !== undefined ? { successUrl: updates.successUrl } : {}),
        ...(updates.cancelUrl !== undefined ? { cancelUrl: updates.cancelUrl } : {}),
        ...(updates.failureUrl !== undefined ? { failureUrl: updates.failureUrl } : {}),
      },
    });

    return res.json({ paymentLink: updated });
  } catch (error: any) {
    const message = error instanceof z.ZodError ? 'Invalid request' : (error?.message || 'Failed to update payment link');
    return res.status(400).json({ error: message, details: error instanceof z.ZodError ? error.flatten() : undefined });
  }
});

/**
 * POST /api/payment-links/:id/rotate-token
 * Rotate the public token (merchant).
 */
router.post('/:id/rotate-token', verifyFirebaseToken, requireKYC, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const id = String(req.params.id || '').trim();
    const existing = await prisma.paymentLink.findFirst({ where: { id, createdByUserId: uid } });
    if (!existing) return res.status(404).json({ error: 'Payment link not found' });

    const publicToken = randomToken();
    const publicTokenHash = tokenHash(publicToken);

    const updated = await prisma.paymentLink.update({
      where: { id },
      data: { publicTokenHash },
    });

    const origin = firstFrontendOrigin();
    const url = `${origin}/pay/${updated.publicId}?t=${encodeURIComponent(publicToken)}`;

    return res.json({ paymentLink: updated, publicToken, url });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to rotate token' });
  }
});

export default router;
