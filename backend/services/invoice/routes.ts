import { Router, Request, Response } from 'express';
import { InvoiceService, InvoiceRecipient } from './src/invoice-service';
import { InvoiceV1Service } from './src/invoice-v1-service';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { prisma } from '../../common/prisma';
import admin from '../../firebase';

const router = Router();
const invoiceService = new InvoiceService(prisma);
const invoiceV1 = new InvoiceV1Service(prisma);

function titleCaseStatus(status: string | null | undefined): string {
  const raw = String(status || '').trim();
  if (!raw) return 'Draft';
  return raw
    .toLowerCase()
    .split('_')
    .map(s => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

function serializeInvoiceForUi(invoice: any, publicLinkToken?: string | null) {
  const grandTotal = typeof invoice?.grandTotal === 'object' && invoice?.grandTotal !== null
    ? parseFloat(invoice.grandTotal.toString())
    : Number(invoice?.grandTotal || 0);
  const taxRate = typeof invoice?.taxRate === 'object' && invoice?.taxRate !== null
    ? parseFloat(invoice.taxRate.toString())
    : Number(invoice?.taxRate || 0);

  const fromInfo = invoice?.fromInfo || {};
  const toInfo = invoice?.toInfo || {};
  const paymentMethod = String(invoice?.paymentMethod || 'PAYVOST').toLowerCase();
  const manualBankDetails = invoice?.manualBankDetails || null;

  const publicUrl = publicLinkToken ? `/i/${publicLinkToken}` : null;

  return {
    ...invoice,
    status: titleCaseStatus(invoice?.status),
    grandTotal,
    taxRate,
    issueDate: invoice?.issueDate instanceof Date ? invoice.issueDate.toISOString() : invoice?.issueDate,
    dueDate: invoice?.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice?.dueDate,
    createdAt: invoice?.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice?.createdAt,
    updatedAt: invoice?.updatedAt instanceof Date ? invoice.updatedAt.toISOString() : invoice?.updatedAt,
    paidAt: invoice?.paidAt instanceof Date ? invoice.paidAt.toISOString() : invoice?.paidAt ?? null,
    issuedAt: invoice?.issuedAt instanceof Date ? invoice.issuedAt.toISOString() : invoice?.issuedAt ?? null,
    sentAt: invoice?.sentAt instanceof Date ? invoice.sentAt.toISOString() : invoice?.sentAt ?? null,
    viewedAt: invoice?.viewedAt instanceof Date ? invoice.viewedAt.toISOString() : invoice?.viewedAt ?? null,
    voidedAt: invoice?.voidedAt instanceof Date ? invoice.voidedAt.toISOString() : invoice?.voidedAt ?? null,
    // Flatten for existing UI components (legacy compatibility)
    fromName: fromInfo?.name || invoice?.fromName || '',
    fromAddress: fromInfo?.address || invoice?.fromAddress || '',
    fromEmail: fromInfo?.email || invoice?.fromEmail || '',
    toName: toInfo?.name || invoice?.toName || '',
    toAddress: toInfo?.address || invoice?.toAddress || '',
    toEmail: toInfo?.email || invoice?.toEmail || '',
    items: invoice?.items || [],
    paymentMethod,
    manualBankName: manualBankDetails?.bankName || invoice?.manualBankName || '',
    manualAccountName: manualBankDetails?.accountName || invoice?.manualAccountName || '',
    manualAccountNumber: manualBankDetails?.accountNumber || invoice?.manualAccountNumber || '',
    manualOtherDetails: manualBankDetails?.otherDetails || invoice?.manualOtherDetails || '',
    publicUrl,
    publicLinkToken: publicLinkToken || null,
  };
}

/**
 * GET /invoices
 * List user's invoices
 */
router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, limit, offset, invoiceType } = req.query as any;
    const result = await invoiceV1.listInvoices(userId, {
      status: status as any,
      invoiceType: invoiceType as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    // Keep legacy response shape while adding public link info for UI.
    const invoices = result.invoices.map((inv: any) => serializeInvoiceForUi(inv, inv?.PublicLink?.token || null));
    res.json({ invoices, total: result.total });
  } catch (error: any) {
    console.error('Error listing invoices:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /invoices/stats
 * Get invoice statistics
 */
router.get('/stats', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await invoiceService.getInvoiceStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting invoice stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /invoices/business
 * List business invoices
 */
router.get('/business', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { businessId, status, limit, offset } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const result = await invoiceService.listBusinessInvoices(
      businessId as string,
      userId,
      {
        status: status as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error listing business invoices:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /invoices/drafts
 * Create a draft invoice (v1 command-style endpoint)
 */
router.post('/drafts', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const invoice = await invoiceV1.createDraft(userId, req.body);
    res.status(201).json(serializeInvoiceForUi(invoice));
  } catch (error: any) {
    console.error('Error creating draft invoice:', error);
    res.status(400).json({ error: error.message || 'Invalid invoice data' });
  }
});

/**
 * POST /invoices
 * Legacy create endpoint (kept for backward compatibility).
 * Creates a draft, and issues immediately when caller indicates a non-draft lifecycle.
 */
router.post('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const draft = await invoiceV1.createDraft(userId, req.body);

    const requestedStatus = String(req.body?.status || '').toUpperCase();
    const shouldIssue = requestedStatus && requestedStatus !== 'DRAFT' && requestedStatus !== 'DRAFTS';
    const shouldSend = Boolean(req.body?.send === true);

    if (shouldIssue || shouldSend) {
      const issued = await invoiceV1.issueInvoice(userId, (draft as any).id);
      if (shouldSend) {
        // Reuse /:id/send behavior for eventing + best-effort notifications.
        const updated = await prisma.invoice.update({
          where: { id: issued.invoice.id },
          data: { status: 'SENT' as any, sentAt: new Date() },
        });
        return res.status(201).json(serializeInvoiceForUi(updated, issued.publicLink?.token || null));
      }
      return res.status(201).json(serializeInvoiceForUi(issued.invoice, issued.publicLink?.token || null));
    }

    return res.status(201).json(serializeInvoiceForUi(draft));
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(400).json({ error: error.message || 'Invalid invoice data' });
  }
});

/**
 * POST /invoices/:id/issue
 * Issue an invoice (locks it + assigns invoice number + creates public token link)
 */
router.post('/:id/issue', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { invoice, publicLink } = await invoiceV1.issueInvoice(userId, id);
    res.json({
      invoice: serializeInvoiceForUi(invoice, publicLink?.token || null),
      publicLink: {
        token: publicLink.token,
        url: `/i/${publicLink.token}`,
      },
    });
  } catch (error: any) {
    console.error('Error issuing invoice:', error);
    res.status(400).json({ error: error.message || 'Failed to issue invoice' });
  }
});

/**
 * POST /invoices/:id/send
 * Marks invoice as sent and triggers notification delivery (best-effort).
 */
router.post('/:id/send', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let invoice = await invoiceV1.getInvoice(userId, id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Ensure it is issued (and has a token link) before sending.
    let publicToken: string | null = (invoice as any)?.PublicLink?.token || null;
    if ((invoice as any).status === ('DRAFT' as any)) {
      const issued = await invoiceV1.issueInvoice(userId, id);
      invoice = issued.invoice as any;
      publicToken = issued.publicLink?.token || null;
    } else if (!publicToken) {
      const link = await invoiceV1.upsertPublicLink(id);
      publicToken = link.token;
    }

    // Update lifecycle fields.
    const nextStatus = (invoice as any).status === ('ISSUED' as any) || (invoice as any).status === ('PENDING' as any)
      ? ('SENT' as any)
      : (invoice as any).status;

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: nextStatus,
        sentAt: (invoice as any).sentAt ? undefined : new Date(),
      },
    });

    await prisma.invoiceEvent.create({
      data: {
        invoiceId: id,
        actorUserId: userId,
        type: 'INVOICE_SENT' as any,
        payload: { channel: req.body?.channel || 'email' },
      },
    });

    // Best-effort notification delivery.
    const toInfo = (updated as any).toInfo as InvoiceRecipient;
    const customerEmail = toInfo?.email;
    if (customerEmail) {
      const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
      const publicUrl = publicToken ? `/i/${publicToken}` : null;

      fetch(`${NOTIFICATION_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice-generated',
          email: customerEmail,
          subject: `Invoice ${updated.invoiceNumber}`,
          template: 'invoice template',
          variables: {
            invoiceNumber: updated.invoiceNumber,
            amount: typeof (updated as any).grandTotal === 'object' ? parseFloat((updated as any).grandTotal.toString()) : Number((updated as any).grandTotal || 0),
            currency: (updated as any).currency || 'USD',
            dueDate: (updated as any).dueDate instanceof Date ? (updated as any).dueDate.toISOString().split('T')[0] : (updated as any).dueDate,
            customerName: toInfo?.name || 'Valued Customer',
            publicUrl,
          },
        }),
      }).catch(() => {
        // Ignore notification errors; the invoice is still sent from a system-of-record perspective.
      });
    }

    res.json({
      invoice: serializeInvoiceForUi(updated, publicToken),
      publicLink: publicToken
        ? { token: publicToken, url: `/i/${publicToken}` }
        : null,
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    res.status(400).json({ error: error.message || 'Failed to send invoice' });
  }
});

/**
 * POST /invoices/:id/void
 */
router.post('/:id/void', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reason = req.body?.reason;
    const invoice = await invoiceV1.voidInvoice(userId, id, reason);
    res.json(serializeInvoiceForUi(invoice));
  } catch (error: any) {
    console.error('Error voiding invoice:', error);
    res.status(400).json({ error: error.message || 'Failed to void invoice' });
  }
});

/**
 * POST /invoices/:id/credit-notes
 */
router.post('/:id/credit-notes', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const issued = await invoiceV1.createCreditNote(userId, id, {
      reason: req.body?.reason,
      amount: req.body?.amount,
    });

    res.json({
      creditNote: serializeInvoiceForUi(issued.invoice, issued.publicLink?.token || null),
      publicLink: {
        token: issued.publicLink?.token,
        url: issued.publicLink?.token
          ? `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'}/i/${issued.publicLink.token}`
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error creating credit note:', error);
    res.status(400).json({ error: error.message || 'Failed to create credit note' });
  }
});

/**
 * PATCH /invoices/:id
 * Update invoice (draft-only, v1 behavior)
 */
router.patch('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const invoice = await invoiceV1.updateDraft(userId, id, req.body);
    res.json(serializeInvoiceForUi(invoice));
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    if (error.message === 'Invoice not found') return res.status(404).json({ error: error.message });
    if (error.message === 'Unauthorized') return res.status(403).json({ error: error.message });
    if (error.message === 'Only drafts can be edited') return res.status(409).json({ error: error.message });
    res.status(400).json({ error: error.message || 'Invalid update data' });
  }
});

/**
 * GET /invoices/:id
 * Get invoice by ID
 */
router.get('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const invoice = await invoiceV1.getInvoice(userId, id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json(serializeInvoiceForUi(invoice, (invoice as any)?.PublicLink?.token || null));
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /invoices/:id/mark-paid
 * Mark invoice as paid
 */
router.post('/:id/mark-paid', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceService.markAsPaid(id, userId);

    // Serialize response (convert Decimal to numbers, dates to ISO strings)
    try {
      const serializedInvoice = {
        ...invoice,
        grandTotal: typeof invoice.grandTotal === 'object' && invoice.grandTotal !== null
          ? parseFloat(invoice.grandTotal.toString())
          : invoice.grandTotal,
        taxRate: typeof invoice.taxRate === 'object' && invoice.taxRate !== null
          ? parseFloat(invoice.taxRate.toString())
          : invoice.taxRate || 0,
        issueDate: invoice.issueDate instanceof Date
          ? invoice.issueDate.toISOString()
          : invoice.issueDate,
        dueDate: invoice.dueDate instanceof Date
          ? invoice.dueDate.toISOString()
          : invoice.dueDate,
        paidAt: invoice.paidAt instanceof Date
          ? invoice.paidAt.toISOString()
          : invoice.paidAt
            ? String(invoice.paidAt)
            : null,
        createdAt: invoice.createdAt instanceof Date
          ? invoice.createdAt.toISOString()
          : invoice.createdAt,
        updatedAt: invoice.updatedAt instanceof Date
          ? invoice.updatedAt.toISOString()
          : invoice.updatedAt,
      };

      console.log('[POST /invoices/:id/mark-paid] Successfully serialized invoice response');
      res.json(serializedInvoice);
    } catch (serializeError: any) {
      console.error('[POST /invoices/:id/mark-paid] Error serializing invoice response:', serializeError);
      console.error('[POST /invoices/:id/mark-paid] Invoice object keys:', Object.keys(invoice || {}));
      console.error('[POST /invoices/:id/mark-paid] Invoice paidAt type:', typeof invoice?.paidAt);
      console.error('[POST /invoices/:id/mark-paid] Invoice paidAt value:', invoice?.paidAt);
      throw new Error(`Failed to serialize invoice response: ${serializeError?.message || 'Unknown serialization error'}`);
    }
  } catch (error: any) {
    // Always log full error details (will appear in Render logs)
    console.error('[POST /invoices/:id/mark-paid] ========== ERROR START ==========');
    console.error('[POST /invoices/:id/mark-paid] Error marking invoice as paid');
    console.error('[POST /invoices/:id/mark-paid] Invoice ID:', req.params.id);
    console.error('[POST /invoices/:id/mark-paid] User ID:', req.user?.uid);
    console.error('[POST /invoices/:id/mark-paid] Error name:', error?.name);
    console.error('[POST /invoices/:id/mark-paid] Error message:', error?.message);
    console.error('[POST /invoices/:id/mark-paid] Error stack:', error?.stack);
    console.error('[POST /invoices/:id/mark-paid] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[POST /invoices/:id/mark-paid] ========== ERROR END ==========');

    if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
      return res.status(error.message === 'Unauthorized' ? 403 : 404).json({ error: error.message });
    }

    // Return error message even in production (it's logged above)
    const errorResponse: any = {
      error: error.message || 'Internal server error',
    };

    // Include details in production for debugging (since we're debugging)
    errorResponse.details = process.env.NODE_ENV === 'development' ? error.stack : `Check Render logs for invoice ${req.params.id}`;
    errorResponse.invoiceId = req.params.id;

    res.status(500).json(errorResponse);
  }
});

/**
 * DELETE /invoices/:id
 * Delete invoice
 */
router.delete('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceV1.getInvoice(userId, id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if ((invoice as any).status !== ('DRAFT' as any)) {
      return res.status(409).json({ error: 'Only drafts can be deleted. Issued invoices must be voided.' });
    }

    await prisma.invoice.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to delete invoice' });
  }
});

/**
 * POST /invoices/:id/send-reminder
 * Send invoice reminder email to customer
 */
router.post('/:id/send-reminder', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the invoice
    const invoice = await invoiceService.getInvoiceById(id, userId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Extract customer email
    const toInfo = invoice.toInfo as unknown as InvoiceRecipient;
    const customerEmail = toInfo?.email;
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email not found on invoice' });
    }

    // Call notification service to send reminder
    const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

    try {
      const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'invoice-reminder',
          email: customerEmail,
          subject: `Invoice Reminder: ${invoice.invoiceNumber}`,
          template: 'invoice reminder template',
          variables: {
            invoiceNumber: invoice.invoiceNumber,
            amount: parseFloat(invoice.grandTotal?.toString() || '0'),
            currency: invoice.currency || 'USD',
            dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : invoice.dueDate,
            customerName: (invoice.toInfo as unknown as InvoiceRecipient)?.name || 'Valued Customer',
          },
        }),
      });

      if (!notificationResponse.ok) {
        const errorData = await notificationResponse.text();
        console.error('[send-reminder] Notification service error:', errorData);
        return res.status(500).json({
          error: 'Failed to send reminder email',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        });
      }

      const result = await notificationResponse.json();

      res.json({
        success: true,
        message: `Invoice reminder sent to ${customerEmail}`,
        messageId: result.messageId,
      });
    } catch (notificationError: any) {
      console.error('[send-reminder] Error calling notification service:', notificationError);
      return res.status(500).json({
        error: 'Failed to send reminder email',
        details: process.env.NODE_ENV === 'development' ? notificationError.message : undefined
      });
    }
  } catch (error: any) {
    console.error('[send-reminder] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

