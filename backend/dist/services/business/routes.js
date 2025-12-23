"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const prisma_1 = require("../../common/prisma");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = (0, express_1.Router)();
/**
 * GET /api/business/dashboard
 * Get business dashboard data
 */
router.get('/dashboard', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get user's business account (first BUSINESS type account)
        const businessAccount = await prisma_1.prisma.account.findFirst({
            where: {
                userId,
                type: 'BUSINESS',
            },
        });
        if (!businessAccount) {
            return res.status(404).json({ error: 'Business account not found' });
        }
        const accountBalance = Number(businessAccount.balance);
        const accountCurrency = businessAccount.currency;
        // Get pending payouts (external transactions with PAYOUT type and pending status)
        const pendingPayouts = await prisma_1.prisma.externalTransaction.findMany({
            where: {
                userId,
                type: 'PAYOUT',
                status: 'PENDING',
            },
            select: {
                amount: true,
            },
        });
        const pendingPayoutsTotal = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingPayoutsCount = pendingPayouts.length;
        // Get open invoices (business invoices with PENDING or OVERDUE status)
        const openInvoices = await prisma_1.prisma.invoice.findMany({
            where: {
                createdBy: userId,
                invoiceType: 'BUSINESS',
                status: {
                    in: ['PENDING', 'OVERDUE'],
                },
            },
            select: {
                grandTotal: true,
            },
        });
        const openInvoicesCount = openInvoices.length;
        const openInvoicesAmount = openInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
        // Get new customers (users who made transactions in the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTransactions = await prisma_1.prisma.transfer.findMany({
            where: {
                toAccount: {
                    userId,
                },
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            select: {
                fromAccount: {
                    select: {
                        userId: true,
                    },
                },
            },
            distinct: ['fromAccountId'],
        });
        const newCustomers = recentTransactions.length;
        const previousWeekCustomers = await prisma_1.prisma.transfer.findMany({
            where: {
                toAccount: {
                    userId,
                },
                createdAt: {
                    gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
                    lt: sevenDaysAgo,
                },
            },
            select: {
                fromAccount: {
                    select: {
                        userId: true,
                    },
                },
            },
            distinct: ['fromAccountId'],
        });
        const newCustomersChange = newCustomers - previousWeekCustomers.length;
        // Get recent transactions
        const recentTxs = await prisma_1.prisma.transfer.findMany({
            where: {
                OR: [
                    { fromAccount: { userId } },
                    { toAccount: { userId } },
                ],
            },
            include: {
                fromAccount: true,
                toAccount: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });
        const recentTransactionsData = recentTxs.map((tx) => ({
            id: tx.id,
            type: tx.toAccount.userId === userId ? 'Credit' : 'Debit',
            description: tx.description || `${tx.type} Transaction`,
            amount: tx.toAccount.userId === userId ? Number(tx.amount) : -Number(tx.amount),
            date: tx.createdAt.toISOString(),
            status: tx.status === 'COMPLETED' ? 'Completed' : tx.status === 'PENDING' ? 'Pending' : 'Failed',
            currency: tx.currency,
        }));
        res.json({
            accountBalance,
            accountCurrency,
            accountName: 'Business Account', // Could be fetched from user profile
            pendingPayouts: Number(pendingPayoutsTotal),
            pendingPayoutsCount,
            openInvoices: openInvoicesCount,
            openInvoicesAmount: Number(openInvoicesAmount),
            newCustomers,
            newCustomersChange,
            recentTransactions: recentTransactionsData,
        });
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /api/business/transactions
 * Get business transactions with filtering
 */
router.get('/transactions', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { status, type, search, limit = '50', offset = '0' } = req.query;
        const where = {
            OR: [
                { fromAccount: { userId } },
                { toAccount: { userId } },
            ],
        };
        if (status && status !== 'all') {
            where.status = status === 'Completed' ? 'COMPLETED' : status === 'Pending' ? 'PENDING' : 'FAILED';
        }
        if (search) {
            where.description = {
                contains: search,
                mode: 'insensitive',
            };
        }
        const transactions = await prisma_1.prisma.transfer.findMany({
            where,
            include: {
                fromAccount: true,
                toAccount: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const formattedTransactions = transactions.map((tx) => ({
            id: tx.id,
            type: tx.toAccount.userId === userId ? 'Credit' : 'Debit',
            description: tx.description || `${tx.type} Transaction`,
            amount: tx.toAccount.userId === userId ? Number(tx.amount) : -Number(tx.amount),
            date: tx.createdAt.toISOString(),
            status: tx.status === 'COMPLETED' ? 'Completed' : tx.status === 'PENDING' ? 'Pending' : 'Failed',
            currency: tx.currency,
            createdAt: tx.createdAt.toISOString(),
        }));
        res.json({
            transactions: formattedTransactions,
            total: formattedTransactions.length,
        });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * POST /api/business/payouts
 * Create a payout
 */
router.post('/payouts', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { recipientType, savedRecipientId, recipientName, accountNumber, bank, amount, currency, narration, fundingSource, saveBeneficiary, } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!currency) {
            return res.status(400).json({ error: 'Currency is required' });
        }
        // Get business account
        const businessAccount = await prisma_1.prisma.account.findFirst({
            where: {
                userId,
                type: 'BUSINESS',
                currency,
            },
        });
        if (!businessAccount) {
            return res.status(404).json({ error: 'Business account not found for this currency' });
        }
        if (Number(businessAccount.balance) < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        // Create external transaction for payout
        // Note: Need to determine provider based on bank/recipient details
        // For now, using a default provider - this should be enhanced
        const payout = await prisma_1.prisma.externalTransaction.create({
            data: {
                userId,
                type: 'PAYOUT',
                amount: amount,
                currency,
                status: 'PENDING',
                provider: 'PAYSTACK', // Default provider - should be determined based on recipient details
                recipientDetails: {
                    recipientType,
                    savedRecipientId,
                    recipientName,
                    accountNumber,
                    bank,
                },
                metadata: {
                    fundingSource,
                    narration: narration || `Payout to ${recipientName || 'recipient'}`,
                },
            },
        });
        // If saveBeneficiary is true, save to Firestore
        if (saveBeneficiary && recipientName && accountNumber) {
            const beneficiariesRef = firebase_admin_1.default.firestore().collection('beneficiaries');
            await beneficiariesRef.add({
                userId,
                name: recipientName,
                accountNumber,
                bank,
                currency,
                createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
        }
        res.status(201).json({
            id: payout.id,
            status: payout.status,
            message: 'Payout created successfully',
        });
    }
    catch (error) {
        console.error('Error creating payout:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
exports.default = router;
