/**
 * Webhook Security Tests
 * Tests for webhook signature verification and replay protection
 */

import { describe, test, expect } from 'vitest';
import { computeRapydWebhookSignature, verifyRapydWebhookSignature } from '../services/rapyd/webhook';

describe('Webhook Security', () => {
  describe('Rapyd Signature Verification', () => {
    const secretKey = 'test-secret-key';
    const accessKey = 'test-access-key';
    const urlPath = 'https://example.com/api/v1/cards/webhooks/rapyd';

    test('should verify valid signature', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const salt = 'testSalt123';
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const validSignature = computeRapydWebhookSignature({
        urlPath,
        salt,
        timestamp,
        accessKey,
        secretKey,
        body,
      });

      const ok = verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature: validSignature, salt, timestamp, access_key: accessKey },
        secretKey,
        body,
      });

      expect(ok.ok).toBe(true);
    });

    test('should reject invalid signature', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const salt = 'testSalt123';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const invalidSignature = 'invalid-signature';

      const ok = verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature: invalidSignature, salt, timestamp, access_key: accessKey },
        secretKey,
        body,
      });
      expect(ok.ok).toBe(false);
    });

    test('should reject old timestamp (replay attack)', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const salt = 'testSalt123';
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400 seconds ago

      const signature = computeRapydWebhookSignature({
        urlPath,
        salt,
        timestamp: oldTimestamp,
        accessKey,
        secretKey,
        body,
      });

      const ok = verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature, salt, timestamp: oldTimestamp, access_key: accessKey },
        secretKey,
        body,
      });
      expect(ok.ok).toBe(false);
    });

    test('should allow any salt format (salt is treated as opaque)', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      const invalidSalt = 'test-salt-with-dashes';
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const signature = computeRapydWebhookSignature({
        urlPath,
        salt: invalidSalt,
        timestamp,
        accessKey,
        secretKey,
        body,
      });

      const ok = verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature, salt: invalidSalt, timestamp, access_key: accessKey },
        secretKey,
        body,
      });
      expect(ok.ok).toBe(true);
    });

    test('should reject missing components', () => {
      const body = JSON.stringify({ type: 'PAYMENT_COMPLETED', id: '123' });
      
      expect(verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature: '', salt: 'salt', timestamp: '1', access_key: accessKey },
        secretKey,
        body,
      }).ok).toBe(false);
      expect(verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature: 'sig', salt: '', timestamp: '1', access_key: accessKey },
        secretKey,
        body,
      }).ok).toBe(false);
      expect(verifyRapydWebhookSignature({
        urlPathCandidates: [urlPath],
        headers: { signature: 'sig', salt: 'salt', timestamp: '', access_key: accessKey },
        secretKey,
        body,
      }).ok).toBe(false);
    });
  });
});

