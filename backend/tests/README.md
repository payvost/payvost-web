# Backend Test Suite

## Overview

Comprehensive test suite for Payvost backend services, covering:
- Security features (authentication, validation, rate limiting)
- Transaction processing
- Webhook security
- API endpoints
- Business logic
- E2E payment flows

## Running Tests

### Install Dependencies
```bash
cd backend
npm install
npm install --save-dev vitest @vitest/ui
```

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- security.test.ts
npm test -- e2e/payment-flow.test.ts
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

### Run Tests with Coverage
```bash
npm test:coverage
```

## Test Structure

```
backend/tests/
├── security.test.ts              # Security features (validation, auth)
├── webhook-security.test.ts      # Webhook signature verification
├── transaction-manager.test.ts   # Transaction processing
├── fee-engine.test.ts            # Fee calculation
├── fraud-detection.test.ts       # Fraud detection logic
├── e2e/
│   └── payment-flow.test.ts      # End-to-end payment flows
└── README.md                     # This file
```

## Test Categories

### Unit Tests
Test individual functions and classes in isolation:
- Input validation schemas
- Business logic functions
- Utility functions
- Security utilities

### Integration Tests
Test API endpoints with real database:
- Authentication flows
- Transaction processing
- Webhook handling
- Service interactions

### E2E Tests
Test complete user journeys:
- Full payment flow (AML → Fraud → Transfer → Audit)
- Idempotency enforcement
- Error handling scenarios

### Security Tests
Test security features:
- Rate limiting
- Input validation
- Authentication middleware
- Webhook signature verification
- Idempotency enforcement

## Writing New Tests

### Example: Testing an API Endpoint

```typescript
import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Transaction API', () => {
  test('POST /api/v1/transaction/transfer requires authentication', async () => {
    const response = await request(app)
      .post('/api/v1/transaction/transfer')
      .send({
        fromAccountId: 'test-id',
        toAccountId: 'test-id-2',
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'test-key',
      });
    
    expect(response.status).toBe(401);
  });
});
```

### Example: Testing Validation

```typescript
import { validateRequestBody, transactionSchemas } from '../common/validation-schemas';

test('should reject invalid amount', () => {
  const invalidData = {
    fromAccountId: 'valid-uuid',
    toAccountId: 'valid-uuid-2',
    amount: -100, // Invalid: negative
    currency: 'USD',
    idempotencyKey: 'test-key',
  };
  
  expect(() => validateRequestBody(transactionSchemas.createTransfer, invalidData)).toThrow();
});
```

### Example: E2E Test

```typescript
describe('E2E Payment Flow', () => {
  test('should complete full transfer flow', async () => {
    // 1. Check AML compliance
    const amlCheck = await complianceManager.checkAMLCompliance({...});
    
    // 2. Check fraud risk
    const fraudCheck = await complianceManager.checkFraudRisk({...});
    
    // 3. Execute transfer
    const transfer = await transactionManager.executeTransfer({...});
    
    // 4. Verify results
    expect(transfer.status).toBe('COMPLETED');
  });
});
```

## Test Database

Tests use a separate test database. Set the `TEST_DATABASE_URL` environment variable:

```bash
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/payvost_test"
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterAll` hooks
3. **Mocking**: Mock external services (payment providers, email, etc.)
4. **Coverage**: Aim for >80% code coverage
5. **Naming**: Use descriptive test names that explain what is being tested
6. **E2E Tests**: Test complete user journeys, not just individual functions

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

See `.github/workflows/ci.yml` for CI configuration.

## Test Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: All critical endpoints
- **E2E Tests**: Main user flows
- **Security Tests**: All security features

## Debugging Tests

Run tests with debugging:
```bash
node --inspect-brk node_modules/.bin/vitest --runInBand
```

Then attach your debugger to the Node process.
