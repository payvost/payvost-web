"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const prisma_1 = require("../../common/prisma");
const router = (0, express_1.Router)();
/**
 * GET /api/wallet/accounts
 * Get all accounts for the authenticated user
 */
router.get('/accounts', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const accounts = await prisma_1.prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ accounts });
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch accounts' });
    }
});
/**
 * POST /api/wallet/accounts
 * Create a new account for the authenticated user
 */
router.post('/accounts', middleware_1.verifyFirebaseToken, middleware_1.requireKYC, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { currency, type = 'PERSONAL' } = req.body;
        if (!currency) {
            throw new index_1.ValidationError('Currency is required');
        }
        // Check if user already has an account in this currency
        const existing = await prisma_1.prisma.account.findFirst({
            where: { userId, currency, type },
        });
        if (existing) {
            return res.status(409).json({ error: 'Account already exists for this currency' });
        }
        const account = await prisma_1.prisma.account.create({
            data: {
                userId,
                currency,
                type,
                balance: 0,
            },
        });
        res.status(201).json({ account });
    }
    catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: error.message || 'Failed to create account' });
    }
});
/**
 * GET /api/wallet/accounts/:id
 * Get a specific account by ID
 */
router.get('/accounts/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        const account = await prisma_1.prisma.account.findFirst({
            where: { id, userId },
            include: {
                ledgerEntries: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.status(200).json({ account });
    }
    catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch account' });
    }
});
/**
 * GET /api/wallet/accounts/:id/balance
 * Get the balance of a specific account
 */
router.get('/accounts/:id/balance', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        const account = await prisma_1.prisma.account.findFirst({
            where: { id, userId },
            select: { balance: true, currency: true },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.status(200).json({
            balance: account.balance.toString(),
            currency: account.currency,
        });
    }
    catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch balance' });
    }
});
/**
 * GET /api/wallet/accounts/:id/ledger
 * Get ledger entries for a specific account
 */
router.get('/accounts/:id/ledger', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        const { limit = '50', offset = '0' } = req.query;
        // Verify account belongs to user
        const account = await prisma_1.prisma.account.findFirst({
            where: { id, userId },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        const entries = await prisma_1.prisma.ledgerEntry.findMany({
            where: { accountId: id },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma_1.prisma.ledgerEntry.count({
            where: { accountId: id },
        });
        res.status(200).json({
            entries,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (error) {
        console.error('Error fetching ledger entries:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch ledger entries' });
    }
});
/**
 * POST /api/wallet/deduct
 * Deduct balance from an account for external transactions
 */
router.post('/deduct', middleware_1.verifyFirebaseToken, middleware_1.requireKYC, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { accountId, amount, currency, description, referenceId } = req.body;
        if (!accountId || !amount || !currency) {
            throw new index_1.ValidationError('accountId, amount, and currency are required');
        }
        if (amount <= 0) {
            throw new index_1.ValidationError('Amount must be greater than 0');
        }
        // Verify account belongs to user
        const account = await prisma_1.prisma.account.findFirst({
            where: { id: accountId, userId },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found or unauthorized' });
        }
        if (account.currency !== currency) {
            return res.status(400).json({ error: 'Currency mismatch' });
        }
        // Deduct balance in a transaction
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Lock account for update
            const lockedAccount = await tx.$queryRaw `
        SELECT id, balance
        FROM "Account"
        WHERE id = ${accountId}
        FOR UPDATE
      `;
            const accountData = lockedAccount[0];
            if (!accountData) {
                throw new Error('Account not found');
            }
            const currentBalance = parseFloat(accountData.balance);
            const deductAmount = parseFloat(amount.toString());
            if (currentBalance < deductAmount) {
                throw new Error('Insufficient funds');
            }
            const newBalance = (currentBalance - deductAmount).toFixed(8);
            // Update account balance
            await tx.account.update({
                where: { id: accountId },
                data: { balance: newBalance },
            });
            // Create ledger entry
            await tx.ledgerEntry.create({
                data: {
                    accountId,
                    amount: `-${deductAmount}`,
                    balanceAfter: newBalance,
                    type: 'DEBIT',
                    description: description || 'External transaction payment',
                    referenceId: referenceId || null,
                },
            });
            return {
                accountId,
                amount: deductAmount,
                currency,
                previousBalance: currentBalance,
                newBalance: parseFloat(newBalance),
            };
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error('Error deducting balance:', error);
        if (error.message === 'Insufficient funds') {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        res.status(500).json({ error: error.message || 'Failed to deduct balance' });
    }
});
/**
 * POST /api/wallet/refund
 * Refund balance to an account (for failed external transactions)
 */
router.post('/refund', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { accountId, amount, currency, description, referenceId } = req.body;
        if (!accountId || !amount || !currency) {
            throw new index_1.ValidationError('accountId, amount, and currency are required');
        }
        if (amount <= 0) {
            throw new index_1.ValidationError('Amount must be greater than 0');
        }
        // Verify account belongs to user (or allow system refunds)
        const account = await prisma_1.prisma.account.findFirst({
            where: { id: accountId },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // For system refunds, allow even if userId doesn't match
        // For user-initiated refunds, verify ownership
        if (userId && account.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (account.currency !== currency) {
            return res.status(400).json({ error: 'Currency mismatch' });
        }
        // Refund balance in a transaction
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Lock account for update
            const lockedAccount = await tx.$queryRaw `
        SELECT id, balance
        FROM "Account"
        WHERE id = ${accountId}
        FOR UPDATE
      `;
            const accountData = lockedAccount[0];
            if (!accountData) {
                throw new Error('Account not found');
            }
            const currentBalance = parseFloat(accountData.balance);
            const refundAmount = parseFloat(amount.toString());
            const newBalance = (currentBalance + refundAmount).toFixed(8);
            // Update account balance
            await tx.account.update({
                where: { id: accountId },
                data: { balance: newBalance },
            });
            // Create ledger entry
            await tx.ledgerEntry.create({
                data: {
                    accountId,
                    amount: refundAmount.toString(),
                    balanceAfter: newBalance,
                    type: 'CREDIT',
                    description: description || 'Refund for failed transaction',
                    referenceId: referenceId || null,
                },
            });
            return {
                accountId,
                amount: refundAmount,
                currency,
                previousBalance: currentBalance,
                newBalance: parseFloat(newBalance),
            };
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error('Error refunding balance:', error);
        res.status(500).json({ error: error.message || 'Failed to refund balance' });
    }
});
exports.default = router;
