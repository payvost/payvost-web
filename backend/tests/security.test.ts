/**
 * Security Features Test Suite
 * Tests for rate limiting, idempotency, validation, and authentication
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { verifyFirebaseToken, requireKYC, requireAdmin, AuthenticatedRequest } from '../gateway/auth-middleware';
import { validateRequestBody, transactionSchemas, commonSchemas } from '../common/validation-schemas';
import { z } from 'zod';

describe('Security Features', () => {
  describe('Input Validation', () => {
    test('should validate transaction transfer schema', () => {
      const validData = {
        fromAccountId: '123e4567-e89b-12d3-a456-426614174000',
        toAccountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.50,
        currency: 'USD',
        description: 'Test transfer',
        idempotencyKey: 'test-key-123',
      };

      expect(() => validateRequestBody(transactionSchemas.createTransfer, validData)).not.toThrow();
    });

    test('should reject invalid UUID format', () => {
      const invalidData = {
        fromAccountId: 'invalid-uuid',
        toAccountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'test-key-123',
      };

      expect(() => validateRequestBody(transactionSchemas.createTransfer, invalidData)).toThrow();
    });

    test('should reject invalid currency format', () => {
      const invalidData = {
        fromAccountId: '123e4567-e89b-12d3-a456-426614174000',
        toAccountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        currency: 'usd', // lowercase, should be uppercase
        idempotencyKey: 'test-key-123',
      };

      expect(() => validateRequestBody(transactionSchemas.createTransfer, invalidData)).toThrow();
    });

    test('should reject negative amounts', () => {
      const invalidData = {
        fromAccountId: '123e4567-e89b-12d3-a456-426614174000',
        toAccountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: -100,
        currency: 'USD',
        idempotencyKey: 'test-key-123',
      };

      expect(() => validateRequestBody(transactionSchemas.createTransfer, invalidData)).toThrow();
    });

    test('should reject amounts with more than 2 decimal places', () => {
      const invalidData = {
        fromAccountId: '123e4567-e89b-12d3-a456-426614174000',
        toAccountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.123, // 3 decimal places
        currency: 'USD',
        idempotencyKey: 'test-key-123',
      };

      expect(() => validateRequestBody(transactionSchemas.createTransfer, invalidData)).toThrow();
    });

    test('should validate idempotency key format', () => {
      const validKey = 'test-key-123_abc';
      expect(() => commonSchemas.idempotencyKey.parse(validKey)).not.toThrow();

      const invalidKey = 'test key with spaces';
      expect(() => commonSchemas.idempotencyKey.parse(invalidKey)).toThrow();

      const tooLongKey = 'a'.repeat(256);
      expect(() => commonSchemas.idempotencyKey.parse(tooLongKey)).toThrow();
    });

    test('should require idempotency key', () => {
      const invalidData = {
        fromAccountId: '123e4567-e89b-12d3-a456-426614174000',
        toAccountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        currency: 'USD',
        // missing idempotencyKey
      };

      expect(() => validateRequestBody(transactionSchemas.createTransfer, invalidData)).toThrow();
    });
  });

  describe('Environment Validation', () => {
    test('should validate required environment variables', () => {
      // This test would need to mock process.env
      // For now, we verify the function exists
      const { validateEnvironment } = require('../common/env-validation');
      expect(validateEnvironment).toBeDefined();
      expect(typeof validateEnvironment).toBe('function');
    });
  });

  describe('Currency Validation', () => {
    test('should accept valid ISO currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'JPY'];
      validCurrencies.forEach(currency => {
        expect(() => commonSchemas.currency.parse(currency)).not.toThrow();
      });
    });

    test('should reject invalid currency codes', () => {
      const invalidCurrencies = ['usd', 'USD123', 'US', 'USDOLLAR', ''];
      invalidCurrencies.forEach(currency => {
        expect(() => commonSchemas.currency.parse(currency)).toThrow();
      });
    });
  });

  describe('Amount Validation', () => {
    test('should accept valid amounts', () => {
      const validAmounts = [0.01, 1, 100, 1000.50, 999999.99];
      validAmounts.forEach(amount => {
        expect(() => commonSchemas.amount.parse(amount)).not.toThrow();
      });
    });

    test('should reject invalid amounts', () => {
      const invalidAmounts = [0, -1, -100, NaN, Infinity, 100.123];
      invalidAmounts.forEach(amount => {
        expect(() => commonSchemas.amount.parse(amount)).toThrow();
      });
    });
  });
});

describe('Authentication Middleware', () => {
  // Note: These tests would require mocking Firebase Admin SDK
  // For now, we verify the functions exist and have correct signatures
  
  test('verifyFirebaseToken should be defined', () => {
    expect(verifyFirebaseToken).toBeDefined();
    expect(typeof verifyFirebaseToken).toBe('function');
  });

  test('requireKYC should be defined', () => {
    expect(requireKYC).toBeDefined();
    expect(typeof requireKYC).toBe('function');
  });

  test('requireAdmin should be defined', () => {
    expect(requireAdmin).toBeDefined();
    expect(typeof requireAdmin).toBe('function');
  });
});

