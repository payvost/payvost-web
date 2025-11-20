import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from './src/invoice-service';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';

const router = Router();
const prisma = new PrismaClient();
const invoiceService = new InvoiceService(prisma);

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

    const { status, limit, offset } = req.query;
    const result = await invoiceService.listUserInvoices(userId, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
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
 * GET /invoices/:id
 * Get invoice by ID
 */
router.get('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    const invoice = await invoiceService.getInvoiceById(id, userId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /invoices/public/:id
 * Get public invoice (no auth required)
 */
router.get('/public/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getPublicInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or not public' });
    }

    res.json(invoice);
  } catch (error: any) {
    console.error('Error getting public invoice:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /invoices
 * Create new invoice
 */
router.post('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceService.createInvoice({
      ...req.body,
      userId,
      createdBy: userId,
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(400).json({ error: error.message || 'Invalid invoice data' });
  }
});

/**
 * PATCH /invoices/:id
 * Update invoice
 */
router.patch('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceService.updateInvoice(id, userId, req.body);
    res.json(invoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Invalid update data' });
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
    res.json(invoice);
  } catch (error: any) {
    console.error('Error marking invoice as paid:', error);
    if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to mark as paid' });
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

    await invoiceService.deleteInvoice(id, userId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to delete invoice' });
  }
});

export default router;

