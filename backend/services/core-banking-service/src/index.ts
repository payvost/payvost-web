import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import cors from 'cors';

const app = express();
const PORT = process.env.CORE_BANKING_SERVICE_PORT || 3012;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Prisma
const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Internal service authentication
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || process.env.CORE_BANKING_SERVICE_API_KEY;

function verifyInternalAuth(req: Request, res: Response, next: () => void) {
  // Always require authentication, even in development
  if (!INTERNAL_API_KEY) {
    console.error('INTERNAL_API_KEY or CORE_BANKING_SERVICE_API_KEY must be set');
    return res.status(500).json({ error: 'Internal service authentication not configured' });
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }
  
  next();
}

/**
 * Transaction Type Enum
 */
const TransactionTypeEnum = {
  INTERNAL_TRANSFER: 'INTERNAL_TRANSFER',
  EXTERNAL_TRANSFER: 'EXTERNAL_TRANSFER',
  CARD_PAYMENT: 'CARD_PAYMENT',
  ATM_WITHDRAWAL: 'ATM_WITHDRAWAL',
  DEPOSIT: 'DEPOSIT',
  CURRENCY_EXCHANGE: 'CURRENCY_EXCHANGE',
} as const;

/**
 * Idempotent funds transfer between accounts using Prisma transactions.
 * - Ensures idempotency via idempotencyKey stored on Transfer
 * - Locks account rows using FOR UPDATE to avoid race conditions
 */
async function transferFunds(
  fromAccountId: string,
  toAccountId: string,
  amount: number | string,
  currency: string,
  idempotencyKey?: string,
  description?: string
): Promise<{ success: boolean; transferId?: string; error?: string }> {
  const amountStr = typeof amount === 'string' ? amount : amount.toString();

  try {
    // Quick idempotency check outside tx to avoid unnecessary work
    if (idempotencyKey) {
      const existing = await prisma.transfer.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return { success: true, transferId: existing.id };
      }
    }

    const transfer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the two accounts to perform safe balance checks and updates
      const lockedRows: Array<{ id: string; balance: string }> = await tx.$queryRaw`
        SELECT id, balance
        FROM "Account"
        WHERE id IN (${fromAccountId}, ${toAccountId})
        FOR UPDATE
      ` as any;

      const fromRow = lockedRows.find((r) => r.id === fromAccountId);
      const toRow = lockedRows.find((r) => r.id === toAccountId);

      if (!fromRow || !toRow) {
        throw new Error('Account not found or currency mismatch');
      }

      const fromBalance = parseFloat(fromRow.balance);
      const toBalance = parseFloat(toRow.balance);
      const amt = parseFloat(amountStr);

      if (isNaN(amt) || amt <= 0) {
        throw new Error('Invalid transfer amount');
      }

      if (fromBalance < amt) {
        throw new Error('Insufficient funds');
      }

      // Create transfer record (pending -> completed)
      const created = await tx.transfer.create({
        data: {
          fromAccountId,
          toAccountId,
          amount: amountStr,
          currency,
          status: 'completed',
          type: TransactionTypeEnum.INTERNAL_TRANSFER as any,
          idempotencyKey: idempotencyKey ?? null,
          description: description ?? null,
        },
      });

      // Update balances
      const newFrom = (fromBalance - amt).toFixed(8);
      const newTo = (toBalance + amt).toFixed(8);

      await tx.account.update({ where: { id: fromAccountId }, data: { balance: newFrom } });
      await tx.account.update({ where: { id: toAccountId }, data: { balance: newTo } });

      // Ledger entries
      await tx.ledgerEntry.create({
        data: {
          accountId: fromAccountId,
          amount: `-${amountStr}`,
          balanceAfter: newFrom,
          type: 'debit',
          description: description ?? 'transfer',
          referenceId: created.id,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: toAccountId,
          amount: amountStr,
          balanceAfter: newTo,
          type: 'credit',
          description: description ?? 'transfer',
          referenceId: created.id,
        },
      });

      return created;
    });

    return { success: true, transferId: transfer.id };
  } catch (err: any) {
    console.error('[Core Banking Service] Transfer error:', err);
    return { success: false, error: err.message ?? String(err) };
  }
}

/**
 * Get account balance
 */
async function getAccountBalance(accountId: string) {
  const res = await prisma.account.findUnique({ 
    where: { id: accountId }, 
    select: { balance: true, currency: true } 
  });
  if (!res) return null;
  return res;
}

/**
 * Create account
 */
async function createAccount(userId: string, currency: string) {
  const res = await prisma.account.create({ 
    data: { userId, currency, balance: '0' } 
  });
  return res.id;
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'core-banking-service',
    timestamp: new Date().toISOString(),
    prismaConnected: true,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Payvost Core Banking Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      transfer: 'POST /transfer',
      balance: 'GET /balance/:accountId',
      createAccount: 'POST /account',
    },
  });
});

/**
 * POST /transfer
 * Transfer funds between accounts
 */
app.post('/transfer', verifyInternalAuth, async (req: Request, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, currency, idempotencyKey, description } = req.body;

    if (!fromAccountId || !toAccountId || !amount || !currency) {
      return res.status(400).json({ 
        error: 'fromAccountId, toAccountId, amount, and currency are required' 
      });
    }

    const result = await transferFunds(
      fromAccountId,
      toAccountId,
      amount,
      currency,
      idempotencyKey,
      description
    );

    if (!result.success) {
      return res.status(400).json({ 
        error: result.error || 'Transfer failed',
        success: false 
      });
    }

    res.status(200).json({
      success: true,
      transferId: result.transferId,
    });
  } catch (error: any) {
    console.error('[Core Banking Service] Error processing transfer:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process transfer',
      success: false 
    });
  }
});

/**
 * GET /balance/:accountId
 * Get account balance
 */
app.get('/balance/:accountId', verifyInternalAuth, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const balance = await getAccountBalance(accountId);

    if (!balance) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.status(200).json({
      accountId,
      balance: balance.balance,
      currency: balance.currency,
    });
  } catch (error: any) {
    console.error('[Core Banking Service] Error fetching balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
});

/**
 * POST /account
 * Create a new account
 */
app.post('/account', verifyInternalAuth, async (req: Request, res: Response) => {
  try {
    const { userId, currency } = req.body;

    if (!userId || !currency) {
      return res.status(400).json({ error: 'userId and currency are required' });
    }

    const accountId = await createAccount(userId, currency);

    res.status(201).json({
      success: true,
      accountId,
    });
  } catch (error: any) {
    console.error('[Core Banking Service] Error creating account:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Core Banking Service] Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`[Core Banking Service] Running on port ${PORT}`);
  console.log(`[Core Banking Service] Environment: ${NODE_ENV}`);
  console.log(`[Core Banking Service] Internal API key configured: ${!!INTERNAL_API_KEY}`);
  console.log(`[Core Banking Service] Endpoints:`);
  console.log(`  - GET http://localhost:${PORT}/health`);
  console.log(`  - POST http://localhost:${PORT}/transfer`);
  console.log(`  - GET http://localhost:${PORT}/balance/:accountId`);
  console.log(`  - POST http://localhost:${PORT}/account`);
});

