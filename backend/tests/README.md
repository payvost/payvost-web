# Backend Tests

Integration and unit tests for the Payvost backend services.

## Test Structure

```
backend/tests/
├── transaction-manager.test.ts  # Transfer execution tests
├── fee-engine.test.ts           # Fee calculation tests
├── wallet-api.test.ts           # Wallet service API tests
├── transaction-api.test.ts      # Transaction service API tests
└── README.md                    # This file
```

## Running Tests

### All Tests
```bash
cd backend
npm test
```

### Specific Test File
```bash
npm test -- transaction-manager.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Coverage

### Transaction Manager Tests
- ✅ Simple transfer execution
- ✅ Idempotency key handling
- ✅ Insufficient balance validation
- ✅ Currency mismatch validation
- ✅ Daily/monthly transfer limits

### Fee Engine Tests
- ✅ Fixed fee calculation
- ✅ Percentage fee calculation
- ✅ Multi-currency support
- ✅ Tier-based discounts
- ✅ Multiple fee rules application

### Wallet API Tests
- Account creation (requires KYC)
- Account listing
- Balance inquiries
- Ledger entry retrieval
- Multi-currency accounts

### Transaction API Tests
- Transfer execution with authentication
- Transaction history
- Fee calculation endpoint
- Idempotency validation
- KYC requirement enforcement

## Test Database

Tests use a separate test database to avoid affecting production/development data.

Set the `DATABASE_URL` environment variable for tests:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/payvost_test"
```

## Prerequisites

Install test dependencies:
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

## Writing New Tests

### Unit Tests
Test individual functions and classes in isolation:
```typescript
import { MyService } from '../services/my-service';

describe('MyService', () => {
  test('should do something', () => {
    const service = new MyService();
    expect(service.doSomething()).toBe(expected);
  });
});
```

### Integration Tests
Test API endpoints with real database:
```typescript
import request from 'supertest';
import app from '../index';

describe('API Tests', () => {
  test('GET /api/wallet/accounts', async () => {
    const response = await request(app)
      .get('/api/wallet/accounts')
      .set('Authorization', 'Bearer ' + testToken);
    
    expect(response.status).toBe(200);
    expect(response.body.accounts).toBeDefined();
  });
});
```

## CI/CD Integration

Tests should be run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

Example GitHub Actions workflow:
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
```

## Test Data

Test data is created in `beforeAll` hooks and cleaned up in `afterAll` hooks to ensure test isolation.

### Best Practices
- Always clean up test data after tests
- Use unique identifiers for test data
- Don't rely on execution order
- Test both success and error cases
- Mock external services
- Use factories for test data creation

## Debugging Tests

Run tests with debugging:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then attach your debugger to the Node process.
