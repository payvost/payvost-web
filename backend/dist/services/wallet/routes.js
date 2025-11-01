"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
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
        const accounts = await prisma.account.findMany({
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
        const existing = await prisma.account.findFirst({
            where: { userId, currency, type },
        });
        if (existing) {
            return res.status(409).json({ error: 'Account already exists for this currency' });
        }
        const account = await prisma.account.create({
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
        const account = await prisma.account.findFirst({
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
        const account = await prisma.account.findFirst({
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
        const account = await prisma.account.findFirst({
            where: { id, userId },
        });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        const entries = await prisma.ledgerEntry.findMany({
            where: { accountId: id },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma.ledgerEntry.count({
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
exports.default = router;
