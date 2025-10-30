"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingEngine = void 0;
const date_fns_1 = require("date-fns");
class AccountingEngine {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generate end of day report
     */
    async generateEODReport(date = new Date()) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        const [transfers, ledgerEntries] = await Promise.all([
            // Get all transfers for the day
            this.prisma.transfer.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    fromAccount: true,
                    toAccount: true
                }
            }),
            // Get all ledger entries for the day
            this.prisma.ledgerEntry.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    account: true
                }
            })
        ]);
        // Calculate totals by currency
        const transferTotals = transfers.reduce((acc, transfer) => {
            const { currency, amount } = transfer;
            acc[currency] = (acc[currency] || 0) + Number(amount);
            return acc;
        }, {});
        // Calculate balance changes by account
        const accountBalanceChanges = ledgerEntries.reduce((acc, entry) => {
            const { accountId, amount } = entry;
            acc[accountId] = (acc[accountId] || 0) + Number(amount);
            return acc;
        }, {});
        return {
            date: (0, date_fns_1.format)(date, 'yyyy-MM-dd'),
            transferTotals,
            accountBalanceChanges,
            totalTransactions: transfers.length,
            totalLedgerEntries: ledgerEntries.length
        };
    }
    /**
     * Reconcile accounts and identify discrepancies
     */
    async reconcileAccounts() {
        const accounts = await this.prisma.account.findMany({
            include: {
                ledgerEntries: true
            }
        });
        const discrepancies = [];
        for (const account of accounts) {
            // Calculate balance from ledger entries
            const calculatedBalance = account.ledgerEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
            // Compare with current balance
            if (Number(account.balance) !== calculatedBalance) {
                discrepancies.push({
                    accountId: account.id,
                    recordedBalance: account.balance,
                    calculatedBalance: calculatedBalance.toString(),
                    difference: (Number(account.balance) - calculatedBalance).toString()
                });
            }
        }
        return {
            totalAccounts: accounts.length,
            discrepancies,
            reconciliationDate: new Date()
        };
    }
    /**
     * Generate trial balance report
     */
    async generateTrialBalance() {
        const accounts = await this.prisma.account.findMany({
            include: {
                ledgerEntries: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        const trialBalance = accounts.map(account => ({
            accountId: account.id,
            currency: account.currency,
            debitTotal: account.ledgerEntries
                .filter(entry => entry.type === 'DEBIT')
                .reduce((sum, entry) => sum + Number(entry.amount), 0),
            creditTotal: account.ledgerEntries
                .filter(entry => entry.type === 'CREDIT')
                .reduce((sum, entry) => sum + Number(entry.amount), 0),
            balance: account.balance
        }));
        return {
            date: new Date(),
            entries: trialBalance,
            totalDebit: trialBalance.reduce((sum, entry) => sum + entry.debitTotal, 0),
            totalCredit: trialBalance.reduce((sum, entry) => sum + entry.creditTotal, 0)
        };
    }
}
exports.AccountingEngine = AccountingEngine;
