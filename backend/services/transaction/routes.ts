import { Router, Request, Response } from 'express';
import { TransactionManager } from '../core-banking/src/transaction-manager';
import { FeeEngine } from '../core-banking/src/fee-engine';
import { verifyFirebaseToken, requireKYC, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import { Decimal } from 'decimal.js';
import { prisma } from '../../common/prisma';

const router = Router();
const transactionManager = new TransactionManager(prisma);
const feeEngine = new FeeEngine(prisma);

/**
 * POST /api/transaction/transfer
 * Execute a transfer between accounts
 */
router.post('/transfer', verifyFirebaseToken, requireKYC, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { fromAccountId, toAccountId, amount, currency, description, idempotencyKey } = req.body;

    // Validation
    if (!fromAccountId || !toAccountId || !amount || !currency) {
      throw new ValidationError('fromAccountId, toAccountId, amount, and currency are required');
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    // Verify the from account belongs to the authenticated user
    const fromAccount = await prisma.account.findFirst({
      where: { id: fromAccountId, userId },
    });

    if (!fromAccount) {
      return res.status(404).json({ error: 'Source account not found or unauthorized' });
    }

    // Execute the transfer
    const transfer = await transactionManager.executeTransfer({
      fromAccountId,
      toAccountId,
      amount: parseFloat(amount),
      currency,
      description,
      idempotencyKey,
    });

    res.status(201).json({ transfer });
  } catch (error: any) {
    console.error('Error executing transfer:', error);
    
    if (error.message.includes('limit exceeded')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('Insufficient balance')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || 'Failed to execute transfer' });
  }
});

/**
 * GET /api/transaction/transfers
 * Get all transfers for the authenticated user
 */
router.get('/transfers', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { limit = '50', offset = '0', status } = req.query;

    // Get all user's accounts
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = accounts.map(a => a.id);

    // Build where clause
    const where: any = {
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    };

    if (status) {
      where.status = status;
    }

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        fromAccount: {
          select: {
            id: true,
            currency: true,
            type: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            currency: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.transfer.count({ where });

    res.status(200).json({
      transfers,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transfers' });
  }
});

/**
 * GET /api/transaction/transfers/:id
 * Get a specific transfer by ID
 */
router.get('/transfers/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { id } = req.params;

    // Get all user's accounts
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = accounts.map(a => a.id);

    const transfer = await prisma.transfer.findFirst({
      where: {
        id,
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
      include: {
        fromAccount: true,
        toAccount: true,
        appliedFees: {
          include: {
            appliedRules: {
              include: {
                feeRule: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.status(200).json({ transfer });
  } catch (error: any) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transfer' });
  }
});

/**
 * POST /api/transaction/calculate-fees
 * Calculate fees for a potential transfer
 */
router.post('/calculate-fees', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency, transactionType, fromCountry, toCountry, userTier } = req.body;

    if (!amount || !currency || !transactionType) {
      throw new ValidationError('amount, currency, and transactionType are required');
    }

    const feeCalculation = await feeEngine.calculateFees({
      amount: new Decimal(amount),
      currency,
      transactionType,
      fromCountry: fromCountry || 'US',
      toCountry: toCountry || 'US',
      userTier,
    });

    res.status(200).json({
      feeAmount: feeCalculation.feeAmount.toString(),
      breakdown: {
        fixedFees: feeCalculation.breakdown.fixedFees.toString(),
        percentageFees: feeCalculation.breakdown.percentageFees.toString(),
        discounts: feeCalculation.breakdown.discounts.toString(),
        total: feeCalculation.breakdown.total.toString(),
      },
      appliedRules: feeCalculation.appliedRules,
    });
  } catch (error: any) {
    console.error('Error calculating fees:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate fees' });
  }
});

export default router;
