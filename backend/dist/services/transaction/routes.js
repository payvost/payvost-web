"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_manager_1 = require("../core-banking/src/transaction-manager");
const fee_engine_1 = require("../core-banking/src/fee-engine");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const decimal_js_1 = require("decimal.js");
const prisma_1 = require("../../common/prisma");
const router = (0, express_1.Router)();
const transactionManager = new transaction_manager_1.TransactionManager(prisma_1.prisma);
const feeEngine = new fee_engine_1.FeeEngine(prisma_1.prisma);
/**
 * POST /api/transaction/transfer
 * Execute a transfer between accounts
 */
router.post('/transfer', middleware_1.verifyFirebaseToken, middleware_1.requireKYC, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { fromAccountId, toAccountId, amount, currency, description, idempotencyKey } = req.body;
        // Validation
        if (!fromAccountId || !toAccountId || !amount || !currency) {
            throw new index_1.ValidationError('fromAccountId, toAccountId, amount, and currency are required');
        }
        if (amount <= 0) {
            throw new index_1.ValidationError('Amount must be greater than 0');
        }
        // Verify the from account belongs to the authenticated user
        const fromAccount = await prisma_1.prisma.account.findFirst({
            where: { id: fromAccountId, userId },
        });
        if (!fromAccount) {
            return res.status(404).json({ error: 'Source account not found or unauthorized' });
        }
        // Execute the transfer
        const transfer = await transactionManager.executeTransfer({
            fromAccountId,
            toAccountId,
            amount: parseFloat(amount),
            currency,
            description,
            idempotencyKey,
        });
        res.status(201).json({ transfer });
    }
    catch (error) {
        console.error('Error executing transfer:', error);
        if (error.message.includes('limit exceeded')) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Insufficient balance')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to execute transfer' });
    }
});
/**
 * GET /api/transaction/transfers
 * Get all transfers for the authenticated user
 */
router.get('/transfers', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { limit = '50', offset = '0', status } = req.query;
        // Get all user's accounts
        const accounts = await prisma_1.prisma.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((a) => a.id);
        // Build where clause
        const where = {
            OR: [
                { fromAccountId: { in: accountIds } },
                { toAccountId: { in: accountIds } },
            ],
        };
        if (status) {
            where.status = status;
        }
        const transfers = await prisma_1.prisma.transfer.findMany({
            where,
            include: {
                fromAccount: {
                    select: {
                        id: true,
                        currency: true,
                        type: true,
                    },
                },
                toAccount: {
                    select: {
                        id: true,
                        currency: true,
                        type: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma_1.prisma.transfer.count({ where });
        res.status(200).json({
            transfers,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch transfers' });
    }
});
/**
 * GET /api/transaction/transfers/:id
 * Get a specific transfer by ID
 */
router.get('/transfers/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        // Get all user's accounts
        const accounts = await prisma_1.prisma.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((a) => a.id);
        const transfer = await prisma_1.prisma.transfer.findFirst({
            where: {
                id,
                OR: [
                    { fromAccountId: { in: accountIds } },
                    { toAccountId: { in: accountIds } },
                ],
            },
            include: {
                fromAccount: true,
                toAccount: true,
                appliedFees: {
                    include: {
                        appliedRules: {
                            include: {
                                feeRule: true,
                            },
                        },
                    },
                },
            },
        });
        if (!transfer) {
            return res.status(404).json({ error: 'Transfer not found' });
        }
        res.status(200).json({ transfer });
    }
    catch (error) {
        console.error('Error fetching transfer:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch transfer' });
    }
});
/**
 * POST /api/transaction/calculate-fees
 * Calculate fees for a potential transfer
 */
router.post('/calculate-fees', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { amount, currency, transactionType, fromCountry, toCountry, userTier } = req.body;
        if (!amount || !currency || !transactionType) {
            throw new index_1.ValidationError('amount, currency, and transactionType are required');
        }
        const feeCalculation = await feeEngine.calculateFees({
            amount: new decimal_js_1.Decimal(amount),
            currency,
            transactionType,
            fromCountry: fromCountry || 'US',
            toCountry: toCountry || 'US',
            userTier,
        });
        res.status(200).json({
            feeAmount: feeCalculation.feeAmount.toString(),
            breakdown: {
                fixedFees: feeCalculation.breakdown.fixedFees.toString(),
                percentageFees: feeCalculation.breakdown.percentageFees.toString(),
                discounts: feeCalculation.breakdown.discounts.toString(),
                total: feeCalculation.breakdown.total.toString(),
            },
            appliedRules: feeCalculation.appliedRules,
        });
    }
    catch (error) {
        console.error('Error calculating fees:', error);
        res.status(500).json({ error: error.message || 'Failed to calculate fees' });
    }
});
exports.default = router;
