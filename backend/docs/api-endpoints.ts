/**
 * API Endpoints Definition
 * Centralized definition of all API endpoints for documentation
 */

import { ApiEndpoint } from './openapi-generator';

export const apiEndpoints: ApiEndpoint[] = [
  // Transaction Endpoints
  {
    method: 'POST',
    path: '/api/v1/transaction/transfer',
    summary: 'Execute a transfer between accounts',
    description: 'Transfer funds from one account to another. Requires KYC verification and idempotency key.',
    tags: ['Transactions'],
    security: [{ bearerAuth: [] }],
    requestBody: {
      type: 'object',
      required: ['fromAccountId', 'toAccountId', 'amount', 'currency', 'idempotencyKey'],
      properties: {
        fromAccountId: { type: 'string', format: 'uuid' },
        toAccountId: { type: 'string', format: 'uuid' },
        amount: { type: 'number', minimum: 0.01, maximum: 1000000 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$', example: 'USD' },
        description: { type: 'string', maxLength: 500 },
        idempotencyKey: { type: 'string', minLength: 1, maxLength: 255 },
      },
    },
    responses: {
      '201': {
        description: 'Transfer created successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Transfer' },
          },
        },
      },
      '400': {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      '401': {
        description: 'Authentication required',
      },
      '403': {
        description: 'KYC verification required',
      },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/transaction/transfers',
    summary: 'Get transaction history',
    description: 'Retrieve all transfers for the authenticated user',
    tags: ['Transactions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        description: 'Number of results to return',
      },
      {
        name: 'offset',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 0, default: 0 },
        description: 'Number of results to skip',
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
        description: 'Filter by status',
      },
    ],
    responses: {
      '200': {
        description: 'List of transfers',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                transfers: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Transfer' },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Authentication required',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/transaction/calculate-fees',
    summary: 'Calculate transaction fees',
    description: 'Calculate fees for a potential transfer before execution',
    tags: ['Transactions'],
    security: [{ bearerAuth: [] }],
    requestBody: {
      type: 'object',
      required: ['amount', 'currency', 'transactionType'],
      properties: {
        amount: { type: 'number', minimum: 0.01 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        transactionType: {
          type: 'string',
          enum: ['INTERNAL_TRANSFER', 'EXTERNAL_TRANSFER', 'CARD_PAYMENT', 'ATM_WITHDRAWAL', 'DEPOSIT', 'CURRENCY_EXCHANGE'],
        },
        fromCountry: { type: 'string', pattern: '^[A-Z]{2}$' },
        toCountry: { type: 'string', pattern: '^[A-Z]{2}$' },
        userTier: { type: 'string', enum: ['STANDARD', 'VERIFIED', 'PREMIUM'] },
      },
    },
    responses: {
      '200': {
        description: 'Fee calculation result',
      },
      '400': {
        description: 'Validation error',
      },
    },
  },
  // Wallet Endpoints
  {
    method: 'GET',
    path: '/api/v1/wallet/accounts',
    summary: 'Get user accounts',
    description: 'Retrieve all accounts for the authenticated user',
    tags: ['Wallets'],
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'List of accounts',
      },
      '401': {
        description: 'Authentication required',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/wallet/accounts',
    summary: 'Create new account',
    description: 'Create a new account for the authenticated user. Requires KYC verification.',
    tags: ['Wallets'],
    security: [{ bearerAuth: [] }],
    requestBody: {
      type: 'object',
      required: ['currency'],
      properties: {
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        type: { type: 'string', enum: ['PERSONAL', 'BUSINESS'], default: 'PERSONAL' },
      },
    },
    responses: {
      '201': {
        description: 'Account created successfully',
      },
      '403': {
        description: 'KYC verification required',
      },
    },
  },
  // Payment Endpoints
  {
    method: 'POST',
    path: '/api/v1/payment/create-intent',
    summary: 'Create payment intent',
    description: 'Create a payment intent for processing a payment. Requires idempotency key.',
    tags: ['Payments'],
    security: [{ bearerAuth: [] }],
    requestBody: {
      type: 'object',
      required: ['amount', 'currency', 'idempotencyKey'],
      properties: {
        amount: { type: 'number', minimum: 0.01 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        paymentMethod: { type: 'string', enum: ['CARD', 'BANK_TRANSFER', 'WALLET', 'CRYPTO'] },
        idempotencyKey: { type: 'string', minLength: 1, maxLength: 255 },
      },
    },
    responses: {
      '200': {
        description: 'Payment intent created',
      },
      '400': {
        description: 'Validation error or duplicate idempotency key',
      },
    },
  },
];

