import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import admin from 'firebase-admin';

function toDecimal(value: unknown, fallback: number = 0): Decimal {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return new Decimal(fallback);
  return new Decimal(n);
}

function toDate(value: unknown, fallback: Date = new Date()): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

export type InvoiceV1CreateDraftInput = {
  invoiceType: 'USER' | 'BUSINESS';
  businessId?: string;
  currency: string;
  issueDate: string | Date;
  dueDate: string | Date;
  fromInfo: any;
  toInfo: any;
  items: Array<{ description: string; quantity: number; price: number }>;
  taxRate?: number;
  notes?: string;
  paymentMethod?: 'PAYVOST' | 'MANUAL' | 'STRIPE' | 'RAPYD';
  manualBankDetails?: any;
};

export type InvoiceV1UpdateDraftInput = Partial<Omit<InvoiceV1CreateDraftInput, 'invoiceType' | 'businessId'>> & {
  // Allow changing who/what it is addressed to in draft, but not workspace identity.
};

export class InvoiceV1Service {
  constructor(private prisma: PrismaClient) {}

  private async ensureWorkspace(params: {
    ownerUserId: string;
    type: 'PERSONAL' | 'BUSINESS';
    businessId?: string;
    name?: string;
    defaultCurrency?: string;
  }) {
    const businessId = params.type === 'PERSONAL' ? '' : (params.businessId || '');
    if (params.type === 'BUSINESS' && !businessId) {
      throw new Error('businessId is required for BUSINESS invoices');
    }

    return this.prisma.workspace.upsert({
      where: {
        type_ownerUserId_businessId: {
          type: params.type as any,
          ownerUserId: params.ownerUserId,
          businessId,
        },
      },
      create: {
        type: params.type as any,
        ownerUserId: params.ownerUserId,
        businessId,
        name: params.name || (params.type === 'PERSONAL' ? 'Personal' : `Business ${businessId}`),
        defaultCurrency: params.defaultCurrency || 'USD',
        defaultLocale: 'en-US',
      },
      update: {},
    });
  }

  private async ensureSeries(workspaceId: string) {
    return this.prisma.invoiceSeries.upsert({
      where: { workspaceId },
      create: { workspaceId, prefix: 'INV-', padding: 6, nextNumber: 1 },
      update: {},
    });
  }

  private newToken(): string {
    // 192 bits, url-safe
    return crypto.randomBytes(24).toString('base64url');
  }

  private newDraftNumber(): string {
    return `DRAFT-${crypto.randomUUID()}`;
  }

  private calculateTotals(items: Array<{ quantity: number; price: number }>, taxRate: number = 0) {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  }

  async createDraft(ownerUserId: string, input: InvoiceV1CreateDraftInput) {
    if (input.invoiceType === 'BUSINESS') {
      if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized');
      }
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(ownerUserId).get();
      const userData: any = userDoc.exists ? userDoc.data() : null;
      const kycStatus = String(userData?.kycStatus || '').toLowerCase();
      if (kycStatus !== 'verified') {
        throw new Error('KYC verification required to create business invoices');
      }
      const bizId = String(input.businessId || '');
      const profileId = String(userData?.businessProfile?.id || '');
      if (bizId && profileId && bizId !== profileId) {
        throw new Error('businessId does not match your business profile');
      }
    }

    const workspace = await this.ensureWorkspace({
      ownerUserId,
      type: input.invoiceType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL',
      businessId: input.businessId,
      defaultCurrency: input.currency,
    });
    await this.ensureSeries(workspace.id);

    const taxRate = Number(input.taxRate || 0);
    const items = Array.isArray(input.items) ? input.items : [];
    const { grandTotal } = this.calculateTotals(items, taxRate);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: this.newDraftNumber(),
        kind: 'INVOICE' as any,
        invoiceType: input.invoiceType as any,
        workspaceId: workspace.id,
        userId: ownerUserId,
        businessId: input.invoiceType === 'BUSINESS' ? (input.businessId || null) : null,
        createdBy: ownerUserId,
        issueDate: toDate(input.issueDate, new Date()),
        dueDate: toDate(input.dueDate, new Date()),
        status: 'DRAFT' as any,
        currency: String(input.currency || workspace.defaultCurrency || 'USD').toUpperCase(),
        grandTotal: toDecimal(grandTotal, 0),
        amountPaid: toDecimal(0, 0),
        taxRate: toDecimal(taxRate, 0),
        fromInfo: input.fromInfo ?? {},
        toInfo: input.toInfo ?? {},
        items: items as any,
        paymentMethod: ((input.paymentMethod || 'PAYVOST') as any),
        manualBankDetails: input.manualBankDetails ?? null,
        notes: input.notes ?? null,
        isPublic: false,
        publicUrl: null,
        legacySource: 'NATIVE' as any,
      },
    });

    await this.prisma.invoiceEvent.create({
      data: {
        invoiceId: invoice.id,
        actorUserId: ownerUserId,
        type: 'INVOICE_CREATED' as any,
        payload: { source: 'v1' },
      },
    });

    return invoice;
  }

  async updateDraft(ownerUserId: string, invoiceId: string, patch: InvoiceV1UpdateDraftInput) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.createdBy !== ownerUserId && invoice.userId !== ownerUserId) throw new Error('Unauthorized');
    if (invoice.status !== ('DRAFT' as any)) throw new Error('Only drafts can be edited');

    const nextItems = patch.items ?? (invoice.items as any);
    const nextTaxRate = patch.taxRate ?? (typeof invoice.taxRate === 'object' ? Number(invoice.taxRate.toString()) : Number(invoice.taxRate));
    const { grandTotal } = this.calculateTotals(Array.isArray(nextItems) ? nextItems : [], Number(nextTaxRate || 0));

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        issueDate: patch.issueDate ? toDate(patch.issueDate) : undefined,
        dueDate: patch.dueDate ? toDate(patch.dueDate) : undefined,
        currency: patch.currency ? String(patch.currency).toUpperCase() : undefined,
        fromInfo: patch.fromInfo !== undefined ? (patch.fromInfo ?? {}) : undefined,
        toInfo: patch.toInfo !== undefined ? (patch.toInfo ?? {}) : undefined,
        items: patch.items !== undefined ? (patch.items as any) : undefined,
        taxRate: patch.taxRate !== undefined ? toDecimal(patch.taxRate, 0) : undefined,
        grandTotal: toDecimal(grandTotal, 0),
        notes: patch.notes !== undefined ? (patch.notes ?? null) : undefined,
        paymentMethod: patch.paymentMethod !== undefined ? ((patch.paymentMethod || 'PAYVOST') as any) : undefined,
        manualBankDetails: patch.manualBankDetails !== undefined ? (patch.manualBankDetails ?? null) : undefined,
      },
    });

    return updated;
  }

  async issueInvoice(ownerUserId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.createdBy !== ownerUserId && invoice.userId !== ownerUserId) throw new Error('Unauthorized');
    if (invoice.status !== ('DRAFT' as any)) throw new Error('Only drafts can be issued');
    if (!invoice.workspaceId) throw new Error('Invoice workspace missing');

    await this.ensureSeries(invoice.workspaceId);

    // Reserve a number by incrementing series. Retry on unique collision.
    let assignedNumber: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const series = await this.prisma.invoiceSeries.update({
        where: { workspaceId: invoice.workspaceId },
        data: { nextNumber: { increment: 1 } },
      });
      const reserved = series.nextNumber - 1;
      const padded = String(reserved).padStart(series.padding, '0');
      assignedNumber = `${series.prefix}${padded}`;

      try {
        const updated = await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            invoiceNumber: assignedNumber,
            status: 'ISSUED' as any,
            issuedAt: new Date(),
          },
        });

        await this.prisma.invoiceEvent.create({
          data: {
            invoiceId,
            actorUserId: ownerUserId,
            type: 'INVOICE_ISSUED' as any,
            payload: { invoiceNumber: assignedNumber },
          },
        });

        const link = await this.upsertPublicLink(invoiceId);

        return { invoice: updated, publicLink: link };
      } catch (e: any) {
        // Prisma unique constraint violation (invoiceNumber)
        if (e?.code === 'P2002') {
          assignedNumber = null;
          continue;
        }
        throw e;
      }
    }

    throw new Error('Failed to issue invoice: could not reserve invoice number');
  }

  async upsertPublicLink(invoiceId: string) {
    const token = this.newToken();
    const link = await this.prisma.invoicePublicLink.upsert({
      where: { invoiceId },
      create: { invoiceId, token },
      update: { token, revokedAt: null, expiresAt: null },
    });
    return link;
  }

  async voidInvoice(ownerUserId: string, invoiceId: string, reason?: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.createdBy !== ownerUserId && invoice.userId !== ownerUserId) throw new Error('Unauthorized');
    if (invoice.status === ('PAID' as any) || invoice.amountPaid?.toString?.() !== '0') {
      throw new Error('Cannot void a paid invoice');
    }
    if (invoice.status === ('VOID' as any)) return invoice;
    if (invoice.status === ('DRAFT' as any)) {
      // Drafts can be deleted by a separate operation; voiding a draft is allowed but odd.
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'VOID' as any,
        voidedAt: new Date(),
        voidReason: reason || null,
      },
    });

    await this.prisma.invoiceEvent.create({
      data: {
        invoiceId,
        actorUserId: ownerUserId,
        type: 'INVOICE_VOIDED' as any,
        payload: { reason: reason || null },
      },
    });

    // Revoke any existing public link.
    await this.prisma.invoicePublicLink.updateMany({
      where: { invoiceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return updated;
  }

  async createCreditNote(ownerUserId: string, invoiceId: string, params: { reason?: string; amount?: number }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.createdBy !== ownerUserId && invoice.userId !== ownerUserId) throw new Error('Unauthorized');
    if (invoice.status !== ('PAID' as any) && invoice.amountPaid?.toString?.() === '0') {
      // Allow credit notes for adjustments even if unpaid, but it should reference an issued invoice.
      if (invoice.status === ('DRAFT' as any)) throw new Error('Cannot credit a draft invoice');
    }

    const amount = Number(params.amount ?? invoice.grandTotal?.toString?.() ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Credit amount must be > 0');
    }

    const draft = await this.createDraft(ownerUserId, {
      invoiceType: invoice.invoiceType as any,
      businessId: invoice.businessId || undefined,
      currency: invoice.currency,
      issueDate: new Date(),
      dueDate: new Date(),
      fromInfo: invoice.fromInfo,
      toInfo: invoice.toInfo,
      items: [
        {
          description: params.reason || `Credit for invoice ${invoice.invoiceNumber}`,
          quantity: 1,
          price: -amount,
        },
      ],
      taxRate: 0,
      notes: params.reason || undefined,
      paymentMethod: invoice.paymentMethod as any,
      manualBankDetails: invoice.manualBankDetails,
    });

    const credit = await this.prisma.invoice.update({
      where: { id: draft.id },
      data: {
        kind: 'CREDIT_NOTE' as any,
        creditNoteForId: invoice.id,
      },
    });

    const issued = await this.issueInvoice(ownerUserId, credit.id);

    await this.prisma.invoiceEvent.create({
      data: {
        invoiceId: invoice.id,
        actorUserId: ownerUserId,
        type: 'CREDIT_NOTE_ISSUED' as any,
        payload: { creditNoteId: issued.invoice.id },
      },
    });

    return issued;
  }

  async getInvoice(ownerUserId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { PublicLink: true },
    });
    if (!invoice) return null;
    if (invoice.createdBy !== ownerUserId && invoice.userId !== ownerUserId) return null;
    return invoice;
  }

  async listInvoices(ownerUserId: string, params?: { invoiceType?: 'USER' | 'BUSINESS'; status?: string; limit?: number; offset?: number }) {
    const take = Math.min(Math.max(Number(params?.limit || 50), 1), 200);
    const skip = Math.max(Number(params?.offset || 0), 0);
    const where: any = {
      OR: [{ userId: ownerUserId }, { createdBy: ownerUserId }],
    };

    if (params?.invoiceType) where.invoiceType = params.invoiceType;
    if (params?.status) where.status = params.status as any;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { PublicLink: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  async getPublicInvoiceByToken(token: string) {
    const link = await this.prisma.invoicePublicLink.findUnique({
      where: { token },
      include: { Invoice: true },
    });
    if (!link) return null;
    if (link.revokedAt) return null;
    if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return null;

    const invoice = link.Invoice;
    if (!invoice) return null;
    if (invoice.status === ('DRAFT' as any) || invoice.status === ('VOID' as any) || invoice.status === ('CANCELLED' as any)) return null;

    // Record view. Best-effort (don't fail the read).
    try {
      await this.prisma.$transaction([
        this.prisma.invoicePublicLink.update({
          where: { id: link.id },
          data: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
        }),
        this.prisma.invoiceEvent.create({
          data: {
            invoiceId: invoice.id,
            actorUserId: null,
            type: 'INVOICE_VIEWED' as any,
            payload: { token: link.token },
          },
        }),
        this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            viewedAt: invoice.viewedAt ? undefined : new Date(),
            status: invoice.status === ('SENT' as any) || invoice.status === ('ISSUED' as any) || invoice.status === ('PENDING' as any)
              ? ('VIEWED' as any)
              : undefined,
          },
        }),
      ]);
    } catch {
      // Ignore
    }

    return { invoice, link };
  }

  async resolveLegacyToToken(legacyId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { legacyId },
      include: { PublicLink: true },
    });

    if (existing?.PublicLink && !existing.PublicLink.revokedAt && (!existing.PublicLink.expiresAt || existing.PublicLink.expiresAt.getTime() > Date.now())) {
      return { invoiceId: existing.id, token: existing.PublicLink.token };
    }

    // Best-effort: import legacy Firestore invoice on-demand for link migration.
    const imported = await this.importLegacyFirestoreInvoiceById(legacyId);
    if (!imported) return null;

    const link = await this.upsertPublicLink(imported.id);
    return { invoiceId: imported.id, token: link.token };
  }

  private async importLegacyFirestoreInvoiceById(legacyId: string) {
    try {
      if (!admin.apps.length) {
        // Firebase not configured; can't import.
        return null;
      }

      const db = admin.firestore();
      let docSnap = await db.collection('businessInvoices').doc(legacyId).get();
      let isBusiness = true;

      if (!docSnap.exists) {
        docSnap = await db.collection('invoices').doc(legacyId).get();
        isBusiness = false;
      }

      if (!docSnap.exists) return null;

      const data: any = docSnap.data();
      if (!data) return null;

      // Only import if it was meant to be public previously.
      const isDraft = data?.status === 'Draft' || data?.status === 'DRAFT';
      const isPublic = isBusiness ? !isDraft : data?.isPublic === true;
      if (!isPublic) return null;

      const ownerUserId = isBusiness ? String(data?.createdBy || '') : String(data?.userId || '');
      if (!ownerUserId) return null;

      const businessId = isBusiness ? String(data?.businessId || '') : '';
      const invoiceType = isBusiness ? 'BUSINESS' : 'USER';

      const workspace = await this.ensureWorkspace({
        ownerUserId,
        type: isBusiness ? 'BUSINESS' : 'PERSONAL',
        businessId: isBusiness ? businessId : undefined,
        defaultCurrency: data?.currency || 'USD',
      });

      await this.ensureSeries(workspace.id);

      const items = Array.isArray(data?.items) ? data.items : [];
      const taxRate = Number(data?.taxRate || 0);
      const { grandTotal } = this.calculateTotals(items, taxRate);

      const invoiceNumberRaw = String(data?.invoiceNumber || '').trim();
      const invoiceNumber = invoiceNumberRaw || this.newDraftNumber();

      const fromInfo = {
        name: data?.fromName || data?.fromInfo?.name || '',
        address: data?.fromAddress || data?.fromInfo?.address || '',
        email: data?.fromEmail || data?.fromInfo?.email || undefined,
      };
      const toInfo = {
        name: data?.toName || data?.toInfo?.name || '',
        address: data?.toAddress || data?.toInfo?.address || '',
        email: data?.toEmail || data?.toInfo?.email || '',
      };

      const paymentMethod = String(data?.paymentMethod || 'PAYVOST').toUpperCase();
      const manualBankDetails = paymentMethod === 'MANUAL' || String(data?.paymentMethod || '').toLowerCase() === 'manual'
        ? {
          bankName: data?.manualBankName || data?.manualBankDetails?.bankName || '',
          accountName: data?.manualAccountName || data?.manualBankDetails?.accountName || '',
          accountNumber: data?.manualAccountNumber || data?.manualBankDetails?.accountNumber || '',
          otherDetails: data?.manualOtherDetails || data?.manualBankDetails?.otherDetails || '',
        }
        : null;

      const statusRaw = String(data?.status || '').toLowerCase();
      const status = statusRaw === 'paid' ? 'PAID'
        : statusRaw === 'pending' ? 'ISSUED'
          : statusRaw === 'overdue' ? 'ISSUED'
            : 'ISSUED';

      const issueDate = toDate(data?.issueDate?.toDate ? data.issueDate.toDate() : data?.issueDate, new Date());
      const dueDate = toDate(data?.dueDate?.toDate ? data.dueDate.toDate() : data?.dueDate, issueDate);
      const paidAt = data?.paidAt?.toDate ? data.paidAt.toDate() : (data?.paidAt ? toDate(data.paidAt) : null);

      const legacySource = isBusiness ? 'FIRESTORE_BUSINESS_INVOICES' : 'FIRESTORE_INVOICES';

      // Try to create with original invoiceNumber; if it collides, suffix it.
      let created: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const attemptNumber = attempt === 0 ? invoiceNumber : `${invoiceNumber}-${attempt + 1}`;
        try {
          created = await this.prisma.invoice.create({
            data: {
              invoiceNumber: attemptNumber,
              kind: 'INVOICE' as any,
              invoiceType: invoiceType as any,
              workspaceId: workspace.id,
              userId: ownerUserId,
              businessId: isBusiness ? businessId : null,
              createdBy: ownerUserId,
              issueDate,
              dueDate,
              status: status as any,
              issuedAt: issueDate,
              currency: String(data?.currency || 'USD').toUpperCase(),
              grandTotal: toDecimal(Number(data?.grandTotal || grandTotal), 0),
              amountPaid: toDecimal(0, 0),
              taxRate: toDecimal(taxRate, 0),
              fromInfo,
              toInfo,
              items: items as any,
              paymentMethod: (paymentMethod as any),
              manualBankDetails: manualBankDetails ?? undefined,
              notes: data?.notes || null,
              isPublic: false,
              publicUrl: null,
              legacySource: legacySource as any,
              legacyId,
              paidAt: paidAt || undefined,
            },
          });
          break;
        } catch (e: any) {
          if (e?.code === 'P2002') continue;
          throw e;
        }
      }

      if (!created) return null;

      await this.prisma.invoiceEvent.create({
        data: {
          invoiceId: created.id,
          actorUserId: null,
          type: 'INVOICE_CREATED' as any,
          payload: { source: legacySource, legacyId },
        },
      });

      return created;
    } catch {
      return null;
    }
  }
}
