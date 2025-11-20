import { PrismaClient, Prisma } from '@prisma/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Decimal from 'decimal.js';

// Define interfaces for our custom models that aren't in Prisma yet
interface ComplianceAlert {
  id: string;
  type: string;
  severity: string;
  status: string;
  accountId?: string;
  description: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface AccountActivity {
  id: string;
  accountId: string;
  userId: string;
  action: string;
  ipAddress?: string;
  metadata?: any;
  createdAt: Date;
  user: {
    name: string;
  };
}

export enum ReportType {
  REGULATORY = 'REGULATORY',
  AUDIT = 'AUDIT',
  STATEMENT = 'STATEMENT',
  RISK = 'RISK',
  COMPLIANCE = 'COMPLIANCE'
}

export class ReportingEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate regulatory reports (e.g., for central bank, financial authorities)
   */
  async generateRegulatorReport(params: {
    type: ReportType;
    startDate: Date;
    endDate: Date;
    currency?: string;
    country?: string;
  }): Promise<any> {
    const { startDate, endDate, currency, country } = params;

    // Get all relevant transactions with full user details
    const transactions = await this.prisma.$transaction(async (tx: any) => {
      const transfers = await tx.transfer.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          ...(currency && { currency })
        }
      });

      const accountIds = [...new Set([
        ...transfers.map((t: any) => t.fromAccountId),
        ...transfers.map((t: any) => t.toAccountId)
      ])];

      const accounts = await tx.account.findMany({
        where: {
          id: { in: accountIds }
        },
        include: {
          user: true
        }
      });

      const accountMap = new Map(accounts.map((a: any) => [a.id, a]));

      return transfers.map((t: any) => ({
        ...t,
        fromAccount: accountMap.get(t.fromAccountId)!,
        toAccount: accountMap.get(t.toAccountId)!
      }));
    });

    // Mock compliance alerts until the table is created
    const complianceAlerts: ComplianceAlert[] = [];

    // Aggregate transaction data
    const aggregates = {
      totalTransactions: transactions.length,
      totalVolume: transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
      highValueTransactions: transactions.filter((t: any) => Number(t.amount) > 10000).length,
      // We'll implement cross-border detection when country field is added
      crossBorderTransactions: 0,
      suspiciousActivityReports: complianceAlerts.length
    };

    return {
      reportType: params.type,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      aggregates,
      transactionSummary: this.summarizeTransactions(transactions),
      complianceSummary: this.summarizeCompliance(complianceAlerts)
    };
  }

  /**
   * Generate account statements
   */
  async generateStatement(accountId: string, month: Date): Promise<any> {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);

    const [account, transactions, ledgerEntries] = await Promise.all([
      this.prisma.account.findUnique({
        where: { id: accountId },
        include: { user: true }
      }),
      this.prisma.transfer.findMany({
        where: {
          OR: [
            { fromAccountId: accountId },
            { toAccountId: accountId }
          ],
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.ledgerEntry.findMany({
        where: {
          accountId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate opening and closing balances
    const openingBalance = await this.getBalanceAtDate(accountId, startDate);
    const closingBalance = await this.getBalanceAtDate(accountId, endDate);

    // Calculate statement metrics
    const metrics = {
      totalCredits: ledgerEntries
        .filter((e: any) => e.type === 'CREDIT')
        .reduce((sum: number, e: any) => sum + Number(e.amount), 0),
      totalDebits: ledgerEntries
        .filter((e: any) => e.type === 'DEBIT')
        .reduce((sum: number, e: any) => sum + Number(e.amount), 0),
      totalTransactions: transactions.length,
      largestTransaction: Math.max(...transactions.map((t: any) => Number(t.amount)))
    };

    return {
      statementPeriod: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      accountInfo: {
        accountId: account.id,
        currency: account.currency,
        accountHolder: account.user.name,
        accountType: 'PERSONAL' // Default until type field is added
      },
      balances: {
        opening: openingBalance,
        closing: closingBalance,
        net: Number(closingBalance) - Number(openingBalance)
      },
      metrics,
      transactions: transactions.map((t: any) => ({
        id: t.id,
        date: format(t.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        type: t.fromAccountId === accountId ? 'DEBIT' : 'CREDIT',
        amount: t.amount,
        description: t.description,
        status: t.status
      }))
    };
  }

  /**
   * Generate audit trail for an account
   */
  async generateAuditTrail(accountId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock activities until the table is created
    const activities: AccountActivity[] = [];

    return {
      accountId,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      activities: []
    };
  }

  private async getBalanceAtDate(accountId: string, date: Date): Promise<string> {
    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        accountId,
        createdAt: { lte: date }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    // Convert Decimal to string for consistent representation
    return ledgerEntries[0]?.balanceAfter.toString() || '0';
  }

  private summarizeTransactions(transactions: any[]): any {
    return {
      volumeByCountry: this.groupBy(transactions, (t: any) => t.fromAccount.user.country),
      volumeByCurrency: this.groupBy(transactions, (t: any) => t.currency),
      volumeByAmount: {
        small: transactions.filter((t: any) => Number(t.amount) <= 1000).length,
        medium: transactions.filter((t: any) => Number(t.amount) > 1000 && Number(t.amount) <= 10000).length,
        large: transactions.filter((t: any) => Number(t.amount) > 10000).length
      }
    };
  }

  private summarizeCompliance(alerts: any[]): any {
    return {
      byType: this.groupBy(alerts, (a: any) => a.type),
      bySeverity: this.groupBy(alerts, (a: any) => a.severity),
      resolution: {
        resolved: alerts.filter((a: any) => a.status === 'RESOLVED').length,
        pending: alerts.filter((a: any) => a.status === 'PENDING').length,
        escalated: alerts.filter((a: any) => a.status === 'ESCALATED').length
      }
    };
  }

  private groupBy(array: any[], keyFn: (item: any) => string): Record<string, number> {
    return array.reduce((acc: Record<string, number>, item: any) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + Number(item.amount || 1);
      return acc;
    }, {});
  }
}