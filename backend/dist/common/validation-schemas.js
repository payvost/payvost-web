"use strict";
/**
 * Comprehensive Validation Schemas using Zod
 * Centralized validation for all API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchemas = exports.walletSchemas = exports.paymentSchemas = exports.transactionSchemas = exports.commonSchemas = void 0;
exports.validateRequestBody = validateRequestBody;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
/**
 * Common validation schemas
 */
exports.commonSchemas = {
    // UUID validation
    uuid: zod_1.z.string().uuid('Invalid UUID format'),
    // Email validation
    email: zod_1.z.string().email('Invalid email format'),
    // Currency code (ISO 4217)
    currency: zod_1.z.string().length(3).regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter uppercase ISO code'),
    // Amount validation (positive number with max 2 decimal places)
    amount: zod_1.z.number()
        .positive('Amount must be greater than 0')
        .finite('Amount must be a finite number')
        .refine((val) => {
        const decimals = (val.toString().split('.')[1] || '').length;
        return decimals <= 2;
    }, { message: 'Amount cannot have more than 2 decimal places' }),
    // Idempotency key validation
    idempotencyKey: zod_1.z.string()
        .min(1, 'Idempotency key is required')
        .max(255, 'Idempotency key must be 255 characters or less')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Idempotency key must be alphanumeric with dashes/underscores'),
    // Country code (ISO 3166-1 alpha-2)
    countryCode: zod_1.z.string().length(2).regex(/^[A-Z]{2}$/, 'Country code must be a 2-letter uppercase ISO code'),
    // Phone number (basic validation)
    phoneNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    // Date string (ISO 8601)
    dateString: zod_1.z.string().datetime('Invalid date format (expected ISO 8601)'),
    // Pagination
    pagination: {
        limit: zod_1.z.number().int().min(1).max(100).default(50),
        offset: zod_1.z.number().int().min(0).default(0),
    },
};
/**
 * Transaction validation schemas
 */
exports.transactionSchemas = {
    createTransfer: zod_1.z.object({
        fromAccountId: zod_1.z.string().uuid('Invalid fromAccountId format'),
        toAccountId: zod_1.z.string().uuid('Invalid toAccountId format'),
        amount: exports.commonSchemas.amount,
        currency: exports.commonSchemas.currency,
        description: zod_1.z.string().max(500, 'Description must be 500 characters or less').optional(),
        idempotencyKey: exports.commonSchemas.idempotencyKey,
    }),
    calculateFees: zod_1.z.object({
        amount: exports.commonSchemas.amount,
        currency: exports.commonSchemas.currency,
        transactionType: zod_1.z.enum([
            'INTERNAL_TRANSFER',
            'EXTERNAL_TRANSFER',
            'CARD_PAYMENT',
            'ATM_WITHDRAWAL',
            'DEPOSIT',
            'CURRENCY_EXCHANGE',
        ]),
        fromCountry: exports.commonSchemas.countryCode.optional(),
        toCountry: exports.commonSchemas.countryCode.optional(),
        userTier: zod_1.z.enum(['STANDARD', 'VERIFIED', 'PREMIUM']).optional(),
    }),
    getTransfers: zod_1.z.object({
        limit: exports.commonSchemas.pagination.limit,
        offset: exports.commonSchemas.pagination.offset,
        status: zod_1.z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    }),
};
/**
 * Payment validation schemas
 */
exports.paymentSchemas = {
    createPaymentIntent: zod_1.z.object({
        amount: exports.commonSchemas.amount,
        currency: exports.commonSchemas.currency,
        paymentMethod: zod_1.z.enum(['CARD', 'BANK_TRANSFER', 'WALLET', 'CRYPTO']).optional(),
        recipientDetails: zod_1.z.object({
            name: zod_1.z.string().min(1).max(255),
            email: exports.commonSchemas.email.optional(),
            accountNumber: zod_1.z.string().optional(),
        }).optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
        idempotencyKey: exports.commonSchemas.idempotencyKey,
    }),
    getPaymentStatus: zod_1.z.object({
        paymentId: zod_1.z.string().uuid('Invalid paymentId format'),
    }),
};
/**
 * Wallet validation schemas
 */
exports.walletSchemas = {
    createAccount: zod_1.z.object({
        currency: exports.commonSchemas.currency,
        type: zod_1.z.enum(['PERSONAL', 'BUSINESS']).default('PERSONAL'),
    }),
    deposit: zod_1.z.object({
        accountId: zod_1.z.string().uuid('Invalid accountId format'),
        amount: exports.commonSchemas.amount,
        currency: exports.commonSchemas.currency,
        referenceId: zod_1.z.string().max(255).optional(),
        description: zod_1.z.string().max(500).optional(),
        idempotencyKey: exports.commonSchemas.idempotencyKey,
    }),
    deduct: zod_1.z.object({
        accountId: zod_1.z.string().uuid('Invalid accountId format'),
        amount: exports.commonSchemas.amount,
        currency: exports.commonSchemas.currency,
        referenceId: zod_1.z.string().max(255).optional(),
        description: zod_1.z.string().max(500).optional(),
        idempotencyKey: exports.commonSchemas.idempotencyKey,
    }),
};
/**
 * User validation schemas
 */
exports.userSchemas = {
    updateProfile: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        country: exports.commonSchemas.countryCode.optional(),
        phoneNumber: exports.commonSchemas.phoneNumber.optional(),
    }),
    updateKycStatus: zod_1.z.object({
        userId: zod_1.z.string().uuid('Invalid userId format'),
        kycStatus: zod_1.z.enum(['pending', 'submitted', 'verified', 'rejected']),
    }),
};
/**
 * Helper function to validate request body
 */
function validateRequestBody(schema, data) {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            throw new Error(`Validation failed: ${messages.join(', ')}`);
        }
        throw error;
    }
}
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            req.body = validateRequestBody(schema, req.body);
            next();
        }
        catch (error) {
            res.status(400).json({
                error: 'Validation failed',
                message: error.message,
            });
        }
    };
}
