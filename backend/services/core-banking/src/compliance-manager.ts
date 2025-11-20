import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

export class ComplianceManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check transaction against AML rules
   */
  async checkAMLCompliance(transaction: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency: string;
  }): Promise<boolean> {
    const { fromAccountId, toAccountId, amount, currency } = transaction;

    // 1. Check transaction limits
    const exceedsLimit = await this.checkTransactionLimits(fromAccountId, amount, currency);
    if (exceedsLimit) {
      await this.createAlert({
        type: 'AML',
        severity: 'HIGH',
        accountId: fromAccountId,
        description: 'Transaction exceeds AML limits'
      });
      return false;
    }

    // 2. Check transaction patterns
    const suspiciousPattern = await this.checkTransactionPatterns(fromAccountId);
    if (suspiciousPattern) {
      await this.createAlert({
        type: 'AML',
        severity: 'MEDIUM',
        accountId: fromAccountId,
        description: 'Suspicious transaction pattern detected'
      });
      return false;
    }

    // 3. Check sanctioned countries
    const sanctionsViolation = await this.checkSanctions(fromAccountId, toAccountId);
    if (sanctionsViolation) {
      await this.createAlert({
        type: 'SANCTIONS',
        severity: 'CRITICAL',
        accountId: fromAccountId,
        description: 'Potential sanctions violation'
      });
      return false;
    }

    return true;
  }

  /**
   * Check transaction against fraud rules
   */
  async checkFraudRisk(transaction: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<{
    score: number;
    allowed: boolean;
    rules: string[];
  }> {
    const { fromAccountId, amount, metadata } = transaction;
    let score = 0;
    const triggeredRules = [];

    // 1. Velocity check
    const velocityScore = await this.checkVelocity(fromAccountId);
    score += velocityScore;
    if (velocityScore > 50) {
      triggeredRules.push('HIGH_VELOCITY');
    }

    // 2. Amount pattern check
    const amountScore = await this.checkAmountPattern(fromAccountId, amount);
    score += amountScore;
    if (amountScore > 50) {
      triggeredRules.push('UNUSUAL_AMOUNT');
    }

    // 3. Location risk check
    if (metadata?.ipAddress) {
      const locationScore = await this.checkLocationRisk(metadata.ipAddress);
      score += locationScore;
      if (locationScore > 50) {
        triggeredRules.push('HIGH_RISK_LOCATION');
      }
    }

    // 4. Device risk check
    if (metadata?.deviceId) {
      const deviceScore = await this.checkDeviceRisk(metadata.deviceId);
      score += deviceScore;
      if (deviceScore > 50) {
        triggeredRules.push('SUSPICIOUS_DEVICE');
      }
    }

    return {
      score,
      allowed: score < 70,
      rules: triggeredRules
    };
  }

  private async checkTransactionLimits(accountId: string, amount: string, currency: string): Promise<boolean> {
    const dailyTotal = await this.prisma.transfer.aggregate({
      where: {
        fromAccountId: accountId,
        currency,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      _sum: { amount: true }
    });

      // Use Decimal arithmetic for safe addition
      const total = new Decimal(dailyTotal._sum.amount || 0).plus(new Decimal(amount));
      return total.greaterThan(10000); // Example limit
  }

  private async checkTransactionPatterns(accountId: string): Promise<boolean> {
    const recentTransactions = await this.prisma.transfer.findMany({
      where: {
        fromAccountId: accountId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Check for structuring pattern
    const hasStructuring = recentTransactions.some((t: any, i: number, arr: any[]) => {
      if (i === 0) return false;
      const timeDiff = t.createdAt.getTime() - arr[i-1].createdAt.getTime();
      return timeDiff < 300000; // 5 minutes
    });

    return hasStructuring;
  }

  private async checkSanctions(fromAccountId: string, toAccountId: string): Promise<boolean> {
    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.account.findUnique({
        where: { id: fromAccountId },
        include: { user: true }
      }),
      this.prisma.account.findUnique({
        where: { id: toAccountId },
        include: { user: true }
      })
    ]);

    // Check against sanctions list
    // In real implementation, this would check against actual sanctions databases
    const sanctionedCountries = ['KP', 'IR', 'CU', 'SY'];
    // If country is missing, treat as not sanctioned
    const fromCountry = (fromAccount?.user as any)?.country || '';
    const toCountry = (toAccount?.user as any)?.country || '';
    return sanctionedCountries.includes(fromCountry) ||
      sanctionedCountries.includes(toCountry);
  }

  private async createAlert(alert: {
    type: string;
    severity: string;
    accountId: string;
    description: string;
  }): Promise<void> {
    // Mock compliance alert creation until table is available
    // In production, replace with actual DB call
    return;
  }

  private async checkVelocity(accountId: string): Promise<number> {
    const transactions = await this.prisma.transfer.findMany({
      where: {
        fromAccountId: accountId,
        createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
      }
    });

    return transactions.length * 10; // Simple scoring example
  }

  private async checkAmountPattern(accountId: string, amount: string): Promise<number> {
    const avgAmount = await this.prisma.transfer.aggregate({
      where: {
        fromAccountId: accountId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last week
      },
      _avg: { amount: true }
    });

    // Use Decimal arithmetic for deviation
    const deviation = new Decimal(amount).minus(new Decimal(avgAmount._avg.amount || 0)).abs();
    return Math.min(deviation.div(100).toNumber(), 100); // Simple scoring example
  }

  private async checkLocationRisk(ipAddress: string): Promise<number> {
    // TODO: Implement IP risk scoring
    return 0;
  }

  private async checkDeviceRisk(deviceId: string): Promise<number> {
    // TODO: Implement device risk scoring
    return 0;
  }
}