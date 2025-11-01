# Testing & Sandbox Environment

Comprehensive guide to testing your Payvost integration using the sandbox environment.

## Overview

Payvost provides a full-featured sandbox environment for testing:
- **Complete API parity** with production
- **Test data** that mirrors production scenarios
- **No real money** transactions
- **Unlimited testing**
- **Isolated environment** from production

## Environment URLs

```
Sandbox API: https://sandbox-api.payvost.com
Sandbox Dashboard: https://sandbox-dashboard.payvost.com
Sandbox Payment Page: https://sandbox-pay.payvost.com
```

## Getting Started

### 1. Create Sandbox Account

Sign up for a sandbox account at:
```
https://sandbox-dashboard.payvost.com/signup
```

### 2. Get Test API Keys

```javascript
// Sandbox keys always start with test prefix
const publishableKey = 'pk_test_1234567890abcdef';
const secretKey = 'sk_test_1234567890abcdef';
```

### 3. Configure SDK for Sandbox

```javascript
// Node.js
const Payvost = require('@payvost/node-sdk');

const payvost = new Payvost({
  apiKey: 'sk_test_1234567890abcdef',
  environment: 'sandbox'
});
```

```python
# Python
import payvost

payvost.api_key = 'sk_test_1234567890abcdef'
payvost.environment = 'sandbox'
```

```php
<?php
// PHP
\Payvost\Payvost::setApiKey('sk_test_1234567890abcdef');
\Payvost\Payvost::setEnvironment('sandbox');
```

## Test Data

### Test Users

Pre-created test users in sandbox:

```javascript
// Verified user with KYC
{
  email: 'verified.user@payvost-test.com',
  password: 'Test123!',
  kycStatus: 'verified',
  tier: 'VERIFIED'
}

// Pending KYC user
{
  email: 'pending.user@payvost-test.com',
  password: 'Test123!',
  kycStatus: 'pending',
  tier: 'STANDARD'
}

// Rejected KYC user
{
  email: 'rejected.user@payvost-test.com',
  password: 'Test123!',
  kycStatus: 'rejected',
  tier: 'STANDARD'
}
```

### Create Test Users

```javascript
// Node.js
const testUser = await payvost.users.create({
  email: 'test@example.com',
  name: 'Test User',
  password: 'Test123!',
  country: 'US'
});

console.log('Test User ID:', testUser.id);
```

## Test Cards

### Card Numbers

Use these test card numbers for different scenarios:

```javascript
// Success scenarios
const successCard = {
  number: '4242424242424242',
  expMonth: '12',
  expYear: '2028',
  cvc: '123'
};

// Decline scenarios
const declinedCard = {
  number: '4000000000000002',
  expMonth: '12',
  expYear: '2028',
  cvc: '123'
};

// Insufficient funds
const insufficientFundsCard = {
  number: '4000000000009995',
  expMonth: '12',
  expYear: '2028',
  cvc: '123'
};

// Expired card
const expiredCard = {
  number: '4000000000000069',
  expMonth: '12',
  expYear: '2020', // Past date
  cvc: '123'
};

// Invalid CVC
const invalidCVCCard = {
  number: '4000000000000127',
  expMonth: '12',
  expYear: '2028',
  cvc: '999' // Will fail CVC check
};

// 3D Secure required
const threeDSecureCard = {
  number: '4000000000003220',
  expMonth: '12',
  expYear: '2028',
  cvc: '123'
};

// Processing error
const processingErrorCard = {
  number: '4000000000000119',
  expMonth: '12',
  expYear: '2028',
  cvc: '123'
};
```

### Test Card by Country

```javascript
// US
US: '4242424242424242'

// UK
GB: '4000008260000000'

// EU
EU: '4000000000000424'

// Canada
CA: '4000001240000000'

// Australia
AU: '4000000360000006'
```

## Test Bank Accounts

### Bank Transfer Testing

```javascript
// Successful bank account
const successBankAccount = {
  accountNumber: '000123456789',
  routingNumber: '110000000',
  accountType: 'checking',
  accountHolderName: 'Test User'
};

// Failed verification
const failedBankAccount = {
  accountNumber: '000111111116',
  routingNumber: '110000000',
  accountType: 'checking',
  accountHolderName: 'Test User'
};

// Insufficient funds
const insufficientBankAccount = {
  accountNumber: '000111111113',
  routingNumber: '110000000',
  accountType: 'checking',
  accountHolderName: 'Test User'
};
```

## Test Mobile Money

### Mobile Money Numbers

```javascript
// M-Pesa (Kenya) - Success
{
  provider: 'mpesa',
  phoneNumber: '+254712345678'
}

// M-Pesa - Failed
{
  provider: 'mpesa',
  phoneNumber: '+254712345679'
}

// M-Pesa - Timeout
{
  provider: 'mpesa',
  phoneNumber: '+254712345680'
}

// MTN Mobile Money (Uganda) - Success
{
  provider: 'mtn',
  phoneNumber: '+256712345678'
}

// Airtel Money (Tanzania) - Success
{
  provider: 'airtel',
  phoneNumber: '+255712345678'
}
```

## Testing Scenarios

### 1. Payment Flow Testing

```javascript
// Node.js - Test successful payment
async function testSuccessfulPayment() {
  const payment = await payvost.payments.create({
    amount: '99.99',
    currency: 'USD',
    paymentMethod: 'card',
    cardToken: await createTestCardToken('4242424242424242'),
    destinationWalletId: 'acc_test_123',
    customer: {
      email: 'test@example.com'
    }
  });
  
  console.log('Payment Status:', payment.status);
  assert(payment.status === 'succeeded');
}

// Test declined payment
async function testDeclinedPayment() {
  try {
    const payment = await payvost.payments.create({
      amount: '99.99',
      currency: 'USD',
      cardToken: await createTestCardToken('4000000000000002')
    });
  } catch (error) {
    console.log('Expected error:', error.code);
    assert(error.code === 'card_declined');
  }
}
```

### 2. Transfer Testing

```javascript
// Node.js - Test successful transfer
async function testTransfer() {
  // Create test wallets
  const senderWallet = await createTestWallet('USD', '1000.00');
  const recipientWallet = await createTestWallet('USD', '0.00');
  
  // Execute transfer
  const transfer = await payvost.transfers.create({
    fromWalletId: senderWallet.id,
    toWalletId: recipientWallet.id,
    amount: '100.00',
    currency: 'USD',
    idempotencyKey: `test_${Date.now()}`
  });
  
  console.log('Transfer Status:', transfer.status);
  assert(transfer.status === 'completed');
  
  // Verify balances
  const senderBalance = await payvost.wallets.getBalance(senderWallet.id);
  const recipientBalance = await payvost.wallets.getBalance(recipientWallet.id);
  
  assert(senderBalance.available === '900.00');
  assert(recipientBalance.available === '100.00');
}

// Test insufficient funds
async function testInsufficientFunds() {
  const senderWallet = await createTestWallet('USD', '50.00');
  const recipientWallet = await createTestWallet('USD', '0.00');
  
  try {
    await payvost.transfers.create({
      fromWalletId: senderWallet.id,
      toWalletId: recipientWallet.id,
      amount: '100.00',
      currency: 'USD'
    });
  } catch (error) {
    console.log('Expected error:', error.code);
    assert(error.code === 'insufficient_funds');
  }
}
```

### 3. KYC Testing

```javascript
// Node.js - Test KYC submission
async function testKYCSubmission() {
  const user = await payvost.users.create({
    email: `test.kyc.${Date.now()}@example.com`,
    name: 'Test User',
    country: 'US'
  });
  
  // Submit KYC with test documents
  const kyc = await payvost.users.submitKYC(user.id, {
    documentType: 'passport',
    documentNumber: 'TEST123456',
    issuingCountry: 'US',
    expiryDate: '2030-12-31',
    documents: [
      {
        type: 'identity_front',
        file: getTestDocumentBase64()
      }
    ]
  });
  
  console.log('KYC Status:', kyc.status);
  
  // In sandbox, you can force KYC approval
  await payvost.testing.approveKYC(user.id);
  
  const updatedStatus = await payvost.users.getKYCStatus(user.id);
  assert(updatedStatus.status === 'verified');
}
```

### 4. Webhook Testing

```javascript
// Node.js - Test webhook delivery
async function testWebhooks() {
  // Use a webhook testing service like webhook.site or ngrok
  const webhookUrl = 'https://your-test-webhook.site/webhook';
  
  // Create webhook
  const webhook = await payvost.webhooks.create({
    url: webhookUrl,
    events: ['payment.succeeded', 'transfer.completed']
  });
  
  // Trigger test event
  await payvost.testing.triggerWebhook(webhook.id, {
    eventType: 'payment.succeeded',
    data: {
      id: 'pay_test_123',
      amount: '99.99',
      currency: 'USD'
    }
  });
  
  // Verify webhook received at your endpoint
}
```

## Sandbox-Only Features

### Reset Test Data

```javascript
// Node.js - Reset all sandbox data
await payvost.testing.resetAllData();

// Reset specific user data
await payvost.testing.resetUserData('usr_test_123');

// Reset wallet balances
await payvost.testing.resetWalletBalances('usr_test_123');
```

### Simulate Time Travel

```javascript
// Node.js - Advance time for testing scheduled transfers
await payvost.testing.advanceTime({
  hours: 24
});

// Reset time
await payvost.testing.resetTime();
```

### Force Transaction States

```javascript
// Node.js - Force transaction to fail
await payvost.testing.forceTransactionState('txn_test_123', 'failed', {
  reason: 'insufficient_funds'
});

// Force KYC verification
await payvost.testing.forceKYCState('usr_test_123', 'verified');

// Force fraud alert
await payvost.testing.forceFraudAlert('usr_test_123', {
  type: 'unusual_activity',
  severity: 'high'
});
```

### Simulate Network Issues

```javascript
// Node.js - Simulate API timeout
await payvost.testing.simulateTimeout({
  endpoint: '/v1/transfers',
  duration: 5000 // 5 seconds
});

// Simulate rate limiting
await payvost.testing.simulateRateLimit({
  duration: 60000 // 1 minute
});
```

## Testing Best Practices

### 1. Use Test Mode Indicators

```javascript
// Always check if in test mode
if (payvost.isTestMode()) {
  console.log('Running in test mode');
  // Show test mode banner in UI
}
```

### 2. Idempotency Testing

```javascript
// Test idempotency
async function testIdempotency() {
  const idempotencyKey = `test_idem_${Date.now()}`;
  
  // First request
  const transfer1 = await payvost.transfers.create({
    fromWalletId: 'acc_test_1',
    toWalletId: 'acc_test_2',
    amount: '100.00',
    currency: 'USD',
    idempotencyKey: idempotencyKey
  });
  
  // Duplicate request (should return same result)
  const transfer2 = await payvost.transfers.create({
    fromWalletId: 'acc_test_1',
    toWalletId: 'acc_test_2',
    amount: '100.00',
    currency: 'USD',
    idempotencyKey: idempotencyKey
  });
  
  assert(transfer1.id === transfer2.id);
}
```

### 3. Error Handling Testing

```javascript
// Test all error scenarios
async function testErrorHandling() {
  const errorScenarios = [
    { card: '4000000000000002', expectedError: 'card_declined' },
    { card: '4000000000009995', expectedError: 'insufficient_funds' },
    { card: '4000000000000069', expectedError: 'expired_card' },
    { card: '4000000000000127', expectedError: 'invalid_cvc' }
  ];
  
  for (const scenario of errorScenarios) {
    try {
      await payvost.payments.create({
        amount: '100.00',
        currency: 'USD',
        cardToken: await createTestCardToken(scenario.card)
      });
      throw new Error('Should have failed');
    } catch (error) {
      assert(error.code === scenario.expectedError);
      console.log(`✓ ${scenario.expectedError} handled correctly`);
    }
  }
}
```

### 4. Load Testing

```javascript
// Test concurrent requests
async function loadTest() {
  const promises = [];
  
  for (let i = 0; i < 100; i++) {
    promises.push(
      payvost.wallets.getBalance('acc_test_123')
    );
  }
  
  const results = await Promise.all(promises);
  console.log('Completed 100 concurrent requests');
  
  // Verify rate limiting
  try {
    for (let i = 0; i < 1000; i++) {
      await payvost.wallets.getBalance('acc_test_123');
    }
  } catch (error) {
    assert(error.code === 'rate_limit_exceeded');
    console.log('✓ Rate limiting working correctly');
  }
}
```

## Integration Tests

### Complete Integration Test Suite

```javascript
// Node.js with Jest
describe('Payvost Integration Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    payvost.configure({
      apiKey: 'sk_test_1234567890abcdef',
      environment: 'sandbox'
    });
  });
  
  afterAll(async () => {
    // Cleanup test data
    await payvost.testing.resetAllData();
  });
  
  test('Create user and wallet', async () => {
    const user = await payvost.users.create({
      email: `test.${Date.now()}@example.com`,
      name: 'Test User',
      country: 'US'
    });
    
    expect(user.id).toBeDefined();
    
    const wallet = await payvost.wallets.create({
      userId: user.id,
      currency: 'USD',
      type: 'PERSONAL'
    });
    
    expect(wallet.id).toBeDefined();
    expect(wallet.balance).toBe('0.00000000');
  });
  
  test('Process payment', async () => {
    const payment = await payvost.payments.create({
      amount: '99.99',
      currency: 'USD',
      cardToken: await createTestCardToken('4242424242424242'),
      destinationWalletId: 'acc_test_123'
    });
    
    expect(payment.status).toBe('succeeded');
  });
  
  test('Execute transfer', async () => {
    const transfer = await payvost.transfers.create({
      fromWalletId: 'acc_test_1',
      toWalletId: 'acc_test_2',
      amount: '100.00',
      currency: 'USD'
    });
    
    expect(transfer.status).toBe('completed');
  });
});
```

## Debugging Tools

### API Request Logging

```javascript
// Node.js - Enable request logging
payvost.setDebug(true);

// Logs all API requests
// POST https://sandbox-api.payvost.com/v1/transfers
// Request: { fromWalletId: 'acc_...', amount: '100.00' }
// Response: { id: 'txn_...', status: 'completed' }
```

### Webhook Debugger

Access webhook logs in sandbox dashboard:
```
https://sandbox-dashboard.payvost.com/webhooks/logs
```

### API Request Inspector

View all API requests in sandbox dashboard:
```
https://sandbox-dashboard.payvost.com/api/requests
```

## Migration to Production

### Pre-Launch Checklist

```javascript
// Checklist before going live
const preLaunchChecklist = {
  'API Keys': {
    '✓ Switched to production keys': true,
    '✓ Removed test keys from code': true,
    '✓ Keys stored securely': true
  },
  'Testing': {
    '✓ All integration tests passing': true,
    '✓ Error handling tested': true,
    '✓ Webhooks tested': true
  },
  'Security': {
    '✓ HTTPS enabled': true,
    '✓ Webhook signatures verified': true,
    '✓ API keys not in client-side code': true
  },
  'Compliance': {
    '✓ KYC flow tested': true,
    '✓ AML checks configured': true,
    '✓ Terms of service displayed': true
  }
};
```

### Switch to Production

```javascript
// Node.js - Switch to production
const Payvost = require('@payvost/node-sdk');

const payvost = new Payvost({
  apiKey: process.env.PAYVOST_LIVE_KEY, // Use live key
  environment: 'production' // Switch to production
});

// Verify production mode
if (!payvost.isTestMode()) {
  console.log('Running in PRODUCTION mode');
}
```

## Support and Debugging

### Sandbox Limitations

- Data resets periodically (90 days)
- Rate limits are higher than production
- Some third-party integrations may not work
- Test data is not guaranteed to persist

### Getting Help

- **Documentation**: https://docs.payvost.com
- **Sandbox Dashboard**: https://sandbox-dashboard.payvost.com
- **Support**: sandbox-support@payvost.com
- **Community**: https://community.payvost.com

## Next Steps

- **[Getting Started](./01-getting-started.md)** - Basic integration
- **[Payment Processing](./04-payment-processing.md)** - Payment testing
- **[Transfer & Remittance](./05-transfer-remittance.md)** - Transfer testing
- **[Webhooks](./08-webhook-notifications.md)** - Webhook testing
