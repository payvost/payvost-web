import express, { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from './invoice-service';
import RecurringInvoiceProcessor from './recurring-invoice-processor';
import { processRecurringInvoices, getSchedulerStatus } from './scheduler';
import admin from 'firebase-admin';

const router = Router();
const prisma = new PrismaClient();
const invoiceService = new InvoiceService(prisma);
const recurringInvoiceProcessor = new RecurringInvoiceProcessor(prisma);

// Middleware to verify Firebase token
const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// GET /api/invoices - Get all invoices for a user
router.get('/invoices', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const invoices = await invoiceService.getInvoicesByUserId(userId);
    res.json(invoices);
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id - Get a specific invoice
router.get('/invoices/:id', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;
    const invoice = await invoiceService.getInvoiceById(id, userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('GET /api/invoices/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /api/invoices - Create a new invoice
router.post('/invoices', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const payload = req.body;

    const invoice = await invoiceService.createInvoice({
      ...payload,
      userId,
      createdBy: userId,
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// PUT /api/invoices/:id - Update an invoice
router.put('/invoices/:id', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;
    const payload = req.body;

    const invoice = await invoiceService.updateInvoice(id, userId, payload);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('PUT /api/invoices/:id error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// POST /api/invoices/:id/mark-paid - Mark invoice as paid
router.post('/invoices/:id/mark-paid', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;

    const invoice = await invoiceService.markAsPaid(id, userId);

    res.json(invoice);
  } catch (error) {
    console.error('POST /api/invoices/:id/mark-paid error:', error);
    if ((error as any).message === 'Invoice not found') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if ((error as any).message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

// POST /api/invoices/:id/send-reminder - Send invoice reminder email
router.post('/invoices/:id/send-reminder', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;

    const invoice = await invoiceService.getInvoiceById(id, userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Parse toInfo JSON field
    const toInfo = typeof invoice.toInfo === 'string' 
      ? JSON.parse(invoice.toInfo) 
      : invoice.toInfo as any;
    
    const customerEmail = toInfo?.email;
    
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email not found' });
    }

    // Call notification service to send reminder
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
    
    const reminderPayload = {
      type: 'invoice-reminder',
      email: customerEmail,
      subject: `Invoice Reminder: ${invoice.invoiceNumber}`,
      template: 'invoice reminder template',
      variables: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.grandTotal.toString(),
        currency: invoice.currency || 'USD',
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        customerName: toInfo?.name || 'Valued Customer',
      },
    };

    const notificationResponse = await fetch(`${notificationServiceUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminderPayload),
    });

    if (!notificationResponse.ok) {
      const error = await notificationResponse.text();
      console.error('Notification service error:', error);
      return res.status(500).json({ error: 'Failed to send reminder email' });
    }

    res.json({
      success: true,
      message: `Invoice reminder sent to ${customerEmail}`,
      email: customerEmail,
    });
  } catch (error) {
    console.error('POST /api/invoices/:id/send-reminder error:', error);
    if ((error as any).message === 'Invoice not found') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if ((error as any).message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to send invoice reminder' });
  }
});

// DELETE /api/invoices/:id - Delete an invoice
router.delete('/invoices/:id', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;

    const success = await invoiceService.deleteInvoice(id, userId);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/invoices/:id error:', error);
    if ((error as any).message === 'Invoice not found') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if ((error as any).message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// POST /api/invoices/recurring/process - Process all recurring invoices (admin/internal only)
// Should be called via a scheduled task or cron job
router.post('/invoices/recurring/process', async (req: Request, res: Response) => {
  try {
    // Verify this is an internal request (could add additional auth checks here)
    const apiKey = req.headers['x-api-key'];
    const internalSecret = process.env.INTERNAL_API_SECRET || 'default-secret';
    
    if (apiKey !== internalSecret && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[Invoice Routes] Starting recurring invoice processing');
    const generatedInvoices = await recurringInvoiceProcessor.processRecurringInvoices();
    
    res.json({
      success: true,
      message: `Processed recurring invoices. Generated ${generatedInvoices.length} new invoices.`,
      data: generatedInvoices,
    });
  } catch (error) {
    console.error('[Invoice Routes] Error processing recurring invoices:', error);
    res.status(500).json({ error: 'Failed to process recurring invoices' });
  }
});

// GET /api/invoices/recurring/stats - Get recurring invoice statistics (admin only)
router.get('/invoices/recurring/stats', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    
    const recurringSnapshot = await db
      .collection('businessInvoices')
      .where('isRecurring', '==', true)
      .get();

    const stats = {
      totalRecurringInvoices: recurringSnapshot.size,
      byFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      byStatus: {
        active: 0,
        paused: 0,
      },
    };

    recurringSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const frequency = data.recurringFrequency as 'daily' | 'weekly' | 'monthly';
      if (frequency in stats.byFrequency) {
        (stats.byFrequency as any)[frequency]++;
      }
      
      const isActive = !data.recurringEndDate || new Date(data.recurringEndDate.toDate ? data.recurringEndDate.toDate() : data.recurringEndDate) > new Date();
      stats.byStatus[isActive ? 'active' : 'paused']++;
    });

    res.json(stats);
  } catch (error) {
    console.error('GET /api/invoices/recurring/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring invoice stats' });
  }
});

// GET /api/invoices/recurring/scheduler/status - Get scheduler status
router.get('/invoices/recurring/scheduler/status', async (req: Request, res: Response) => {
  try {
    const status = getSchedulerStatus();
    res.json(status);
  } catch (error) {
    console.error('GET /api/invoices/recurring/scheduler/status error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduler status' });
  }
});

// POST /api/invoices/recurring/scheduler/trigger - Manually trigger recurring invoice processing
router.post('/invoices/recurring/scheduler/trigger', async (req: Request, res: Response) => {
  try {
    // Verify this is an internal request
    const apiKey = req.headers['x-api-key'];
    const internalSecret = process.env.INTERNAL_API_SECRET || 'default-secret';
    
    if (apiKey !== internalSecret && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await processRecurringInvoices();
    res.json(result);
  } catch (error) {
    console.error('POST /api/invoices/recurring/scheduler/trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger scheduler' });
  }
});

export default router;

