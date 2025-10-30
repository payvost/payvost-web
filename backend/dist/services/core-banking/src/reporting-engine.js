"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingEngine = exports.ReportType = void 0;
const date_fns_1 = require("date-fns");
var ReportType;
(function (ReportType) {
    ReportType["REGULATORY"] = "REGULATORY";
    ReportType["AUDIT"] = "AUDIT";
    ReportType["STATEMENT"] = "STATEMENT";
    ReportType["RISK"] = "RISK";
    ReportType["COMPLIANCE"] = "COMPLIANCE";
})(ReportType || (exports.ReportType = ReportType = {}));
class ReportingEngine {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generate regulatory reports (e.g., for central bank, financial authorities)
     */
    async generateRegulatorReport(params) {
        const { startDate, endDate, currency, country } = params;
        // Get all relevant transactions with full user details
        const transactions = await this.prisma.$transaction(async (tx) => {
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
                    ...transfers.map(t => t.fromAccountId),
                    ...transfers.map(t => t.toAccountId)
                ])];
            const accounts = await tx.account.findMany({
                where: {
                    id: { in: accountIds }
                },
                include: {
                    user: true
                }
            });
            const accountMap = new Map(accounts.map(a => [a.id, a]));
            return transfers.map(t => ({
                ...t,
                fromAccount: accountMap.get(t.fromAccountId),
                toAccount: accountMap.get(t.toAccountId)
            }));
        });
        // Mock compliance alerts until the table is created
        const complianceAlerts = [];
        // Aggregate transaction data
        const aggregates = {
            totalTransactions: transactions.length,
            totalVolume: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
            highValueTransactions: transactions.filter(t => Number(t.amount) > 10000).length,
            // We'll implement cross-border detection when country field is added
            crossBorderTransactions: 0,
            suspiciousActivityReports: complianceAlerts.length
        };
        return {
            reportType: params.type,
            period: {
                start: (0, date_fns_1.format)(startDate, 'yyyy-MM-dd'),
                end: (0, date_fns_1.format)(endDate, 'yyyy-MM-dd')
            },
            aggregates,
            transactionSummary: this.summarizeTransactions(transactions),
            complianceSummary: this.summarizeCompliance(complianceAlerts)
        };
    }
    /**
     * Generate account statements
     */
    async generateStatement(accountId, month) {
        const startDate = (0, date_fns_1.startOfMonth)(month);
        const endDate = (0, date_fns_1.endOfMonth)(month);
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
                .filter(e => e.type === 'CREDIT')
                .reduce((sum, e) => sum + Number(e.amount), 0),
            totalDebits: ledgerEntries
                .filter(e => e.type === 'DEBIT')
                .reduce((sum, e) => sum + Number(e.amount), 0),
            totalTransactions: transactions.length,
            largestTransaction: Math.max(...transactions.map(t => Number(t.amount)))
        };
        return {
            statementPeriod: {
                start: (0, date_fns_1.format)(startDate, 'yyyy-MM-dd'),
                end: (0, date_fns_1.format)(endDate, 'yyyy-MM-dd')
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
            transactions: transactions.map(t => ({
                id: t.id,
                date: (0, date_fns_1.format)(t.createdAt, 'yyyy-MM-dd HH:mm:ss'),
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
    async generateAuditTrail(accountId, startDate, endDate) {
        // Mock activities until the table is created
        const activities = [];
        return {
            accountId,
            period: {
                start: (0, date_fns_1.format)(startDate, 'yyyy-MM-dd'),
                end: (0, date_fns_1.format)(endDate, 'yyyy-MM-dd')
            },
            activities: []
        };
    }
    async getBalanceAtDate(accountId, date) {
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
    summarizeTransactions(transactions) {
        return {
            volumeByCountry: this.groupBy(transactions, t => t.fromAccount.user.country),
            volumeByCurrency: this.groupBy(transactions, t => t.currency),
            volumeByAmount: {
                small: transactions.filter(t => Number(t.amount) <= 1000).length,
                medium: transactions.filter(t => Number(t.amount) > 1000 && Number(t.amount) <= 10000).length,
                large: transactions.filter(t => Number(t.amount) > 10000).length
            }
        };
    }
    summarizeCompliance(alerts) {
        return {
            byType: this.groupBy(alerts, a => a.type),
            bySeverity: this.groupBy(alerts, a => a.severity),
            resolution: {
                resolved: alerts.filter(a => a.status === 'RESOLVED').length,
                pending: alerts.filter(a => a.status === 'PENDING').length,
                escalated: alerts.filter(a => a.status === 'ESCALATED').length
            }
        };
    }
    groupBy(array, keyFn) {
        return array.reduce((acc, item) => {
            const key = keyFn(item);
            acc[key] = (acc[key] || 0) + Number(item.amount || 1);
            return acc;
        }, {});
    }
}
exports.ReportingEngine = ReportingEngine;
