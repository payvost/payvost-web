import { Router, Response } from 'express';
import { z } from 'zod';
import admin from 'firebase-admin';
import Decimal from 'decimal.js';

import { prisma } from '../../common/prisma';
import { logger } from '../../common/logger';
import { verifyFirebaseToken, requireKYC, AuthenticatedRequest } from '../../gateway/middleware';
import { ensurePrismaUser } from '../user/syncUser';
import { RapydError, type IssuedCard, type CreateIssuedCardRequest } from '../rapyd';
import { verifyRapydWebhookSignature } from '../rapyd/webhook';
import { getIssuerProvider } from './issuer';

function normalizeCardStatus(status?: string): 'ACTIVE' | 'FROZEN' | 'TERMINATED' {
  const normalized = (status || '').toLowerCase();
  if (['active', 'activated', 'open', 'enabled'].includes(normalized)) return 'ACTIVE';
  if (['blocked', 'frozen', 'suspended', 'disabled'].includes(normalized)) return 'FROZEN';
  if (['terminated', 'closed', 'canceled', 'cancelled'].includes(normalized)) return 'TERMINATED';
  return 'ACTIVE';
}

function extractLast4(card: IssuedCard, fallback?: string): string {
  return card.last4 || card.last_4 || card.pan_last_4 || fallback || '0000';
}

function extractExpiry(card: IssuedCard): { expMonth?: number; expYear?: number; expiry?: string } {
  const raw = (card.expiration_date || card.expiry_date || card.exp_date) as string | undefined;
  if (raw && typeof raw === 'string') {
    // Common formats: "12/25" or "12/2025"
    const parts = raw.split('/');
    if (parts.length === 2) {
      const m = Number(parts[0]);
      const y = Number(parts[1].length === 2 ? `20${parts[1]}` : parts[1]);
      if (Number.isFinite(m) && Number.isFinite(y)) {
        return { expMonth: m, expYear: y, expiry: `${String(m).padStart(2, '0')}/${String(y).slice(-2)}` };
      }
    }
    return { expiry: raw };
  }

  const m = card.expiration_month !== undefined ? Number(card.expiration_month) : undefined;
  const y = card.expiration_year !== undefined ? Number(card.expiration_year) : undefined;
  if (Number.isFinite(m) && Number.isFinite(y)) {
    return { expMonth: m as number, expYear: y as number, expiry: `${String(m).padStart(2, '0')}/${String(y).slice(-2)}` };
  }
  return {};
}

async function requireRecentAuth(req: AuthenticatedRequest, maxAgeSeconds: number) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false as const, error: 'Authentication required' };
  }
  const token = authHeader.substring(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const authTime = decoded.auth_time;
    const now = Math.floor(Date.now() / 1000);
    if (!authTime || now - authTime > maxAgeSeconds) {
      return { ok: false as const, error: 'Recent authentication required' };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Invalid token' };
  }
}

async function ensureWorkspaceForRequest(params: {
  uid: string;
  workspaceId?: string | null;
  workspaceType?: 'PERSONAL' | 'BUSINESS';
}) {
  const workspaceId = params.workspaceId || null;
  if (workspaceId) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return { ok: false as const, status: 404, error: 'Workspace not found' };

    const isOwner = workspace.ownerUserId === params.uid;
    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: params.uid } },
      });
      if (!member) return { ok: false as const, status: 403, error: 'Forbidden' };
    }

    return { ok: true as const, workspace };
  }

  // Default: ensure PERSONAL workspace for uid.
  const type = params.workspaceType || 'PERSONAL';
  const businessId = type === 'PERSONAL' ? '' : 'default';

  const workspace = await prisma.workspace.upsert({
    where: {
      type_ownerUserId_businessId: {
        type: type as any,
        ownerUserId: params.uid,
        businessId,
      },
    },
    create: {
      type: type as any,
      ownerUserId: params.uid,
      businessId,
      name: type === 'PERSONAL' ? 'Personal' : 'Business',
      defaultCurrency: process.env.RAPYD_ISSUING_CURRENCY || 'USD',
      defaultLocale: 'en-US',
    },
    update: {},
  });

  // Ensure the owner is present as a member for BUSINESS workspaces.
  if (workspace.type === ('BUSINESS' as any)) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: params.uid } },
      create: { workspaceId: workspace.id, userId: params.uid, role: 'OWNER' as any },
      update: {},
    });
  }

  return { ok: true as const, workspace };
}

function intervalStart(now: Date, interval: string) {
  const d = new Date(now);
  // Normalize to UTC boundaries for consistent enforcement.
  if (interval === 'DAILY') {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }
  if (interval === 'WEEKLY') {
    // ISO-ish week start: Monday 00:00 UTC.
    const day = d.getUTCDay(); // 0=Sun
    const offset = (day + 6) % 7; // Mon=0
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    start.setUTCDate(start.getUTCDate() - offset);
    return start;
  }
  if (interval === 'MONTHLY') return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
  if (interval === 'YEARLY') return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  return new Date(0); // ALL_TIME or unknown
}

function normalizeTxKind(type: string): 'AUTH' | 'CLEARING' | 'REFUND' | 'REVERSAL' {
  const t = (type || '').toLowerCase();
  if (t.includes('auth')) return 'AUTH';
  if (t.includes('refund') || t.includes('credit')) return 'REFUND';
  if (t.includes('reversal') || t.includes('reversed')) return 'REVERSAL';
  if (t.includes('clearing') || t.includes('settle') || t.includes('sale') || t.includes('charge')) return 'CLEARING';
  return 'AUTH';
}

function normalizeTxStatus(status?: string): 'PENDING' | 'COMPLETED' | 'DECLINED' | 'REVERSED' {
  const s = (status || '').toLowerCase();
  if (s.includes('declin') || s.includes('reject') || s.includes('fail')) return 'DECLINED';
  if (s.includes('revers')) return 'REVERSED';
  if (s.includes('complete') || s.includes('success') || s.includes('approved') || s.includes('settled')) return 'COMPLETED';
  return 'PENDING';
}

function parseRapydTimestamp(raw: any): Date {
  if (raw === null || raw === undefined) return new Date();
  if (typeof raw === 'number') {
    if (raw > 1e12) return new Date(raw); // ms
    if (raw > 1e9) return new Date(raw * 1000); // seconds
  }
  if (typeof raw === 'string') {
    const n = Number(raw);
    if (Number.isFinite(n)) return parseRapydTimestamp(n);
    const dt = new Date(raw);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return new Date();
}

async function requireWorkspaceSpendManager(params: { workspaceId: string; uid: string }) {
  const workspace = await prisma.workspace.findUnique({ where: { id: params.workspaceId } });
  if (!workspace) return { ok: false as const, status: 404, error: 'Workspace not found' };
  if (workspace.ownerUserId === params.uid) return { ok: true as const, role: 'OWNER' as const };
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: params.uid } },
  });
  if (!member) return { ok: false as const, status: 403, error: 'Forbidden' };
  const allowed = ['OWNER', 'ADMIN', 'SPEND_MANAGER'];
  if (!allowed.includes(String(member.role))) return { ok: false as const, status: 403, error: 'Insufficient permissions' };
  return { ok: true as const, role: String(member.role) as any };
}

const controlsSchema = z.object({
  spendLimitAmount: z.number().positive().optional(),
  spendLimitInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME']).optional(),
  allowedCountries: z.array(z.string().min(2)).optional(),
  blockedCountries: z.array(z.string().min(2)).optional(),
  allowedMcc: z.array(z.string().min(1)).optional(),
  blockedMcc: z.array(z.string().min(1)).optional(),
  merchantAllowlist: z.array(z.string().min(1)).optional(),
  merchantBlocklist: z.array(z.string().min(1)).optional(),
  onlineAllowed: z.boolean().optional(),
  atmAllowed: z.boolean().optional(),
  contactlessAllowed: z.boolean().optional(),
});

const createCardSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceType: z.enum(['PERSONAL', 'BUSINESS']).optional(),
  accountId: z.string().min(1),
  label: z.string().min(2).max(64),
  network: z.enum(['VISA', 'MASTERCARD']),
  type: z.enum(['VIRTUAL', 'PHYSICAL']).optional(),
  assignedToUserId: z.string().optional(),
  controls: controlsSchema.optional(),
});

export default function createCardsRouter() {
  const router = Router();
  const issuer = getIssuerProvider();

  // Rapyd webhook ingestion (card transactions + lifecycle). No Firebase auth; signature required.
  router.post('/webhooks/rapyd', async (req: any, res: Response) => {
    try {
      const accessKey = process.env.RAPYD_ACCESS_KEY || '';
      const secretKey = process.env.RAPYD_SECRET_KEY || '';
      if (!accessKey || !secretKey) return res.status(500).json({ error: 'Rapyd not configured' });

      const bodyText = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
      const host = String(req.headers.host || '');
      const pathOnly = String(req.originalUrl || req.url || '').split('?')[0];
      const fullHttps = host ? `https://${host}${pathOnly}` : '';
      const fullHttp = host ? `http://${host}${pathOnly}` : '';
      const configured = process.env.RAPYD_WEBHOOK_URL_PATH || process.env.RAPYD_WEBHOOK_PATH || '';

      const verified = verifyRapydWebhookSignature({
        urlPathCandidates: [configured, pathOnly, fullHttps, fullHttp].filter(Boolean),
        headers: {
          signature: req.headers['signature'] as string | undefined,
          salt: req.headers['salt'] as string | undefined,
          timestamp: req.headers['timestamp'] as string | undefined,
          access_key: req.headers['access_key'] as string | undefined,
        },
        secretKey,
        maxAgeSeconds: 5 * 60,
        body: bodyText,
      });

      if (!verified.ok) {
        logger.warn({ reason: verified.error }, '[cards] rapyd webhook signature invalid');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      if (String(req.headers['access_key'] || '').trim() !== accessKey) {
        logger.warn('[cards] rapyd webhook access_key mismatch');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const payload = typeof req.body === 'object' && req.body ? req.body : JSON.parse(bodyText);
      const type = String(payload?.type || payload?.event || payload?.event_type || '');
      const data = payload?.data?.data || payload?.data || payload?.object || payload;

      // Card lifecycle: attempt status updates when provider card id is present.
      const providerCardId = String(data?.issued_card || data?.card_id || data?.card || data?.cardid || data?.cardId || '').trim();
      const cardStatus = data?.status || data?.card_status;
      if (providerCardId && cardStatus) {
        const normalized = normalizeCardStatus(String(cardStatus));
        await prisma.card.updateMany({
          where: { provider: 'RAPYD' as any, providerCardId },
          data: { status: normalized as any },
        });
      }

      // Transaction events: upsert CardTransaction when a transaction id is present.
      const providerTxId = String(data?.id || data?.transaction_id || data?.transaction || payload?.id || '').trim();
      if (providerCardId && providerTxId) {
        const card = await prisma.card.findFirst({ where: { provider: 'RAPYD' as any, providerCardId } });
        if (!card) {
          logger.warn({ providerCardId }, '[cards] webhook tx for unknown card');
          return res.status(200).json({ ok: true });
        }

        const kind = normalizeTxKind(type || String(data?.type || ''));
        const status = normalizeTxStatus(String(data?.status || data?.result || data?.state || ''));
        const currency = String(data?.currency || card.currency || 'USD').toUpperCase();
        const merchantName = (data?.merchant_name || data?.merchant?.name || data?.merchant || null) as string | null;
        const merchantCountry = (data?.merchant_country || data?.merchant?.country || null) as string | null;
        const mcc = (data?.mcc || data?.merchant_category_code || null) as string | null;
        const happenedAt = parseRapydTimestamp(data?.created_at || data?.timestamp || data?.happened_at || payload?.timestamp);

        const rawAmount = data?.amount ?? data?.authorized_amount ?? data?.transaction_amount ?? data?.original_amount ?? 0;
        const amt = new Decimal(String(rawAmount || 0));
        const signed = kind === 'REFUND' || kind === 'REVERSAL' ? amt.negated() : amt;

        const created = await prisma.cardTransaction.upsert({
          where: { providerTxId },
          create: {
            cardId: card.id,
            providerTxId,
            kind: kind as any,
            amount: signed.toString() as any,
            currency,
            merchantName,
            merchantCountry,
            mcc,
            status: status as any,
            happenedAt,
            raw: payload as any,
          },
          update: {
            status: status as any,
            merchantName,
            merchantCountry,
            mcc,
            happenedAt,
            raw: payload as any,
          },
        });

        // Enforcement: if limit is exceeded for the current interval, freeze the card (best-effort) and audit.
        const latestControl = await prisma.cardControl.findFirst({ where: { cardId: card.id }, orderBy: { version: 'desc' } });
        const limit = latestControl?.spendLimitAmount ? new Decimal(String(latestControl.spendLimitAmount)) : null;
        if (limit && limit.gt(0)) {
          const start = intervalStart(new Date(), String(latestControl?.spendLimitInterval || 'MONTHLY'));
          const sums = await prisma.cardTransaction.aggregate({
            where: {
              cardId: card.id,
              happenedAt: { gte: start },
              status: { in: ['PENDING', 'COMPLETED'] as any },
              kind: { in: ['AUTH', 'CLEARING'] as any },
            },
            _sum: { amount: true },
          });
          const spent = sums._sum.amount ? new Decimal(String(sums._sum.amount)) : new Decimal(0);
          if (spent.gt(limit) && card.status === ('ACTIVE' as any)) {
            try {
              await issuer.updateIssuedCardStatus({ card: card.providerCardId, status: 'block' } as any);
            } catch (e) {
              logger.warn({ err: e }, '[cards] issuer freeze after limit exceeded failed (best-effort)');
            }
            await prisma.$transaction(async (tx) => {
              await tx.card.update({ where: { id: card.id }, data: { status: 'FROZEN' as any } });
              await tx.cardEvent.create({
                data: {
                  cardId: card.id,
                  workspaceId: card.workspaceId,
                  actorUserId: null,
                  type: 'CARD_LIMIT_EXCEEDED',
                  payload: { limit: limit.toString(), spent: spent.toString(), interval: latestControl?.spendLimitInterval, providerTxId: created.providerTxId },
                },
              });
            });
          }
        }
      }

      return res.status(200).json({ ok: true });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] rapyd webhook handler failed');
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // List cards
  router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      await ensurePrismaUser(uid).catch(() => null);

      const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId : undefined;
      const workspaceType = typeof req.query.workspaceType === 'string' && (req.query.workspaceType === 'PERSONAL' || req.query.workspaceType === 'BUSINESS')
        ? (req.query.workspaceType as 'PERSONAL' | 'BUSINESS')
        : undefined;

      const ws = await ensureWorkspaceForRequest({ uid, workspaceId, workspaceType });
      if (!ws.ok) return res.status(ws.status).json({ error: ws.error });

      const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
      const limit = Math.min(Math.max(Number(req.query.limit || 50) || 50, 1), 200);

      const access = await requireWorkspaceSpendManager({ workspaceId: ws.workspace.id, uid });
      const canManage = access.ok;
      const isOwner = ws.workspace.ownerUserId === uid;
      const member = !isOwner
        ? await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: ws.workspace.id, userId: uid } } })
        : null;
      const role = isOwner ? 'OWNER' : (member ? String(member.role) : 'VIEWER');
      const isCardholderOnly = ws.workspace.type === ('BUSINESS' as any) && !['OWNER', 'ADMIN', 'SPEND_MANAGER'].includes(role);

      const cards = await prisma.card.findMany({
        where: {
          workspaceId: ws.workspace.id,
          ...(isCardholderOnly ? { assignedToUserId: uid } : {}),
          ...(status && ['ACTIVE', 'FROZEN', 'TERMINATED'].includes(status) ? { status: status as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          Controls: { orderBy: { version: 'desc' }, take: 1 },
        },
      });

      res.status(200).json({
        workspaceId: ws.workspace.id,
        cards: cards.map((c) => ({
          id: c.id,
          workspaceId: c.workspaceId,
          accountId: c.accountId,
          label: c.label,
          status: c.status,
          network: c.network,
          type: c.type,
          currency: c.currency,
          last4: c.last4,
          expMonth: c.expMonth,
          expYear: c.expYear,
          assignedToUserId: c.assignedToUserId,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          controls: c.Controls[0] ? {
            version: c.Controls[0].version,
            spendLimitAmount: c.Controls[0].spendLimitAmount,
            spendLimitInterval: c.Controls[0].spendLimitInterval,
            allowedCountries: c.Controls[0].allowedCountries,
            blockedCountries: c.Controls[0].blockedCountries,
            allowedMcc: c.Controls[0].allowedMcc,
            blockedMcc: c.Controls[0].blockedMcc,
            merchantAllowlist: c.Controls[0].merchantAllowlist,
            merchantBlocklist: c.Controls[0].merchantBlocklist,
            onlineAllowed: c.Controls[0].onlineAllowed,
            atmAllowed: c.Controls[0].atmAllowed,
            contactlessAllowed: c.Controls[0].contactlessAllowed,
            updatedAt: c.Controls[0].updatedAt,
          } : null,
        })),
      });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] list failed');
      res.status(500).json({ error: error.message || 'Failed to list cards' });
    }
  });

  // Create card (issue)
  router.post('/', verifyFirebaseToken, requireKYC, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      await ensurePrismaUser(uid).catch(() => null);

      const parsed = createCardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      }

      const idempotencyKey = (req.headers['idempotency-key'] as string | undefined)?.trim() || undefined;

      const ws = await ensureWorkspaceForRequest({ uid, workspaceId: parsed.data.workspaceId, workspaceType: parsed.data.workspaceType });
      if (!ws.ok) return res.status(ws.status).json({ error: ws.error });

      // Business: restrict issuance to spend managers/admins (cardholders/viewers can't issue).
      if (ws.workspace.type === ('BUSINESS' as any)) {
        const ok = await requireWorkspaceSpendManager({ workspaceId: ws.workspace.id, uid });
        if (!ok.ok) return res.status(ok.status).json({ error: ok.error });
      }

      const assignedToUserId = parsed.data.assignedToUserId || uid;
      if (ws.workspace.type === ('BUSINESS' as any)) {
        if (assignedToUserId !== ws.workspace.ownerUserId) {
          const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: ws.workspace.id, userId: assignedToUserId } },
          });
          if (!member) return res.status(400).json({ error: 'Assigned cardholder must be a workspace member' });
        }
      }

      if (idempotencyKey) {
        const existing = await prisma.card.findFirst({
          where: { workspaceId: ws.workspace.id, createdByUserId: uid, idempotencyKey },
          include: { Controls: { orderBy: { version: 'desc' }, take: 1 } },
        });
        if (existing) {
          return res.status(200).json({ card: existing, idempotent: true });
        }
      }

      const account = await prisma.account.findFirst({
        where: {
          id: parsed.data.accountId,
          OR: [
            { userId: uid },
            // For BUSINESS workspaces, allow funding accounts tied to the workspace.
            ...(ws.workspace.type === ('BUSINESS' as any) ? [{ workspaceId: ws.workspace.id }] : []),
          ],
        },
      });
      if (!account) return res.status(404).json({ error: 'Account not found' });

      // Single program currency enforcement
      const issuingCurrency = (process.env.RAPYD_ISSUING_CURRENCY || account.currency || 'USD').toUpperCase();
      if (String(account.currency).toUpperCase() !== issuingCurrency) {
        return res.status(400).json({ error: `Account currency must be ${issuingCurrency} for card issuing` });
      }

      const ewallet = account.rapydWalletId;
      if (!ewallet) {
        return res.status(503).json({ error: 'Rapyd wallet not configured for this account' });
      }

      const cardProgramId = process.env.RAPYD_CARD_PROGRAM_ID;
      const issuingCountry = process.env.RAPYD_ISSUING_COUNTRY;
      if (!cardProgramId || !issuingCountry) {
        return res.status(500).json({ error: 'Card issuing configuration missing (RAPYD_CARD_PROGRAM_ID, RAPYD_ISSUING_COUNTRY)' });
      }

      const requested = (parsed.data.type || 'VIRTUAL').toUpperCase();
      const cardType =
        process.env.RAPYD_ISSUING_CARD_TYPE ||
        (requested === 'PHYSICAL' ? 'physical' : 'virtual');

      const issuerPayload: CreateIssuedCardRequest = {
        ewallet,
        card_program: cardProgramId,
        country: issuingCountry,
        currency: issuingCurrency,
        card_type: cardType,
        description: parsed.data.label,
        metadata: {
          workspaceId: ws.workspace.id,
          accountId: account.id,
          createdByUserId: uid,
          assignedToUserId,
          idempotencyKey: idempotencyKey || null,
        },
      };

      const issued = await issuer.createIssuedCard(issuerPayload);
      const providerCardId = issued.id;
      const last4 = extractLast4(issued);
      const expiry = extractExpiry(issued);

      const created = await prisma.$transaction(async (tx) => {
        const card = await tx.card.create({
          data: {
            workspaceId: ws.workspace.id,
            accountId: account.id,
            label: parsed.data.label,
            status: normalizeCardStatus(issued.status || issued.card_status) as any,
            network: parsed.data.network as any,
            type: (parsed.data.type || 'VIRTUAL') as any,
            currency: issuingCurrency,
            provider: 'RAPYD' as any,
            providerCardId,
            last4,
            expMonth: expiry.expMonth,
            expYear: expiry.expYear,
            createdByUserId: uid,
            assignedToUserId,
            idempotencyKey: idempotencyKey,
            metadata: issuerPayload.metadata as any,
          },
        });

        const controlInput = parsed.data.controls || {};
        const controls = await tx.cardControl.create({
          data: {
            cardId: card.id,
            version: 1,
            spendLimitAmount: controlInput.spendLimitAmount !== undefined ? controlInput.spendLimitAmount : null,
            spendLimitInterval: (controlInput.spendLimitInterval || 'MONTHLY') as any,
            allowedCountries: controlInput.allowedCountries || [],
            blockedCountries: controlInput.blockedCountries || [],
            allowedMcc: controlInput.allowedMcc || [],
            blockedMcc: controlInput.blockedMcc || [],
            merchantAllowlist: controlInput.merchantAllowlist || [],
            merchantBlocklist: controlInput.merchantBlocklist || [],
            onlineAllowed: controlInput.onlineAllowed ?? true,
            atmAllowed: controlInput.atmAllowed ?? false,
            contactlessAllowed: controlInput.contactlessAllowed ?? true,
            updatedByUserId: uid,
          },
        });

        await tx.cardEvent.create({
          data: {
            cardId: card.id,
            workspaceId: ws.workspace.id,
            actorUserId: uid,
            type: 'CARD_CREATED',
            payload: { provider: 'RAPYD', providerCardId, last4, expMonth: expiry.expMonth, expYear: expiry.expYear },
          },
        });

        return { card, controls };
      });

      res.status(201).json({
        card: {
          id: created.card.id,
          workspaceId: created.card.workspaceId,
          accountId: created.card.accountId,
          label: created.card.label,
          status: created.card.status,
          network: created.card.network,
          type: created.card.type,
          currency: created.card.currency,
          last4: created.card.last4,
          expMonth: created.card.expMonth,
          expYear: created.card.expYear,
          assignedToUserId: created.card.assignedToUserId,
          createdAt: created.card.createdAt,
          updatedAt: created.card.updatedAt,
          controls: {
            version: created.controls.version,
            spendLimitAmount: created.controls.spendLimitAmount,
            spendLimitInterval: created.controls.spendLimitInterval,
            allowedCountries: created.controls.allowedCountries,
            blockedCountries: created.controls.blockedCountries,
            allowedMcc: created.controls.allowedMcc,
            blockedMcc: created.controls.blockedMcc,
            merchantAllowlist: created.controls.merchantAllowlist,
            merchantBlocklist: created.controls.merchantBlocklist,
            onlineAllowed: created.controls.onlineAllowed,
            atmAllowed: created.controls.atmAllowed,
            contactlessAllowed: created.controls.contactlessAllowed,
            updatedAt: created.controls.updatedAt,
          },
        },
      });
    } catch (error: any) {
      if (error instanceof RapydError) {
        logger.warn({ err: error, response: error.response }, '[cards] rapyd issuing failed');
        return res.status(502).json({ error: error.message || 'Card issuer unavailable' });
      }
      logger.error({ err: error }, '[cards] create failed');
      res.status(500).json({ error: error.message || 'Failed to create card' });
    }
  });

  // Get card details
  router.get('/:cardId', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const cardId = req.params.cardId;

      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { Controls: { orderBy: { version: 'desc' }, take: 1 } },
      });
      if (!card) return res.status(404).json({ error: 'Card not found' });

      const ws = await ensureWorkspaceForRequest({ uid, workspaceId: card.workspaceId });
      if (!ws.ok) return res.status(ws.status).json({ error: ws.error });

      res.status(200).json({
        card: {
          id: card.id,
          workspaceId: card.workspaceId,
          accountId: card.accountId,
          label: card.label,
          status: card.status,
          network: card.network,
          type: card.type,
          currency: card.currency,
          last4: card.last4,
          expMonth: card.expMonth,
          expYear: card.expYear,
          assignedToUserId: card.assignedToUserId,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          controls: card.Controls[0] || null,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] get failed');
      res.status(500).json({ error: error.message || 'Failed to fetch card' });
    }
  });

  // Reveal PAN/CVV (step-up required)
  router.post('/:cardId/reveal', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const step = await requireRecentAuth(req, 10 * 60);
      if (!step.ok) return res.status(403).json({ error: step.error });

      const cardId = req.params.cardId;
      const card = await prisma.card.findUnique({ where: { id: cardId } });
      if (!card) return res.status(404).json({ error: 'Card not found' });

      const ws = await ensureWorkspaceForRequest({ uid, workspaceId: card.workspaceId });
      if (!ws.ok) return res.status(ws.status).json({ error: ws.error });

      // Business: cardholders can reveal only their assigned cards; managers can reveal any (audited).
      if (ws.workspace.type === ('BUSINESS' as any)) {
        if (card.assignedToUserId && card.assignedToUserId !== uid) {
          const mgr = await requireWorkspaceSpendManager({ workspaceId: ws.workspace.id, uid });
          if (!mgr.ok) return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const issued = await issuer.getIssuedCard(card.providerCardId);
      const expiry = extractExpiry(issued);

      await prisma.cardRevealAudit.create({
        data: {
          cardId: card.id,
          actorUserId: uid,
          reason: typeof req.body?.reason === 'string' ? req.body.reason : null,
        },
      });

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        pan: issued.card_number,
        cvv: issued.cvv,
        expMonth: expiry.expMonth ?? card.expMonth,
        expYear: expiry.expYear ?? card.expYear,
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
      });
    } catch (error: any) {
      if (error instanceof RapydError) {
        logger.warn({ err: error, response: error.response }, '[cards] reveal rapyd failed');
        return res.status(502).json({ error: error.message || 'Card issuer unavailable' });
      }
      logger.error({ err: error }, '[cards] reveal failed');
      res.status(500).json({ error: error.message || 'Failed to reveal card' });
    }
  });

  async function requireCardManager(req: AuthenticatedRequest, cardId: string) {
    const uid = req.user?.uid;
    if (!uid) return { ok: false as const, status: 401, error: 'Unauthorized' };
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return { ok: false as const, status: 404, error: 'Card not found' };

    const workspace = await prisma.workspace.findUnique({ where: { id: card.workspaceId } });
    if (!workspace) return { ok: false as const, status: 404, error: 'Workspace not found' };

    if (workspace.ownerUserId === uid) return { ok: true as const, card, role: 'OWNER' as const };

    // Assigned cardholder can freeze/unfreeze (but not manage controls/terminate).
    if (card.assignedToUserId && card.assignedToUserId === uid) {
      return { ok: true as const, card, role: 'CARDHOLDER' as const };
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: uid } },
    });
    if (!member) return { ok: false as const, status: 403, error: 'Forbidden' };

    const allowed = ['OWNER', 'ADMIN', 'SPEND_MANAGER'];
    if (!allowed.includes(String(member.role))) return { ok: false as const, status: 403, error: 'Insufficient permissions' };
    return { ok: true as const, card, role: member.role as any };
  }

  // Freeze
  router.post('/:cardId/freeze', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await requireCardManager(req, req.params.cardId);
      if (!result.ok) return res.status(result.status).json({ error: result.error });

      await issuer.updateIssuedCardStatus({ card: result.card.providerCardId, status: 'block' } as any);

      const updated = await prisma.$transaction(async (tx) => {
        const card = await tx.card.update({ where: { id: result.card.id }, data: { status: 'FROZEN' as any } });
        await tx.cardEvent.create({
          data: {
            cardId: card.id,
            workspaceId: card.workspaceId,
            actorUserId: req.user?.uid || null,
            type: 'CARD_FROZEN',
          },
        });
        return card;
      });

      res.status(200).json({ status: updated.status });
    } catch (error: any) {
      if (error instanceof RapydError) return res.status(502).json({ error: error.message || 'Card issuer unavailable' });
      logger.error({ err: error }, '[cards] freeze failed');
      res.status(500).json({ error: error.message || 'Failed to freeze card' });
    }
  });

  // Unfreeze
  router.post('/:cardId/unfreeze', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await requireCardManager(req, req.params.cardId);
      if (!result.ok) return res.status(result.status).json({ error: result.error });

      await issuer.updateIssuedCardStatus({ card: result.card.providerCardId, status: 'unblock' } as any);

      const updated = await prisma.$transaction(async (tx) => {
        const card = await tx.card.update({ where: { id: result.card.id }, data: { status: 'ACTIVE' as any } });
        await tx.cardEvent.create({
          data: {
            cardId: card.id,
            workspaceId: card.workspaceId,
            actorUserId: req.user?.uid || null,
            type: 'CARD_UNFROZEN',
          },
        });
        return card;
      });

      res.status(200).json({ status: updated.status });
    } catch (error: any) {
      if (error instanceof RapydError) return res.status(502).json({ error: error.message || 'Card issuer unavailable' });
      logger.error({ err: error }, '[cards] unfreeze failed');
      res.status(500).json({ error: error.message || 'Failed to unfreeze card' });
    }
  });

  // Terminate (best-effort issuer call; always terminates locally if issuer is down)
  router.post('/:cardId/terminate', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await requireCardManager(req, req.params.cardId);
      if (!result.ok) return res.status(result.status).json({ error: result.error });
      if (result.role === 'CARDHOLDER') return res.status(403).json({ error: 'Insufficient permissions' });

      try {
        await issuer.updateIssuedCardStatus({ card: result.card.providerCardId, status: 'block' } as any);
      } catch (e) {
        logger.warn({ err: e }, '[cards] issuer terminate best-effort failed');
      }

      const updated = await prisma.$transaction(async (tx) => {
        const card = await tx.card.update({ where: { id: result.card.id }, data: { status: 'TERMINATED' as any } });
        await tx.cardEvent.create({
          data: {
            cardId: card.id,
            workspaceId: card.workspaceId,
            actorUserId: req.user?.uid || null,
            type: 'CARD_TERMINATED',
          },
        });
        return card;
      });

      res.status(200).json({ status: updated.status });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] terminate failed');
      res.status(500).json({ error: error.message || 'Failed to terminate card' });
    }
  });

  // Update controls (versioned append-only)
  router.patch('/:cardId/controls', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const result = await requireCardManager(req, req.params.cardId);
      if (!result.ok) return res.status(result.status).json({ error: result.error });
      if (result.role === 'CARDHOLDER') return res.status(403).json({ error: 'Insufficient permissions' });

      const parsed = controlsSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

      const latest = await prisma.cardControl.findFirst({
        where: { cardId: result.card.id },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (latest?.version || 0) + 1;
      const next = parsed.data;

      const created = await prisma.cardControl.create({
        data: {
          cardId: result.card.id,
          version: nextVersion,
          spendLimitAmount: next.spendLimitAmount !== undefined ? next.spendLimitAmount : (latest?.spendLimitAmount ?? null),
          spendLimitInterval: (next.spendLimitInterval || (latest?.spendLimitInterval as any) || 'MONTHLY') as any,
          allowedCountries: next.allowedCountries ?? (latest?.allowedCountries ?? []),
          blockedCountries: next.blockedCountries ?? (latest?.blockedCountries ?? []),
          allowedMcc: next.allowedMcc ?? (latest?.allowedMcc ?? []),
          blockedMcc: next.blockedMcc ?? (latest?.blockedMcc ?? []),
          merchantAllowlist: next.merchantAllowlist ?? (latest?.merchantAllowlist ?? []),
          merchantBlocklist: next.merchantBlocklist ?? (latest?.merchantBlocklist ?? []),
          onlineAllowed: next.onlineAllowed ?? (latest?.onlineAllowed ?? true),
          atmAllowed: next.atmAllowed ?? (latest?.atmAllowed ?? false),
          contactlessAllowed: next.contactlessAllowed ?? (latest?.contactlessAllowed ?? true),
          updatedByUserId: uid,
        },
      });

      await prisma.cardEvent.create({
        data: {
          cardId: result.card.id,
          workspaceId: result.card.workspaceId,
          actorUserId: uid,
          type: 'CARD_CONTROLS_UPDATED',
          payload: { version: created.version },
        },
      });

      res.status(200).json({ controls: created });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] update controls failed');
      res.status(500).json({ error: error.message || 'Failed to update controls' });
    }
  });

  // Transactions
  router.get('/:cardId/transactions', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const cardId = req.params.cardId;
      const card = await prisma.card.findUnique({ where: { id: cardId } });
      if (!card) return res.status(404).json({ error: 'Card not found' });

      const ws = await ensureWorkspaceForRequest({ uid, workspaceId: card.workspaceId });
      if (!ws.ok) return res.status(ws.status).json({ error: ws.error });

      const limit = Math.min(Math.max(Number(req.query.limit || 50) || 50, 1), 200);
      const txs = await prisma.cardTransaction.findMany({
        where: { cardId },
        orderBy: { happenedAt: 'desc' },
        take: limit,
      });

      res.status(200).json({ transactions: txs });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] list transactions failed');
      res.status(500).json({ error: error.message || 'Failed to list transactions' });
    }
  });

  // Audit/events (includes reveal audits)
  router.get('/:cardId/events', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const cardId = req.params.cardId;
      const card = await prisma.card.findUnique({ where: { id: cardId } });
      if (!card) return res.status(404).json({ error: 'Card not found' });

      const ws = await ensureWorkspaceForRequest({ uid, workspaceId: card.workspaceId });
      if (!ws.ok) return res.status(ws.status).json({ error: ws.error });

      if (ws.workspace.type === ('BUSINESS' as any)) {
        if (card.assignedToUserId && card.assignedToUserId !== uid) {
          const mgr = await requireWorkspaceSpendManager({ workspaceId: ws.workspace.id, uid });
          if (!mgr.ok) return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const limit = Math.min(Math.max(Number(req.query.limit || 50) || 50, 1), 200);

      const [events, reveals] = await Promise.all([
        prisma.cardEvent.findMany({ where: { cardId }, orderBy: { createdAt: 'desc' }, take: limit }),
        prisma.cardRevealAudit.findMany({ where: { cardId }, orderBy: { createdAt: 'desc' }, take: limit }),
      ]);

      const merged = [
        ...events.map((e) => ({ kind: 'EVENT' as const, id: e.id, type: e.type, actorUserId: e.actorUserId, createdAt: e.createdAt, payload: e.payload })),
        ...reveals.map((r) => ({ kind: 'REVEAL' as const, id: r.id, type: 'CARD_REVEALED', actorUserId: r.actorUserId, createdAt: r.createdAt, payload: { reason: r.reason } })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      res.status(200).json({ events: merged });
    } catch (error: any) {
      logger.error({ err: error }, '[cards] list events failed');
      res.status(500).json({ error: error.message || 'Failed to list events' });
    }
  });

  return router;
}
