import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { prisma } from '../../common/prisma';
import admin from 'firebase-admin';

const router = Router();

/**
 * GET /api/business/dashboard
 * Get business dashboard data
 */
router.get('/dashboard', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's business account (first BUSINESS type account)
    const businessAccount = await prisma.account.findFirst({
      where: {
        userId,
        type: 'BUSINESS',
      },
    });

    if (!businessAccount) {
      return res.status(404).json({ error: 'Business account not found' });
    }

    const accountBalance = Number(businessAccount.balance);
    const accountCurrency = businessAccount.currency;

    // Get pending payouts (external transactions with PAYOUT type and pending status)
    const pendingPayouts = await prisma.externalTransaction.findMany({
      where: {
        userId,
        type: 'PAYOUT',
        status: 'PENDING',
      },
      select: {
        amount: true,
      },
    });

    const pendingPayoutsTotal = pendingPayouts.reduce((sum: number, p: { amount: any }) => sum + Number(p.amount), 0);
    const pendingPayoutsCount = pendingPayouts.length;

    // Get open invoices (business invoices with PENDING or OVERDUE status)
    const openInvoices = await prisma.invoice.findMany({
      where: {
        createdBy: userId,
        invoiceType: 'BUSINESS',
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
      },
      select: {
        grandTotal: true,
      },
    });

    const openInvoicesCount = openInvoices.length;
    const openInvoicesAmount = openInvoices.reduce((sum: number, inv: { grandTotal: any }) => sum + Number(inv.grandTotal), 0);

    // Get new customers (users who made transactions in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await prisma.transfer.findMany({
      where: {
        Account_Transfer_toAccountIdToAccount: {
          userId,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        Account_Transfer_fromAccountIdToAccount: {
          select: {
            userId: true,
          },
        },
      },
      distinct: ['fromAccountId'],
    });

    const newCustomers = recentTransactions.length;
    const previousWeekCustomers = await prisma.transfer.findMany({
      where: {
        Account_Transfer_toAccountIdToAccount: {
          userId,
        },
        createdAt: {
          gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: sevenDaysAgo,
        },
      },
      select: {
        Account_Transfer_fromAccountIdToAccount: {
          select: {
            userId: true,
          },
        },
      },
      distinct: ['fromAccountId'],
    });

    const newCustomersChange = newCustomers - previousWeekCustomers.length;

    // Get recent transactions
    const recentTxs = await prisma.transfer.findMany({
      where: {
        OR: [
          { Account_Transfer_fromAccountIdToAccount: { userId } },
          { Account_Transfer_toAccountIdToAccount: { userId } },
        ],
      },
      include: {
        Account_Transfer_fromAccountIdToAccount: true,
        Account_Transfer_toAccountIdToAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const recentTransactionsData = recentTxs.map((tx: any) => ({
      id: tx.id,
      type: tx.Account_Transfer_toAccountIdToAccount.userId === userId ? 'Credit' : 'Debit',
      description: tx.description || `${tx.type} Transaction`,
      amount: tx.Account_Transfer_toAccountIdToAccount.userId === userId ? Number(tx.amount) : -Number(tx.amount),
      date: tx.createdAt.toISOString(),
      status: tx.status === 'COMPLETED' ? 'Completed' : tx.status === 'PENDING' ? 'Pending' : 'Failed',
      currency: tx.currency,
    }));

    res.json({
      accountBalance,
      accountCurrency,
      accountName: 'Business Account', // Could be fetched from user profile
      pendingPayouts: Number(pendingPayoutsTotal),
      pendingPayoutsCount,
      openInvoices: openInvoicesCount,
      openInvoicesAmount: Number(openInvoicesAmount),
      newCustomers,
      newCustomersChange,
      recentTransactions: recentTransactionsData,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/business/transactions
 * Get business transactions with filtering
 */
router.get('/transactions', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, type, search, limit = '50', offset = '0' } = req.query;

    const where: any = {
      OR: [
        { Account_Transfer_fromAccountIdToAccount: { userId } },
        { Account_Transfer_toAccountIdToAccount: { userId } },
      ],
    };

    if (status && status !== 'all') {
      where.status = status === 'Completed' ? 'COMPLETED' : status === 'Pending' ? 'PENDING' : 'FAILED';
    }

    if (search) {
      where.description = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const transactions = await prisma.transfer.findMany({
      where,
      include: {
        Account_Transfer_fromAccountIdToAccount: true,
        Account_Transfer_toAccountIdToAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const formattedTransactions = transactions.map((tx: any) => ({
      id: tx.id,
      type: tx.Account_Transfer_toAccountIdToAccount.userId === userId ? 'Credit' : 'Debit',
      description: tx.description || `${tx.type} Transaction`,
      amount: tx.Account_Transfer_toAccountIdToAccount.userId === userId ? Number(tx.amount) : -Number(tx.amount),
      date: tx.createdAt.toISOString(),
      status: tx.status === 'COMPLETED' ? 'Completed' : tx.status === 'PENDING' ? 'Pending' : 'Failed',
      currency: tx.currency,
      createdAt: tx.createdAt.toISOString(),
    }));

    res.json({
      transactions: formattedTransactions,
      total: formattedTransactions.length,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/business/payouts
 * Create a payout
 */
router.post('/payouts', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      recipientType,
      savedRecipientId,
      recipientName,
      accountNumber,
      bank,
      amount,
      currency,
      narration,
      fundingSource,
      saveBeneficiary,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    // Get business account
    const businessAccount = await prisma.account.findFirst({
      where: {
        userId,
        type: 'BUSINESS',
        currency,
      },
    });

    if (!businessAccount) {
      return res.status(404).json({ error: 'Business account not found for this currency' });
    }

    if (Number(businessAccount.balance) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create external transaction for payout
    // Note: Need to determine provider based on bank/recipient details
    // For now, using a default provider - this should be enhanced
    const payout = await prisma.externalTransaction.create({
      data: {
        userId,
        type: 'PAYOUT',
        amount: amount,
        currency,
        status: 'PENDING',
        provider: 'PAYSTACK', // Default provider - should be determined based on recipient details
        recipientDetails: {
          recipientType,
          savedRecipientId,
          recipientName,
          accountNumber,
          bank,
        },
        metadata: {
          fundingSource,
          narration: narration || `Payout to ${recipientName || 'recipient'}`,
        },
      },
    });

    // If saveBeneficiary is true, save to Firestore
    if (saveBeneficiary && recipientName && accountNumber) {
      const beneficiariesRef = admin.firestore().collection('beneficiaries');
      await beneficiariesRef.add({
        userId,
        name: recipientName,
        accountNumber,
        bank,
        currency,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(201).json({
      id: payout.id,
      status: payout.status,
      message: 'Payout created successfully',
    });
  } catch (error: any) {
    console.error('Error creating payout:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

