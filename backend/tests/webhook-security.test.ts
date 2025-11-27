/**
 * Webhook Security Tests
 * Tests for webhook signature verification and replay protection
 */

import { describe, test, expect } from 'vitest';
import { createHmac } from 'crypto';

describe('Webhook Security', () => {
  describe('Rapyd Signature Verification', () => {
    const secretKey = 'test-secret-key';
    
    function verifyRapydSignature(
      body: string,
      signature: string,
      salt: string,
      timestamp: string
    ): boolean {
      if (!signature || !salt || !timestamp || !secretKey) {
        return false;
      }

      try {
        // Validate timestamp (5 minute window)
        const timestampNum = parseInt(timestamp, 10);
        if (isNaN(timestampNum)) {
          return false;
        }

        const now = Math.floor(Date.now() / 1000);
        const timestampAge = Math.abs(now - timestampNum);
        const MAX_TIMESTAMP_AGE = 300; // 5 minutes

        if (timestampAge > MAX_TIMESTAMP_AGE) {
          return false;
        }

        // Validate salt format
        if (!/^[a-zA-Z0-9]+$/.test(salt)) {
          return false;
        }

        // Calculate expected signature
        const toSign = `${salt}${timestamp}${body}`;
        const expectedSignature = createHmac('sha256', secretKey)
          .update(toSign)
          .digest('hex');

        // Constant-time comparison
        if (signature.length !== expectedSignature.length) {
          return false;
        }

        let result = 0;
        for (let i = 0; i < signature.length; i++) {
          result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
        }
        
        return result === 0;
      } catch (error) {
        return false;
      }
    }

    test('should verify valid signature', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const salt = 'testSalt123';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      
      const toSign = `${salt}${timestamp}${body}`;
      const validSignature = createHmac('sha256', secretKey)
        .update(toSign)
        .digest('hex');

      expect(verifyRapydSignature(body, validSignature, salt, timestamp)).toBe(true);
    });

    test('should reject invalid signature', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const salt = 'testSalt123';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const invalidSignature = 'invalid-signature';

      expect(verifyRapydSignature(body, invalidSignature, salt, timestamp)).toBe(false);
    });

    test('should reject old timestamp (replay attack)', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const salt = 'testSalt123';
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400 seconds ago
      
      const toSign = `${salt}${oldTimestamp}${body}`;
      const signature = createHmac('sha256', secretKey)
        .update(toSign)
        .digest('hex');

      expect(verifyRapydSignature(body, signature, salt, oldTimestamp)).toBe(false);
    });

    test('should reject invalid salt format', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const invalidSalt = 'test-salt-with-dashes';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      
      const toSign = `${invalidSalt}${timestamp}${body}`;
      const signature = createHmac('sha256', secretKey)
        .update(toSign)
        .digest('hex');

      expect(verifyRapydSignature(body, signature, invalidSalt, timestamp)).toBe(false);
    });

    test('should reject missing components', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      
      expect(verifyRapydSignature(body, '', 'salt', 'timestamp')).toBe(false);
      expect(verifyRapydSignature(body, 'signature', '', 'timestamp')).toBe(false);
      expect(verifyRapydSignature(body, 'signature', 'salt', '')).toBe(false);
    });
  });
});

