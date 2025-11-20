"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferFunds = transferFunds;
exports.getAccountBalance = getAccountBalance;
exports.createAccount = createAccount;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../common/prisma");
// Use Prisma enum - fallback to string if not available
const TransactionTypeEnum = client_1.TransactionType || {
    INTERNAL_TRANSFER: 'INTERNAL_TRANSFER',
    EXTERNAL_TRANSFER: 'EXTERNAL_TRANSFER',
    CARD_PAYMENT: 'CARD_PAYMENT',
    ATM_WITHDRAWAL: 'ATM_WITHDRAWAL',
    DEPOSIT: 'DEPOSIT',
    CURRENCY_EXCHANGE: 'CURRENCY_EXCHANGE',
};
/**
 * Idempotent funds transfer between accounts using Prisma transactions.
 * - Ensures idempotency via idempotencyKey stored on Transfer
 * - Locks account rows using FOR UPDATE to avoid race conditions
 */
async function transferFunds(fromAccountId, toAccountId, amount, currency, idempotencyKey, description) {
    const amountStr = typeof amount === 'string' ? amount : amount.toString();
    try {
        // Quick idempotency check outside tx to avoid unnecessary work
        if (idempotencyKey) {
            const existing = await prisma_1.prisma.transfer.findUnique({ where: { idempotencyKey } });
            if (existing) {
                return { success: true, transferId: existing.id };
            }
        }
        const transfer = await prisma_1.prisma.$transaction(async (tx) => {
            // Lock the two accounts to perform safe balance checks and updates
            const lockedRows = await tx.$queryRaw `
        SELECT id, balance
        FROM "Account"
        WHERE id IN (${fromAccountId}, ${toAccountId})
        FOR UPDATE
      `;
            const fromRow = lockedRows.find((r) => r.id === fromAccountId);
            const toRow = lockedRows.find((r) => r.id === toAccountId);
            if (!fromRow || !toRow) {
                throw new Error('Account not found or currency mismatch');
            }
            const fromBalance = parseFloat(fromRow.balance);
            const toBalance = parseFloat(toRow.balance);
            const amt = parseFloat(amountStr);
            if (isNaN(amt) || amt <= 0) {
                throw new Error('Invalid transfer amount');
            }
            if (fromBalance < amt) {
                throw new Error('Insufficient funds');
            }
            // Create transfer record (pending -> completed)
            const created = await tx.transfer.create({
                data: {
                    fromAccountId,
                    toAccountId,
                    amount: amountStr,
                    currency,
                    status: 'completed',
                    type: TransactionTypeEnum.INTERNAL_TRANSFER,
                    idempotencyKey: idempotencyKey ?? null,
                    description: description ?? null,
                },
            });
            // Update balances
            const newFrom = (fromBalance - amt).toFixed(8);
            const newTo = (toBalance + amt).toFixed(8);
            await tx.account.update({ where: { id: fromAccountId }, data: { balance: newFrom } });
            await tx.account.update({ where: { id: toAccountId }, data: { balance: newTo } });
            // Ledger entries
            await tx.ledgerEntry.create({
                data: {
                    accountId: fromAccountId,
                    amount: `-${amountStr}`,
                    balanceAfter: newFrom,
                    type: 'debit',
                    description: description ?? 'transfer',
                    referenceId: created.id,
                },
            });
            await tx.ledgerEntry.create({
                data: {
                    accountId: toAccountId,
                    amount: amountStr,
                    balanceAfter: newTo,
                    type: 'credit',
                    description: description ?? 'transfer',
                    referenceId: created.id,
                },
            });
            return created;
        });
        return { success: true, transferId: transfer.id };
    }
    catch (err) {
        return { success: false, error: err.message ?? String(err) };
    }
}
async function getAccountBalance(accountId) {
    const res = await prisma_1.prisma.account.findUnique({ where: { id: accountId }, select: { balance: true, currency: true } });
    if (!res)
        return null;
    return res;
}
async function createAccount(userId, currency) {
    const res = await prisma_1.prisma.account.create({ data: { userId, currency, balance: '0' } });
    return res.id;
}
exports.default = prisma_1.prisma;
