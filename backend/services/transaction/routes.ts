import { Router, Request, Response } from 'express';
import { TransactionManager } from '../core-banking/src/transaction-manager';
import { FeeEngine } from '../core-banking/src/fee-engine';
import { verifyFirebaseToken, requireKYC, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import { transactionLimiter } from '../../gateway/rateLimiter';
import { validateRequest, transactionSchemas } from '../../common/validation-schemas';
import { logFinancialTransaction, AuditAction } from '../../common/audit-logger';
import Decimal from 'decimal.js';
import { prisma } from '../../common/prisma';
import { TransferService } from './transferService';

const router = Router();
const transactionManager = new TransactionManager(prisma);
const feeEngine = new FeeEngine(prisma);
const transferService = new TransferService(prisma);

function mapTransfer(transfer: any) {
  if (!transfer) return transfer;

  const {
    Account_Transfer_fromAccountIdToAccount,
    Account_Transfer_toAccountIdToAccount,
    AppliedFee,
    ...rest
  } = transfer;

  const appliedFees = AppliedFee
    ? AppliedFee.map((fee: any) => {
        const { AppliedRuleInstance, ...feeRest } = fee;
        const appliedRules = AppliedRuleInstance
          ? AppliedRuleInstance.map((rule: any) => {
              const { FeeRule, ...ruleRest } = rule;
              return { ...ruleRest, feeRule: FeeRule };
            })
          : AppliedRuleInstance;

        return {
          ...feeRest,
          appliedRules,
        };
      })
    : AppliedFee;

  return {
    ...rest,
    fromAccount: Account_Transfer_fromAccountIdToAccount,
    toAccount: Account_Transfer_toAccountIdToAccount,
    appliedFees,
  };
}

/**
 * POST /api/transaction/quote
 * Get a transfer quote (includes fees and exchange rates)
 */
router.post('/quote',
  verifyFirebaseToken,
  validateRequest(transactionSchemas.getQuote),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const quote = await transferService.getQuote({
        userId: userId!,
        ...req.body
      });
      res.status(200).json({ quote });
    } catch (error: any) {
      console.error('Error getting transfer quote:', error);
      res.status(400).json({ error: error.message || 'Failed to get quote' });
    }
  }
);

/**
 * POST /api/transaction/execute-with-quote
 * Execute transfer using a previously obtained quote
 */
router.post('/execute-with-quote',
  verifyFirebaseToken,
  requireKYC,
  transactionLimiter,
  validateRequest(transactionSchemas.executeWithQuote),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { quote, quoteId, idempotencyKey } = req.body;

      let resolvedQuote = quote;
      let auditAccountId = quote?.fromAccountId;

      if (quoteId) {
        resolvedQuote = { id: quoteId };
        const storedQuote = await prisma.fxQuote.findUnique({ where: { id: quoteId } });
        auditAccountId = storedQuote?.fromAccountId;
      }

      const transfer = await transferService.executeTransferWithQuote(
        userId!,
        resolvedQuote,
        idempotencyKey,
        {
          userId,
          accountId: auditAccountId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          correlationId: req.headers['x-correlation-id'] as string,
        }
      );

      res.status(201).json({ transfer });
    } catch (error: any) {
      console.error('Error executing transfer with quote:', error);
      res.status(400).json({ error: error.message || 'Failed to execute transfer' });
    }
  }
);

/**
 * POST /api/transaction/transfer
 * Execute a transfer between accounts
 * REQUIRES: idempotencyKey to prevent duplicate transactions
 */
router.post('/transfer',
  verifyFirebaseToken,
  requireKYC,
  transactionLimiter,
  validateRequest(transactionSchemas.createTransfer),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { fromAccountId, toAccountId, amount, currency, description, idempotencyKey } = req.body;

      // Verify the from account belongs to the authenticated user
      const fromAccount = await prisma.account.findFirst({
        where: { id: fromAccountId, userId },
      });

      if (!fromAccount) {
        return res.status(404).json({ error: 'Source account not found or unauthorized' });
      }

      // Log transfer initiation
      await logFinancialTransaction(
        AuditAction.TRANSFER_INITIATED,
        'pending',
        fromAccountId,
        userId!,
        amount.toString(),
        currency,
        description || 'Transfer',
        {
          userId,
          accountId: fromAccountId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          correlationId: req.headers['x-correlation-id'] as string,
        }
      );

      // Execute the transfer
      const transfer = await transactionManager.executeTransfer({
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount),
        currency,
        description,
        idempotencyKey,
        userId,
        auditContext: {
          userId,
          accountId: fromAccountId,
          transactionId: 'pending',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          correlationId: req.headers['x-correlation-id'] as string,
        },
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

    const accountIds = accounts.map((a: any) => a.id);

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
        Account_Transfer_fromAccountIdToAccount: {
          select: {
            id: true,
            currency: true,
            type: true,
          },
        },
        Account_Transfer_toAccountIdToAccount: {
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
      transfers: transfers.map((transfer: any) => mapTransfer(transfer)),
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

    const accountIds = accounts.map((a: any) => a.id);

    const transfer = await prisma.transfer.findFirst({
      where: {
        id,
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
      include: {
        Account_Transfer_fromAccountIdToAccount: true,
        Account_Transfer_toAccountIdToAccount: true,
        AppliedFee: {
          include: {
            AppliedRuleInstance: {
              include: {
                FeeRule: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.status(200).json({ transfer: mapTransfer(transfer) });
  } catch (error: any) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transfer' });
  }
});

/**
 * POST /api/transaction/calculate-fees
 * Calculate fees for a potential transfer
 */
router.post('/calculate-fees',
  verifyFirebaseToken,
  validateRequest(transactionSchemas.calculateFees),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency, transactionType, fromCountry, toCountry, userTier } = req.body;

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
