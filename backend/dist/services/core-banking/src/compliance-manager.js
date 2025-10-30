"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceManager = void 0;
const decimal_js_1 = require("decimal.js");
class ComplianceManager {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Check transaction against AML rules
     */
    async checkAMLCompliance(transaction) {
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
    async checkFraudRisk(transaction) {
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
    async checkTransactionLimits(accountId, amount, currency) {
        const dailyTotal = await this.prisma.transfer.aggregate({
            where: {
                fromAccountId: accountId,
                currency,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            _sum: { amount: true }
        });
        // Use Decimal arithmetic for safe addition
        const total = new decimal_js_1.Decimal(dailyTotal._sum.amount || 0).plus(new decimal_js_1.Decimal(amount));
        return total.greaterThan(10000); // Example limit
    }
    async checkTransactionPatterns(accountId) {
        const recentTransactions = await this.prisma.transfer.findMany({
            where: {
                fromAccountId: accountId,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            orderBy: { createdAt: 'asc' }
        });
        // Check for structuring pattern
        const hasStructuring = recentTransactions.some((t, i, arr) => {
            if (i === 0)
                return false;
            const timeDiff = t.createdAt.getTime() - arr[i - 1].createdAt.getTime();
            return timeDiff < 300000; // 5 minutes
        });
        return hasStructuring;
    }
    async checkSanctions(fromAccountId, toAccountId) {
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
        const fromCountry = fromAccount?.user?.country || '';
        const toCountry = toAccount?.user?.country || '';
        return sanctionedCountries.includes(fromCountry) ||
            sanctionedCountries.includes(toCountry);
    }
    async createAlert(alert) {
        // Mock compliance alert creation until table is available
        // In production, replace with actual DB call
        return;
    }
    async checkVelocity(accountId) {
        const transactions = await this.prisma.transfer.findMany({
            where: {
                fromAccountId: accountId,
                createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
            }
        });
        return transactions.length * 10; // Simple scoring example
    }
    async checkAmountPattern(accountId, amount) {
        const avgAmount = await this.prisma.transfer.aggregate({
            where: {
                fromAccountId: accountId,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last week
            },
            _avg: { amount: true }
        });
        // Use Decimal arithmetic for deviation
        const deviation = new decimal_js_1.Decimal(amount).minus(new decimal_js_1.Decimal(avgAmount._avg.amount || 0)).abs();
        return Math.min(deviation.div(100).toNumber(), 100); // Simple scoring example
    }
    async checkLocationRisk(ipAddress) {
        // TODO: Implement IP risk scoring
        return 0;
    }
    async checkDeviceRisk(deviceId) {
        // TODO: Implement device risk scoring
        return 0;
    }
}
exports.ComplianceManager = ComplianceManager;
