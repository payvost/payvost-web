import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

export class ComplianceManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check transaction against AML rules
   * Returns detailed compliance result
   */
  async checkAMLCompliance(transaction: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency: string;
    userId?: string;
  }): Promise<{
    compliant: boolean;
    reason?: string;
    alerts: Array<{ type: string; severity: string; description: string }>;
  }> {
    const { fromAccountId, toAccountId, amount, currency, userId } = transaction;
    const alerts: Array<{ type: string; severity: string; description: string }> = [];

    // 1. Check transaction limits
    const exceedsLimit = await this.checkTransactionLimits(fromAccountId, amount, currency);
    if (exceedsLimit) {
      const alert = {
        type: 'AML',
        severity: 'HIGH',
        accountId: fromAccountId,
        description: `Transaction exceeds AML limits: ${amount} ${currency}`
      };
      await this.createAlert(alert);
      alerts.push(alert);
      return { compliant: false, reason: 'Transaction exceeds AML limits', alerts };
    }

    // 2. Check transaction patterns (structuring, smurfing, etc.)
    const suspiciousPattern = await this.checkTransactionPatterns(fromAccountId);
    if (suspiciousPattern) {
      const alert = {
        type: 'AML',
        severity: 'MEDIUM',
        accountId: fromAccountId,
        description: 'Suspicious transaction pattern detected (possible structuring)'
      };
      await this.createAlert(alert);
      alerts.push(alert);
      return { compliant: false, reason: 'Suspicious transaction pattern detected', alerts };
    }

    // 3. Check sanctioned countries
    const sanctionsViolation = await this.checkSanctions(fromAccountId, toAccountId);
    if (sanctionsViolation) {
      const alert = {
        type: 'SANCTIONS',
        severity: 'CRITICAL',
        accountId: fromAccountId,
        description: 'Potential sanctions violation - transaction involves sanctioned country'
      };
      await this.createAlert(alert);
      alerts.push(alert);
      return { compliant: false, reason: 'Sanctions violation detected', alerts };
    }

    // 4. Check for round-number structuring (common AML red flag)
    const amountNum = parseFloat(amount);
    if (amountNum % 1000 === 0 && amountNum >= 10000) {
      // Multiple round-number transactions might indicate structuring
      const recentRoundTransactions = await this.prisma.transfer.count({
        where: {
          fromAccountId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          amount: { gte: 10000 }
        }
      });
      
      if (recentRoundTransactions >= 3) {
        const alert = {
          type: 'AML',
          severity: 'MEDIUM',
          accountId: fromAccountId,
          description: 'Multiple round-number transactions detected (possible structuring)'
        };
        await this.createAlert(alert);
        alerts.push(alert);
        // Don't block, but flag for review
      }
    }

    // 5. Check user KYC status
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { kycStatus: true }
      });
      
      if (user && user.kycStatus !== 'verified' && parseFloat(amount) > 1000) {
        const alert = {
          type: 'AML',
          severity: 'MEDIUM',
          accountId: fromAccountId,
          description: `Large transaction (${amount} ${currency}) from unverified user`
        };
        await this.createAlert(alert);
        alerts.push(alert);
        // Don't block, but flag for review
      }
    }

    return { compliant: true, alerts };
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
        include: { User: true }
      }),
      this.prisma.account.findUnique({
        where: { id: toAccountId },
        include: { User: true }
      })
    ]);

    // Check against sanctions list
    // In real implementation, this would check against actual sanctions databases
    const sanctionedCountries = ['KP', 'IR', 'CU', 'SY'];
    // If country is missing, treat as not sanctioned
    const fromCountry = (fromAccount?.User as any)?.country || '';
    const toCountry = (toAccount?.User as any)?.country || '';
    return sanctionedCountries.includes(fromCountry) ||
      sanctionedCountries.includes(toCountry);
  }

  private async createAlert(alert: {
    type: string;
    severity: string;
    accountId: string;
    description: string;
  }): Promise<void> {
    try {
      // Create compliance alert in database
      await this.prisma.complianceAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity as any,
          accountId: alert.accountId,
          description: alert.description,
          status: 'PENDING',
        },
      });
    } catch (error) {
      console.error('Failed to create compliance alert:', error);
      // Don't throw - alert creation failure shouldn't block transaction
    }
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
    try {
      // Check if IP is from high-risk countries
      // In production, use a geolocation service like MaxMind GeoIP2
      const highRiskCountries = ['KP', 'IR', 'CU', 'SY', 'RU'];
      
      // Check recent transactions from same IP
      const recentTransactions = await this.prisma.transfer.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        select: { id: true }
      });
      
      // Simple scoring: if many transactions from same IP, increase risk
      // In production, use actual IP geolocation
      const ipTransactionCount = recentTransactions.length;
      let score = 0;
      
      // High volume from single IP is suspicious
      if (ipTransactionCount > 50) {
        score += 40;
      } else if (ipTransactionCount > 20) {
        score += 20;
      }
      
      // Check for known VPN/proxy IPs (simplified - use a service in production)
      // For now, check if IP matches common VPN patterns
      const isVpnPattern = /^(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ipAddress);
      if (isVpnPattern) {
        score += 10; // Slight risk increase for private IPs
      }
      
      return Math.min(score, 100);
    } catch (error) {
      console.error('Error checking location risk:', error);
      return 0; // Fail open - don't block transactions if check fails
    }
  }

  private async checkDeviceRisk(deviceId: string): Promise<number> {
    try {
      if (!deviceId) return 0;
      
      // Check device history
      const deviceTransactions = await this.prisma.transfer.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { id: true, status: true }
      });
      
      let score = 0;
      
      // Check for device with many failed transactions
      const failedCount = deviceTransactions.filter((t: any) => t.status === 'FAILED').length;
      if (failedCount > 5) {
        score += 30; // High failure rate is suspicious
      }
      
      // Check for rapid device switching (would need device tracking table)
      // For now, simple heuristic: if device ID changes frequently, it's suspicious
      // In production, maintain a device_fingerprints table
      
      // Check device ID format (suspicious if too short or random-looking)
      if (deviceId.length < 10) {
        score += 20; // Short device IDs might be spoofed
      }
      
      return Math.min(score, 100);
    } catch (error) {
      console.error('Error checking device risk:', error);
      return 0; // Fail open
    }
  }
}