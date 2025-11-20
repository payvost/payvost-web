import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, requireRole, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import { Decimal } from 'decimal.js';
import { prisma } from '../../common/prisma';

const router = Router();

/**
 * Transaction Risk Levels
 */
enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * POST /api/fraud/analyze-transaction
 * Analyze a transaction for fraud risk
 */
router.post('/analyze-transaction', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, currency } = req.body;

    if (!fromAccountId || !toAccountId || !amount || !currency) {
      throw new ValidationError('fromAccountId, toAccountId, amount, and currency are required');
    }

    const riskScore = await calculateRiskScore({
      fromAccountId,
      toAccountId,
      amount: new Decimal(amount),
      currency,
    });

    res.status(200).json({
      riskScore: riskScore.score,
      riskLevel: riskScore.level,
      factors: riskScore.factors,
      recommendation: riskScore.recommendation,
    });
  } catch (error: any) {
    console.error('Error analyzing transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze transaction' });
  }
});

/**
 * GET /api/fraud/alerts
 * Get compliance alerts (admin only)
 */
router.get('/alerts', verifyFirebaseToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, severity, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const alerts = await prisma.complianceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.complianceAlert.count({ where });

    res.status(200).json({
      alerts,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
  }
});

/**
 * POST /api/fraud/alerts/:id/resolve
 * Resolve a compliance alert (admin only)
 */
router.post('/alerts/:id/resolve', verifyFirebaseToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const alert = await prisma.complianceAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        metadata: {
          resolution,
          resolvedBy: req.user?.uid,
          resolvedAt: new Date().toISOString(),
        },
      },
    });

    res.status(200).json({ alert });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve alert' });
  }
});

/**
 * GET /api/fraud/risk-score/:accountId
 * Get risk score for an account
 */
router.get('/risk-score/:accountId', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.user?.uid;

    // Verify account belongs to user (unless admin)
    const account = await prisma.account.findFirst({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const riskScore = await calculateAccountRiskScore(accountId);

    res.status(200).json({
      accountId,
      riskScore: riskScore.score,
      riskLevel: riskScore.level,
      factors: riskScore.factors,
    });
  } catch (error: any) {
    console.error('Error calculating risk score:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate risk score' });
  }
});

/**
 * Calculate risk score for a transaction
 */
async function calculateRiskScore(params: {
  fromAccountId: string;
  toAccountId: string;
  amount: Decimal;
  currency: string;
}): Promise<{
  score: number;
  level: RiskLevel;
  factors: string[];
  recommendation: string;
}> {
  const { fromAccountId, toAccountId, amount, currency } = params;
  let score = 0;
  const factors: string[] = [];

  // Check transaction velocity (transactions in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTransfers = await prisma.transfer.count({
    where: {
      fromAccountId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentTransfers > 5) {
    score += 30;
    factors.push('High transaction velocity');
  } else if (recentTransfers > 3) {
    score += 15;
    factors.push('Elevated transaction velocity');
  }

  // Check unusual amount (compare to account's average)
  const avgTransfer = await prisma.transfer.aggregate({
    where: { fromAccountId, status: 'COMPLETED' },
    _avg: { amount: true },
  });

  if (avgTransfer._avg.amount) {
    const avgAmount = new Decimal(avgTransfer._avg.amount.toString());
    const ratio = amount.div(avgAmount);

    if (ratio.greaterThan(10)) {
      score += 40;
      factors.push('Transaction amount significantly higher than average');
    } else if (ratio.greaterThan(5)) {
      score += 20;
      factors.push('Transaction amount moderately higher than average');
    }
  }

  // Check for new recipient
  const previousToRecipient = await prisma.transfer.count({
    where: {
      fromAccountId,
      toAccountId,
      status: 'COMPLETED',
    },
  });

  if (previousToRecipient === 0) {
    score += 10;
    factors.push('New recipient');
  }

  // Check account age
  const fromAccount = await prisma.account.findUnique({
    where: { id: fromAccountId },
  });

  if (fromAccount) {
    const accountAge = Date.now() - fromAccount.createdAt.getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

    if (daysSinceCreation < 7) {
      score += 25;
      factors.push('Account less than 7 days old');
    } else if (daysSinceCreation < 30) {
      score += 10;
      factors.push('Account less than 30 days old');
    }
  }

  // Check KYC status
  const user = await prisma.user.findUnique({
    where: { id: fromAccount?.userId },
  });

  if (user?.kycStatus !== 'verified') {
    score += 30;
    factors.push('KYC not verified');
  }

  // Determine risk level and recommendation
  let level: RiskLevel;
  let recommendation: string;

  if (score >= 80) {
    level = RiskLevel.CRITICAL;
    recommendation = 'Block transaction and flag for manual review';
  } else if (score >= 50) {
    level = RiskLevel.HIGH;
    recommendation = 'Require additional verification before processing';
  } else if (score >= 30) {
    level = RiskLevel.MEDIUM;
    recommendation = 'Monitor closely and consider additional checks';
  } else {
    level = RiskLevel.LOW;
    recommendation = 'Proceed with transaction';
  }

  // Create compliance alert for high-risk transactions
  if (score >= 50) {
    await prisma.complianceAlert.create({
      data: {
        type: 'HIGH_RISK_TRANSACTION',
        severity: level,
        status: 'PENDING',
        accountId: fromAccountId,
        description: `High-risk transaction detected: ${amount} ${currency}`,
        metadata: {
          factors,
          score,
          toAccountId,
          amount: amount.toString(),
          currency,
        },
      },
    });
  }

  return { score, level, factors, recommendation };
}

/**
 * Calculate overall risk score for an account
 */
async function calculateAccountRiskScore(accountId: string): Promise<{
  score: number;
  level: RiskLevel;
  factors: string[];
}> {
  let score = 0;
  const factors: string[] = [];

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { user: true },
  });

  if (!account) {
    throw new Error('Account not found');
  }

  // Check account age
  const accountAge = Date.now() - account.createdAt.getTime();
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

  if (daysSinceCreation < 7) {
    score += 20;
    factors.push('Account less than 7 days old');
  }

  // Check KYC status
  if (account.user.kycStatus !== 'verified') {
    score += 30;
    factors.push('KYC not verified');
  }

  // Check transaction patterns
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTransfers = await prisma.transfer.findMany({
    where: {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      createdAt: { gte: last30Days },
    },
  });

  const failedTransfers = recentTransfers.filter((t: any) => t.status === 'FAILED').length;
  if (failedTransfers > 5) {
    score += 25;
    factors.push('Multiple failed transactions');
  }

  // Check for compliance alerts
  const alerts = await prisma.complianceAlert.count({
    where: {
      accountId,
      status: 'PENDING',
    },
  });

  if (alerts > 0) {
    score += 20 * alerts;
    factors.push(`${alerts} pending compliance alert(s)`);
  }

  let level: RiskLevel;
  if (score >= 70) {
    level = RiskLevel.CRITICAL;
  } else if (score >= 40) {
    level = RiskLevel.HIGH;
  } else if (score >= 20) {
    level = RiskLevel.MEDIUM;
  } else {
    level = RiskLevel.LOW;
  }

  return { score, level, factors };
}

export default router;
