"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const decimal_js_1 = __importDefault(require("decimal.js"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.FRAUD_SERVICE_PORT || 3011;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Prisma
const prisma = new client_1.PrismaClient({
    log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// Internal service authentication (simple API key)
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || process.env.FRAUD_SERVICE_API_KEY;
function verifyInternalAuth(req, res, next) {
    // Always require authentication, even in development
    if (!INTERNAL_API_KEY) {
        console.error('INTERNAL_API_KEY or FRAUD_SERVICE_API_KEY must be set');
        return res.status(500).json({ error: 'Internal service authentication not configured' });
    }
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }
    next();
}
/**
 * Transaction Risk Levels
 */
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (RiskLevel = {}));
/**
 * Calculate risk score for a transaction
 */
async function calculateRiskScore(params) {
    const { fromAccountId, toAccountId, amount, currency } = params;
    let score = 0;
    const factors = [];
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
    }
    else if (recentTransfers > 3) {
        score += 15;
        factors.push('Elevated transaction velocity');
    }
    // Check unusual amount (compare to account's average)
    const avgTransfer = await prisma.transfer.aggregate({
        where: { fromAccountId, status: 'COMPLETED' },
        _avg: { amount: true },
    });
    if (avgTransfer._avg.amount) {
        const avgAmount = new decimal_js_1.default(avgTransfer._avg.amount.toString());
        const ratio = amount.div(avgAmount);
        if (ratio.greaterThan(10)) {
            score += 40;
            factors.push('Transaction amount significantly higher than average');
        }
        else if (ratio.greaterThan(5)) {
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
        }
        else if (daysSinceCreation < 30) {
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
    let level;
    let recommendation;
    if (score >= 80) {
        level = RiskLevel.CRITICAL;
        recommendation = 'Block transaction and flag for manual review';
    }
    else if (score >= 50) {
        level = RiskLevel.HIGH;
        recommendation = 'Require additional verification before processing';
    }
    else if (score >= 30) {
        level = RiskLevel.MEDIUM;
        recommendation = 'Monitor closely and consider additional checks';
    }
    else {
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
async function calculateAccountRiskScore(accountId) {
    let score = 0;
    const factors = [];
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
    const failedTransfers = recentTransfers.filter((t) => t.status === 'FAILED').length;
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
    let level;
    if (score >= 70) {
        level = RiskLevel.CRITICAL;
    }
    else if (score >= 40) {
        level = RiskLevel.HIGH;
    }
    else if (score >= 20) {
        level = RiskLevel.MEDIUM;
    }
    else {
        level = RiskLevel.LOW;
    }
    return { score, level, factors };
}
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'fraud-service',
        timestamp: new Date().toISOString(),
        prismaConnected: true,
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'Payvost Fraud Detection Service',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            analyzeTransaction: 'POST /analyze-transaction',
            accountRiskScore: 'GET /risk-score/:accountId',
            alerts: 'GET /alerts',
            resolveAlert: 'POST /alerts/:id/resolve',
        },
    });
});
/**
 * POST /analyze-transaction
 * Analyze a transaction for fraud risk
 */
app.post('/analyze-transaction', verifyInternalAuth, async (req, res) => {
    try {
        const { fromAccountId, toAccountId, amount, currency } = req.body;
        if (!fromAccountId || !toAccountId || !amount || !currency) {
            return res.status(400).json({ error: 'fromAccountId, toAccountId, amount, and currency are required' });
        }
        const riskScore = await calculateRiskScore({
            fromAccountId,
            toAccountId,
            amount: new decimal_js_1.default(amount),
            currency,
        });
        res.status(200).json({
            riskScore: riskScore.score,
            riskLevel: riskScore.level,
            factors: riskScore.factors,
            recommendation: riskScore.recommendation,
        });
    }
    catch (error) {
        console.error('[Fraud Service] Error analyzing transaction:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze transaction' });
    }
});
/**
 * GET /risk-score/:accountId
 * Get risk score for an account
 */
app.get('/risk-score/:accountId', verifyInternalAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        const riskScore = await calculateAccountRiskScore(accountId);
        res.status(200).json({
            accountId,
            riskScore: riskScore.score,
            riskLevel: riskScore.level,
            factors: riskScore.factors,
        });
    }
    catch (error) {
        console.error('[Fraud Service] Error calculating risk score:', error);
        res.status(500).json({ error: error.message || 'Failed to calculate risk score' });
    }
});
/**
 * GET /alerts
 * Get compliance alerts
 */
app.get('/alerts', verifyInternalAuth, async (req, res) => {
    try {
        const { status, severity, limit = '50', offset = '0' } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        const alerts = await prisma.complianceAlert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma.complianceAlert.count({ where });
        res.status(200).json({
            alerts,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (error) {
        console.error('[Fraud Service] Error fetching alerts:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
    }
});
/**
 * POST /alerts/:id/resolve
 * Resolve a compliance alert
 */
app.post('/alerts/:id/resolve', verifyInternalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution, resolvedBy } = req.body;
        const alert = await prisma.complianceAlert.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                metadata: {
                    resolution,
                    resolvedBy: resolvedBy || 'system',
                    resolvedAt: new Date().toISOString(),
                },
            },
        });
        res.status(200).json({ alert });
    }
    catch (error) {
        console.error('[Fraud Service] Error resolving alert:', error);
        res.status(500).json({ error: error.message || 'Failed to resolve alert' });
    }
});
// Graceful shutdown
const shutdown = async () => {
    console.log('[Fraud Service] Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
app.listen(PORT, () => {
    console.log(`[Fraud Service] Running on port ${PORT}`);
    console.log(`[Fraud Service] Environment: ${NODE_ENV}`);
    console.log(`[Fraud Service] Internal API key configured: ${!!INTERNAL_API_KEY}`);
    console.log(`[Fraud Service] Endpoints:`);
    console.log(`  - GET http://localhost:${PORT}/health`);
    console.log(`  - POST http://localhost:${PORT}/analyze-transaction`);
    console.log(`  - GET http://localhost:${PORT}/risk-score/:accountId`);
    console.log(`  - GET http://localhost:${PORT}/alerts`);
    console.log(`  - POST http://localhost:${PORT}/alerts/:id/resolve`);
});
