import { Router, Request, Response } from 'express';
import { InvoiceService } from './src/invoice-service';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { prisma } from '../../common/prisma';
import admin from '../../firebase';

const router = Router();
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
 * Returns invoice data with business profile if available
 */
router.get('/public/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[Public Invoice] Fetching invoice: ${id}`);
    
    let invoice;
    try {
      invoice = await invoiceService.getPublicInvoice(id);
    } catch (serviceError: any) {
      console.error('[Public Invoice] Service error:', serviceError);
      console.error('[Public Invoice] Service error stack:', serviceError?.stack);
      
      // If it's a Firebase initialization error, return a more helpful message
      if (serviceError?.message?.includes('not initialized') || 
          serviceError?.message?.includes('not available')) {
        return res.status(503).json({ 
          error: 'Service temporarily unavailable',
          details: 'Database service is not properly configured'
        });
      }
      
      // Re-throw to be caught by outer catch
      throw serviceError;
    }
    
    if (!invoice) {
      console.log(`[Public Invoice] Invoice not found: ${id}`);
      return res.status(404).json({ error: 'Invoice not found or not public' });
    }
    
    console.log(`[Public Invoice] Invoice found: ${id}, type: ${invoice.invoiceType}`);

    // Try to fetch business profile if businessId exists
    let businessProfile = null;
    if (invoice.businessId) {
      try {
        const db = admin.firestore();
        
        // Query users collection for business profile
        const usersSnapshot = await db.collection('users')
          .where('businessProfile.id', '==', invoice.businessId)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          const userData = usersSnapshot.docs[0].data();
          businessProfile = userData.businessProfile || null;
        }
      } catch (profileError) {
        console.warn('Could not fetch business profile:', profileError);
        // Continue without business profile
      }
    }

    // Convert Prisma Decimal objects to numbers and dates to ISO strings for JSON serialization
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
      createdAt: invoice.createdAt instanceof Date
        ? invoice.createdAt.toISOString()
        : invoice.createdAt,
      updatedAt: invoice.updatedAt instanceof Date
        ? invoice.updatedAt.toISOString()
        : invoice.updatedAt,
      businessProfile,
    };

    res.json(serializedInvoice);
  } catch (error: any) {
    console.error('Error getting public invoice:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    
    // Serialize response (convert Decimal to numbers, dates to ISO strings)
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
        : invoice.paidAt,
      createdAt: invoice.createdAt instanceof Date
        ? invoice.createdAt.toISOString()
        : invoice.createdAt,
      updatedAt: invoice.updatedAt instanceof Date
        ? invoice.updatedAt.toISOString()
        : invoice.updatedAt,
    };
    
    res.json(serializedInvoice);
  } catch (error: any) {
    console.error('[POST /invoices/:id/mark-paid] Error marking invoice as paid:', error);
    console.error('[POST /invoices/:id/mark-paid] Invoice ID:', req.params.id);
    console.error('[POST /invoices/:id/mark-paid] User ID:', req.user?.uid);
    console.error('[POST /invoices/:id/mark-paid] Error message:', error?.message);
    console.error('[POST /invoices/:id/mark-paid] Error stack:', error?.stack);
    
    if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
      return res.status(error.message === 'Unauthorized' ? 403 : 404).json({ error: error.message });
    }
    
    // Return more detailed error in development
    const errorResponse: any = { 
      error: error.message || 'Internal server error',
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.stack;
      errorResponse.invoiceId = req.params.id;
      errorResponse.userId = req.user?.uid;
    }
    
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

