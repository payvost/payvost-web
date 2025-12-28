/**
 * Comprehensive Validation Schemas using Zod
 * Centralized validation for all API endpoints
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Currency code (ISO 4217)
  currency: z.string().length(3).regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter uppercase ISO code'),

  // Amount validation (positive number with max 2 decimal places)
  amount: z.number()
    .positive('Amount must be greater than 0')
    .finite('Amount must be a finite number')
    .refine(
      (val) => {
        const decimals = (val.toString().split('.')[1] || '').length;
        return decimals <= 2;
      },
      { message: 'Amount cannot have more than 2 decimal places' }
    ),

  // Idempotency key validation
  idempotencyKey: z.string()
    .min(1, 'Idempotency key is required')
    .max(255, 'Idempotency key must be 255 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Idempotency key must be alphanumeric with dashes/underscores'),

  // Country code (ISO 3166-1 alpha-2)
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/, 'Country code must be a 2-letter uppercase ISO code'),

  // Phone number (basic validation)
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

  // Date string (ISO 8601)
  dateString: z.string().datetime('Invalid date format (expected ISO 8601)'),

  // Pagination
  pagination: {
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  },
};

/**
 * Transaction validation schemas
 */
export const transactionSchemas = {
  createTransfer: z.object({
    fromAccountId: z.string().uuid('Invalid fromAccountId format'),
    toAccountId: z.string().uuid('Invalid toAccountId format'),
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
    idempotencyKey: commonSchemas.idempotencyKey,
  }),

  calculateFees: z.object({
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    transactionType: z.enum([
      'INTERNAL_TRANSFER',
      'EXTERNAL_TRANSFER',
      'CARD_PAYMENT',
      'ATM_WITHDRAWAL',
      'DEPOSIT',
      'CURRENCY_EXCHANGE',
    ]),
    fromCountry: commonSchemas.countryCode.optional(),
    toCountry: commonSchemas.countryCode.optional(),
    userTier: z.enum(['STANDARD', 'VERIFIED', 'PREMIUM']).optional(),
  }),

  getQuote: z.object({
    fromAccountId: z.string().uuid('Invalid fromAccountId format'),
    toAccountId: z.string().uuid('Invalid toAccountId format').optional(),
    toUserId: z.string().optional(),
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
  }),

  executeWithQuote: z.object({
    quote: z.object({
      fromAccountId: z.string().uuid(),
      toAccountId: z.string().uuid(),
      amount: z.number(),
      currency: z.string(),
      targetAmount: z.number(),
      targetCurrency: z.string(),
      exchangeRate: z.number(),
      feeAmount: z.number(),
      totalDebitAmount: z.number(),
    }),
    idempotencyKey: commonSchemas.idempotencyKey,
  }),

  getTransfers: z.object({
    limit: commonSchemas.pagination.limit,
    offset: commonSchemas.pagination.offset,
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  }),
};

/**
 * Payment validation schemas
 */
export const paymentSchemas = {
  createPaymentIntent: z.object({
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'WALLET', 'CRYPTO']).optional(),
    recipientDetails: z.object({
      name: z.string().min(1).max(255),
      email: commonSchemas.email.optional(),
      accountNumber: z.string().optional(),
    }).optional(),
    metadata: z.record(z.any()).optional(),
    idempotencyKey: commonSchemas.idempotencyKey,
  }),

  getPaymentStatus: z.object({
    paymentId: z.string().uuid('Invalid paymentId format'),
  }),
};

/**
 * Wallet validation schemas
 */
export const walletSchemas = {
  createAccount: z.object({
    currency: commonSchemas.currency,
    type: z.enum(['PERSONAL', 'BUSINESS']).default('PERSONAL'),
  }),

  deposit: z.object({
    accountId: z.string().uuid('Invalid accountId format'),
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    referenceId: z.string().max(255).optional(),
    description: z.string().max(500).optional(),
    idempotencyKey: commonSchemas.idempotencyKey,
  }),

  deduct: z.object({
    accountId: z.string().uuid('Invalid accountId format'),
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    referenceId: z.string().max(255).optional(),
    description: z.string().max(500).optional(),
    idempotencyKey: commonSchemas.idempotencyKey,
  }),
};

/**
 * User validation schemas
 */
export const userSchemas = {
  updateProfile: z.object({
    name: z.string().min(1).max(255).optional(),
    country: commonSchemas.countryCode.optional(),
    phoneNumber: commonSchemas.phoneNumber.optional(),
  }),

  updateKycStatus: z.object({
    userId: z.string().uuid('Invalid userId format'),
    kycStatus: z.enum(['pending', 'submitted', 'verified', 'rejected']),
  }),
};

/**
 * Helper function to validate request body
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Express middleware for request validation
 */
import { Request, Response, NextFunction } from 'express';

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validateRequestBody(schema, req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.message,
      });
    }
  };
}

