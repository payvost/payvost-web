import { Router, Request, Response } from 'express';
import { prisma } from '../../common/prisma';
import { InvoiceV1Service } from './src/invoice-v1-service';

const router = Router();
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

function serializePublic(invoice: any, token: string) {
  const grandTotal = typeof invoice?.grandTotal === 'object' && invoice?.grandTotal !== null
    ? parseFloat(invoice.grandTotal.toString())
    : Number(invoice?.grandTotal || 0);
  const taxRate = typeof invoice?.taxRate === 'object' && invoice?.taxRate !== null
    ? parseFloat(invoice.taxRate.toString())
    : Number(invoice?.taxRate || 0);

  const fromInfo = invoice?.fromInfo || {};
  const toInfo = invoice?.toInfo || {};
  const manualBankDetails = invoice?.manualBankDetails || null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    kind: invoice.kind,
    status: titleCaseStatus(invoice.status),
    currency: invoice.currency,
    issueDate: invoice.issueDate instanceof Date ? invoice.issueDate.toISOString() : invoice.issueDate,
    dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice.dueDate,
    createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice.createdAt,
    updatedAt: invoice.updatedAt instanceof Date ? invoice.updatedAt.toISOString() : invoice.updatedAt,
    paidAt: invoice.paidAt instanceof Date ? invoice.paidAt.toISOString() : invoice.paidAt ?? null,
    taxRate,
    grandTotal,
    items: invoice.items || [],
    notes: invoice.notes || null,
    paymentMethod: String(invoice.paymentMethod || 'PAYVOST').toLowerCase(),
    manualBankName: manualBankDetails?.bankName || '',
    manualAccountName: manualBankDetails?.accountName || '',
    manualAccountNumber: manualBankDetails?.accountNumber || '',
    manualOtherDetails: manualBankDetails?.otherDetails || '',
    fromName: fromInfo?.name || '',
    fromAddress: fromInfo?.address || '',
    fromEmail: fromInfo?.email || '',
    toName: toInfo?.name || '',
    toAddress: toInfo?.address || '',
    toEmail: toInfo?.email || '',
    publicLinkToken: token,
  };
}

/**
 * GET /public/invoices/resolve/:legacyId
 * Resolve a legacy Firestore invoice document ID into a public token (if public).
 * Used for redirects from old /invoice/:id links.
 */
router.get('/resolve/:legacyId', async (req: Request, res: Response) => {
  try {
    const { legacyId } = req.params;
    if (!legacyId) return res.status(400).json({ error: 'Missing legacyId' });

    const resolved = await invoiceV1.resolveLegacyToToken(legacyId);
    if (!resolved) return res.status(404).json({ error: 'No active public link for this invoice' });

    return res.json({
      invoiceId: resolved.invoiceId,
      token: resolved.token,
      url: `/i/${resolved.token}`,
    });
  } catch (error: any) {
    console.error('[Public Invoice Resolve] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /public/invoices/:token
 * Public invoice read via unguessable token.
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const result = await invoiceV1.getPublicInvoiceByToken(token);
    if (!result) return res.status(404).json({ error: 'Invoice not found' });

    return res.json(serializePublic(result.invoice, result.link.token));
  } catch (error: any) {
    console.error('[Public Invoice] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
