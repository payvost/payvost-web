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

    const pendingPayoutsTotal = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
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
    const openInvoicesAmount = openInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

    // Get new customers (users who made transactions in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await prisma.transfer.findMany({
      where: {
        toAccount: {
          userId,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        fromAccount: {
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
        toAccount: {
          userId,
        },
        createdAt: {
          gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: sevenDaysAgo,
        },
      },
      select: {
        fromAccount: {
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
          { fromAccount: { userId } },
          { toAccount: { userId } },
        ],
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const recentTransactionsData = recentTxs.map(tx => ({
      id: tx.id,
      type: tx.toAccount.userId === userId ? 'Credit' : 'Debit',
      description: tx.description || `${tx.type} Transaction`,
      amount: tx.toAccount.userId === userId ? Number(tx.amount) : -Number(tx.amount),
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
 * GET /api/business/analytics
 * Get business analytics/revenue data
 */
router.get('/analytics', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all successful transactions (credits to business account)
    const transactions = await prisma.transfer.findMany({
      where: {
        toAccount: {
          userId,
        },
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        appliedFees: true,
      },
    });

    // Calculate previous period for comparison
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = start;

    const previousTransactions = await prisma.transfer.findMany({
      where: {
        toAccount: {
          userId,
        },
        status: 'COMPLETED',
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
      include: {
        appliedFees: true,
      },
    });

    // Calculate gross revenue (total incoming)
    const grossRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const previousGrossRevenue = previousTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const grossRevenueChange = previousGrossRevenue > 0 
      ? ((grossRevenue - previousGrossRevenue) / previousGrossRevenue) * 100 
      : 0;

    // Calculate fees
    const totalFees = transactions.reduce((sum, tx) => {
      const fees = tx.appliedFees.reduce((feeSum, fee) => feeSum + Number(fee.amount), 0);
      return sum + fees;
    }, 0);

    // Calculate net revenue
    const netRevenue = grossRevenue - totalFees;
    const previousNetRevenue = previousTransactions.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      const fees = tx.appliedFees.reduce((feeSum, fee) => feeSum + Number(fee.amount), 0);
      return sum + amount - fees;
    }, 0);
    const netRevenueChange = previousNetRevenue > 0 
      ? ((netRevenue - previousNetRevenue) / previousNetRevenue) * 100 
      : 0;

    // Calculate refunds (outgoing transactions marked as refunds)
    const refunds = await prisma.transfer.findMany({
      where: {
        fromAccount: {
          userId,
        },
        description: {
          contains: 'refund',
          mode: 'insensitive',
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalRefunds = refunds.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const previousRefunds = await prisma.transfer.findMany({
      where: {
        fromAccount: {
          userId,
        },
        description: {
          contains: 'refund',
          mode: 'insensitive',
        },
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
    });
    const previousTotalRefunds = previousRefunds.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const refundsChange = previousTotalRefunds > 0 
      ? ((totalRefunds - previousTotalRefunds) / previousTotalRefunds) * 100 
      : 0;

    // Calculate taxes (estimate from invoices)
    const invoices = await prisma.invoice.findMany({
      where: {
        createdBy: userId,
        invoiceType: 'BUSINESS',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const taxes = invoices.reduce((sum, inv) => {
      const subtotal = Number(inv.grandTotal) / (1 + Number(inv.taxRate) / 100);
      const taxAmount = Number(inv.grandTotal) - subtotal;
      return sum + taxAmount;
    }, 0);

    const previousInvoices = await prisma.invoice.findMany({
      where: {
        createdBy: userId,
        invoiceType: 'BUSINESS',
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
    });

    const previousTaxes = previousInvoices.reduce((sum, inv) => {
      const subtotal = Number(inv.grandTotal) / (1 + Number(inv.taxRate) / 100);
      const taxAmount = Number(inv.grandTotal) - subtotal;
      return sum + taxAmount;
    }, 0);

    const taxesChange = previousTaxes > 0 
      ? ((taxes - previousTaxes) / previousTaxes) * 100 
      : 0;

    // Get revenue breakdown data
    const revenueData = transactions.map(tx => {
      const fees = tx.appliedFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
      return {
        id: tx.id,
        date: tx.createdAt.toISOString().split('T')[0],
        type: 'Payment', // Could be enhanced with more specific types
        region: 'N/A', // Could be extracted from user data
        method: 'Transfer', // Could be enhanced
        gross: Number(tx.amount),
        fee: fees,
        net: Number(tx.amount) - fees,
        status: tx.status === 'COMPLETED' ? 'Settled' : 'In Transit',
      };
    });

    // Get currency from first transaction or default
    const currency = transactions[0]?.currency || 'USD';

    res.json({
      grossRevenue: Number(grossRevenue),
      netRevenue: Number(netRevenue),
      refunds: Number(totalRefunds),
      taxes: Number(taxes),
      grossRevenueChange: Number(grossRevenueChange.toFixed(1)),
      netRevenueChange: Number(netRevenueChange.toFixed(1)),
      refundsChange: Number(refundsChange.toFixed(1)),
      taxesChange: Number(taxesChange.toFixed(1)),
      currency,
      revenueData,
    });
  } catch (error: any) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/business/health-score
 * Get business health score and metrics
 */
router.get('/health-score', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get business account
    const businessAccount = await prisma.account.findFirst({
      where: {
        userId,
        type: 'BUSINESS',
      },
    });

    if (!businessAccount) {
      return res.status(404).json({ error: 'Business account not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all transactions in last 30 days
    const transactions = await prisma.transfer.findMany({
      where: {
        OR: [
          { fromAccount: { userId } },
          { toAccount: { userId } },
        ],
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const successfulTransactions = transactions.filter(tx => tx.status === 'COMPLETED');
    const totalTransactions = transactions.length;
    const acceptanceRate = totalTransactions > 0 
      ? (successfulTransactions.length / totalTransactions) * 100 
      : 100;

    // Calculate chargeback rate (transactions with chargeback description)
    const chargebacks = transactions.filter(tx => 
      tx.description?.toLowerCase().includes('chargeback')
    );
    const chargebackRate = totalTransactions > 0 
      ? (chargebacks.length / totalTransactions) * 100 
      : 0;

    // Calculate dispute rate
    const disputes = transactions.filter(tx => 
      tx.description?.toLowerCase().includes('dispute')
    );
    const disputeRate = totalTransactions > 0 
      ? (disputes.length / totalTransactions) * 100 
      : 0;

    // Calculate revenue growth (compare last 30 days to previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousTransactions = await prisma.transfer.findMany({
      where: {
        toAccount: {
          userId,
        },
        status: 'COMPLETED',
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const currentRevenue = successfulTransactions
      .filter(tx => tx.toAccount.userId === userId)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const previousRevenue = previousTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Calculate churn rate (customers who stopped transacting)
    // This is a simplified calculation
    const churnRate = 2.1; // Placeholder - would need more complex logic

    // Get new customers count
    const newCustomers = await prisma.transfer.findMany({
      where: {
        toAccount: {
          userId,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        fromAccount: {
          select: {
            userId: true,
          },
        },
      },
      distinct: ['fromAccountId'],
    });

    // Calculate overall health score (weighted average)
    let score = 85; // Base score
    if (acceptanceRate >= 95) score += 5;
    if (chargebackRate < 0.5) score += 5;
    if (disputeRate < 0.1) score += 5;
    if (revenueGrowth > 0) score += 5;
    if (chargebackRate > 1) score -= 10;
    if (disputeRate > 0.5) score -= 5;

    score = Math.max(0, Math.min(100, score));

    const metrics = [
      {
        title: 'Revenue Growth',
        value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
        status: revenueGrowth >= 0 ? 'good' : 'bad',
      },
      {
        title: 'Acceptance Rate',
        value: `${acceptanceRate.toFixed(1)}%`,
        status: acceptanceRate >= 95 ? 'good' : acceptanceRate >= 90 ? 'warning' : 'bad',
      },
      {
        title: 'Chargeback Rate',
        value: `${chargebackRate.toFixed(2)}%`,
        status: chargebackRate < 0.5 ? 'good' : chargebackRate < 1 ? 'warning' : 'bad',
      },
      {
        title: 'Churn Rate',
        value: `${churnRate.toFixed(1)}%`,
        status: churnRate < 5 ? 'good' : 'warning',
      },
      {
        title: 'Dispute Rate',
        value: `${disputeRate.toFixed(2)}%`,
        status: disputeRate < 0.1 ? 'good' : disputeRate < 0.5 ? 'warning' : 'bad',
      },
      {
        title: 'New Customers',
        value: newCustomers.length.toString(),
        status: 'good',
      },
    ];

    const alerts = [];
    if (chargebackRate > 0.5) {
      alerts.push({
        title: 'Chargeback Rate Increase',
        description: `Your chargeback rate is ${chargebackRate.toFixed(2)}%, which is above the industry average of 0.08%.`,
        level: chargebackRate > 1 ? 'high' : 'medium',
      });
    }

    if (acceptanceRate < 90) {
      alerts.push({
        title: 'Low Acceptance Rate',
        description: `Your payment acceptance rate is ${acceptanceRate.toFixed(1)}%, which may indicate payment processing issues.`,
        level: 'medium',
      });
    }

    res.json({
      overallScore: Math.round(score),
      metrics,
      alerts,
    });
  } catch (error: any) {
    console.error('Error fetching health score:', error);
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
        { fromAccount: { userId } },
        { toAccount: { userId } },
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
        fromAccount: true,
        toAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.toAccount.userId === userId ? 'Credit' : 'Debit',
      description: tx.description || `${tx.type} Transaction`,
      amount: tx.toAccount.userId === userId ? Number(tx.amount) : -Number(tx.amount),
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

/**
 * GET /api/business/quotes
 * List business quotes
 */
router.get('/quotes', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quotesRef = admin.firestore().collection('businessQuotes');
    const snapshot = await quotesRef
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const quotes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ quotes });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/business/quotes
 * Create a quote
 */
router.post('/quotes', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      quoteNumber,
      issueDate,
      expiryDate,
      clientName,
      clientEmail,
      items,
      notes,
      taxRate,
      currency,
    } = req.body;

    if (!quoteNumber || !clientName || !clientEmail || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity || 0) * (item.price || 0), 0
    );
    const taxAmount = subtotal * ((taxRate || 0) / 100);
    const grandTotal = subtotal + taxAmount;

    const quoteData = {
      quoteNumber,
      issueDate: admin.firestore.Timestamp.fromDate(new Date(issueDate)),
      expiryDate: admin.firestore.Timestamp.fromDate(new Date(expiryDate)),
      clientName,
      clientEmail,
      items,
      notes: notes || '',
      taxRate: taxRate || 0,
      currency: currency || 'USD',
      subtotal,
      taxAmount,
      grandTotal,
      status: 'DRAFT',
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const quotesRef = admin.firestore().collection('businessQuotes');
    const docRef = await quotesRef.add(quoteData);

    res.status(201).json({
      id: docRef.id,
      ...quoteData,
      issueDate: quoteData.issueDate.toDate().toISOString(),
      expiryDate: quoteData.expiryDate.toDate().toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

