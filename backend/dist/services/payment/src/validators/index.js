"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAmount = validateAmount;
exports.validateCurrency = validateCurrency;
exports.validateIdempotencyKey = validateIdempotencyKey;
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN'];
function validateAmount(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error('Invalid amount');
    }
    if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }
    // Check for precision (max 2 decimal places)
    if (Math.round(amount * 100) / 100 !== amount) {
        throw new Error('Amount cannot have more than 2 decimal places');
    }
}
function validateCurrency(currency) {
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
    }
}
async function validateIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
        throw new Error('Valid idempotency key is required');
    }
    // Check if this key has been used before
    // This would typically check against a database
    // return !await db.payments.exists({ idempotencyKey });
}
