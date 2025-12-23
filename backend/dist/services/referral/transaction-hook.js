"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onTransactionCompleted = onTransactionCompleted;
const index_1 = require("./index");
const decimal_js_1 = require("decimal.js");
/**
 * Hook to be called when a transaction is completed
 * This will check if it's the user's first transaction and process referral rewards
 */
async function onTransactionCompleted(userId, amount, currency) {
    try {
        const amountDecimal = typeof amount === 'string' || typeof amount === 'number'
            ? new decimal_js_1.Decimal(amount)
            : amount;
        await index_1.referralService.processFirstTransaction(userId, amountDecimal, currency);
    }
    catch (error) {
        // Don't fail transaction if referral processing fails
        console.error('Error processing referral reward for transaction:', error);
    }
}
