# Wallet Integration

Learn how to integrate Payvost's multi-currency wallet system into your application.

## Overview

Payvost wallets (also called accounts) allow users to hold, send, and receive money in multiple currencies. Each user can have multiple wallets, one for each supported currency.

## Wallet Types

- **PERSONAL**: Individual user wallets
- **BUSINESS**: Business/merchant wallets with additional features
- **ESCROW**: Hold funds temporarily (requires special approval)

## Supported Currencies

Payvost supports 150+ currencies including:
- Major currencies: USD, EUR, GBP, CAD, AUD, JPY
- African currencies: NGN, GHS, KES, ZAR, UGX, TZS
- Asian currencies: INR, CNY, PHP, THB, IDR
- Latin American currencies: BRL, MXN, ARS, CLP
- And many more...

Check real-time supported currencies:

```bash
curl https://api.payvost.com/v1/currencies \
  -H "Authorization: Bearer sk_live_your_key"
```

## Creating a Wallet

### Prerequisites

- User must be created
- User must complete KYC verification for production (not required in sandbox)

### Create Wallet Request

```javascript
// Node.js
const wallet = await payvost.wallets.create({
  userId: 'usr_1234567890',
  currency: 'USD',
  type: 'PERSONAL'
});

console.log('Wallet ID:', wallet.id);
console.log('Balance:', wallet.balance);
```

```python
# Python
wallet = payvost.Wallet.create(
    user_id='usr_1234567890',
    currency='USD',
    type='PERSONAL'
)

print(f'Wallet ID: {wallet.id}')
print(f'Balance: {wallet.balance}')
```

```bash
# cURL
curl https://api.payvost.com/v1/wallets \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr_1234567890",
    "currency": "USD",
    "type": "PERSONAL"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "acc_9876543210abcdef",
    "userId": "usr_1234567890",
    "currency": "USD",
    "balance": "0.00000000",
    "type": "PERSONAL",
    "status": "active",
    "createdAt": "2025-11-01T10:00:00Z",
    "updatedAt": "2025-11-01T10:00:00Z"
  }
}
```

## Retrieving Wallets

### Get All Wallets for a User

```javascript
// Node.js
const wallets = await payvost.wallets.list({
  userId: 'usr_1234567890'
});

wallets.data.forEach(wallet => {
  console.log(`${wallet.currency}: ${wallet.balance}`);
});
```

```python
# Python
wallets = payvost.Wallet.list(user_id='usr_1234567890')

for wallet in wallets.data:
    print(f'{wallet.currency}: {wallet.balance}')
```

```bash
# cURL
curl https://api.payvost.com/v1/wallets?userId=usr_1234567890 \
  -H "Authorization: Bearer sk_live_your_key"
```

### Get Specific Wallet

```javascript
// Node.js
const wallet = await payvost.wallets.retrieve('acc_9876543210abcdef');

console.log('Currency:', wallet.currency);
console.log('Balance:', wallet.balance);
```

```bash
# cURL
curl https://api.payvost.com/v1/wallets/acc_9876543210abcdef \
  -H "Authorization: Bearer sk_live_your_key"
```

## Checking Wallet Balance

```javascript
// Node.js
const balance = await payvost.wallets.getBalance('acc_9876543210abcdef');

console.log('Available:', balance.available);
console.log('Pending:', balance.pending);
console.log('Total:', balance.total);
```

```python
# Python
balance = payvost.Wallet.get_balance('acc_9876543210abcdef')

print(f'Available: {balance.available}')
print(f'Pending: {balance.pending}')
print(f'Total: {balance.total}')
```

```bash
# cURL
curl https://api.payvost.com/v1/wallets/acc_9876543210abcdef/balance \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": {
    "currency": "USD",
    "available": "1250.00000000",
    "pending": "50.00000000",
    "total": "1300.00000000",
    "lastUpdated": "2025-11-01T10:30:00Z"
  }
}
```

**Balance Types:**
- `available`: Funds ready for withdrawal or transfer
- `pending`: Funds being processed (incoming transfers, pending releases)
- `total`: Sum of available and pending

## Funding a Wallet

### Via Bank Transfer

```javascript
// Node.js - Generate deposit instructions
const instructions = await payvost.wallets.getDepositInstructions(
  'acc_9876543210abcdef',
  {
    amount: '1000.00',
    paymentMethod: 'bank_transfer'
  }
);

console.log('Bank Name:', instructions.bankName);
console.log('Account Number:', instructions.accountNumber);
console.log('Reference:', instructions.reference); // Important: User must include this
```

### Via Card Payment

```javascript
// Node.js - Create payment intent
const paymentIntent = await payvost.payments.create({
  amount: '1000.00',
  currency: 'USD',
  destinationWalletId: 'acc_9876543210abcdef',
  paymentMethod: 'card',
  metadata: {
    description: 'Wallet top-up'
  }
});

// Redirect user to payment page
res.redirect(paymentIntent.paymentUrl);
```

### Via Cryptocurrency

```javascript
// Node.js - Get crypto deposit address
const cryptoAddress = await payvost.wallets.getCryptoAddress(
  'acc_9876543210abcdef',
  {
    cryptoCurrency: 'USDT',
    network: 'TRC20'
  }
);

console.log('Deposit Address:', cryptoAddress.address);
console.log('Network:', cryptoAddress.network);
console.log('Min Amount:', cryptoAddress.minAmount);
```

## Wallet Transactions (Ledger)

Get detailed transaction history for a wallet:

```javascript
// Node.js
const transactions = await payvost.wallets.listTransactions(
  'acc_9876543210abcdef',
  {
    limit: 50,
    offset: 0,
    startDate: '2025-10-01',
    endDate: '2025-11-01',
    type: 'all' // 'credit', 'debit', or 'all'
  }
);

transactions.data.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} ${tx.currency} - ${tx.description}`);
});
```

```python
# Python
transactions = payvost.Wallet.list_transactions(
    'acc_9876543210abcdef',
    limit=50,
    offset=0,
    start_date='2025-10-01',
    end_date='2025-11-01',
    type='all'
)

for tx in transactions.data:
    print(f'{tx.type}: {tx.amount} {tx.currency} - {tx.description}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/wallets/acc_9876543210abcdef/transactions?limit=50&offset=0" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "ledger_abc123xyz",
      "accountId": "acc_9876543210abcdef",
      "amount": "100.00000000",
      "balanceAfter": "1250.00000000",
      "type": "credit",
      "description": "Transfer from John Doe",
      "referenceId": "txn_transfer_xyz",
      "createdAt": "2025-11-01T09:45:00Z"
    },
    {
      "id": "ledger_def456uvw",
      "accountId": "acc_9876543210abcdef",
      "amount": "-50.00000000",
      "balanceAfter": "1150.00000000",
      "type": "debit",
      "description": "Transfer to Jane Smith",
      "referenceId": "txn_transfer_abc",
      "createdAt": "2025-11-01T08:30:00Z"
    }
  ],
  "pagination": {
    "total": 245,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

## Wallet Limits

Each wallet type has different limits:

### Personal Wallets

```javascript
// Get wallet limits
const limits = await payvost.wallets.getLimits('acc_9876543210abcdef');

console.log('Daily Send Limit:', limits.dailySendLimit);
console.log('Daily Receive Limit:', limits.dailyReceiveLimit);
console.log('Monthly Volume:', limits.monthlyVolumeLimit);
```

### Response

```json
{
  "success": true,
  "data": {
    "walletId": "acc_9876543210abcdef",
    "type": "PERSONAL",
    "kycLevel": "verified",
    "limits": {
      "daily": {
        "send": {
          "limit": "10000.00",
          "used": "2500.00",
          "remaining": "7500.00"
        },
        "receive": {
          "limit": "50000.00",
          "used": "5000.00",
          "remaining": "45000.00"
        }
      },
      "monthly": {
        "volume": {
          "limit": "100000.00",
          "used": "25000.00",
          "remaining": "75000.00"
        }
      },
      "transaction": {
        "maxSingleTransaction": "5000.00",
        "minSingleTransaction": "1.00"
      }
    }
  }
}
```

## Freezing/Unfreezing Wallets

For security or compliance reasons, you may need to freeze a wallet:

```javascript
// Freeze wallet
await payvost.wallets.freeze('acc_9876543210abcdef', {
  reason: 'Suspicious activity detected',
  metadata: {
    alertId: 'fraud_alert_123'
  }
});

// Unfreeze wallet
await payvost.wallets.unfreeze('acc_9876543210abcdef');
```

```bash
# Freeze
curl https://api.payvost.com/v1/wallets/acc_9876543210abcdef/freeze \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -d '{
    "reason": "Suspicious activity detected"
  }'

# Unfreeze
curl https://api.payvost.com/v1/wallets/acc_9876543210abcdef/unfreeze \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key"
```

## Multi-Currency Conversion

Convert between currencies within wallets:

```javascript
// Node.js
const conversion = await payvost.wallets.convert({
  fromWalletId: 'acc_usd_wallet',
  toWalletId: 'acc_eur_wallet',
  amount: '1000.00',
  fromCurrency: 'USD',
  toCurrency: 'EUR'
});

console.log('Exchange Rate:', conversion.rate);
console.log('Amount Debited:', conversion.debitAmount);
console.log('Amount Credited:', conversion.creditAmount);
console.log('Fee:', conversion.fee);
```

```python
# Python
conversion = payvost.Wallet.convert(
    from_wallet_id='acc_usd_wallet',
    to_wallet_id='acc_eur_wallet',
    amount='1000.00',
    from_currency='USD',
    to_currency='EUR'
)

print(f'Exchange Rate: {conversion.rate}')
print(f'Amount Debited: {conversion.debit_amount}')
print(f'Amount Credited: {conversion.credit_amount}')
print(f'Fee: {conversion.fee}')
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "conv_abc123xyz",
    "fromWalletId": "acc_usd_wallet",
    "toWalletId": "acc_eur_wallet",
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "rate": "0.92",
    "debitAmount": "1000.00",
    "creditAmount": "920.00",
    "fee": "2.50",
    "status": "completed",
    "completedAt": "2025-11-01T10:00:00Z"
  }
}
```

## Wallet Statements

Generate and download wallet statements:

```javascript
// Node.js
const statement = await payvost.wallets.generateStatement(
  'acc_9876543210abcdef',
  {
    format: 'pdf', // or 'csv', 'xlsx'
    startDate: '2025-10-01',
    endDate: '2025-10-31',
    includeMetadata: true
  }
);

// Download URL valid for 1 hour
console.log('Download URL:', statement.downloadUrl);
```

```bash
# cURL
curl https://api.payvost.com/v1/wallets/acc_9876543210abcdef/statement \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -d '{
    "format": "pdf",
    "startDate": "2025-10-01",
    "endDate": "2025-10-31"
  }'
```

## Webhooks for Wallet Events

Subscribe to wallet events:

```javascript
// Webhook endpoint example
app.post('/webhooks/payvost', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'wallet.created':
      console.log('New wallet created:', event.data.id);
      break;
      
    case 'wallet.balance_updated':
      console.log('Balance updated:', event.data.balance);
      break;
      
    case 'wallet.transaction_created':
      console.log('New transaction:', event.data.transaction);
      break;
      
    case 'wallet.frozen':
      console.log('Wallet frozen:', event.data.reason);
      break;
  }
  
  res.json({ received: true });
});
```

## Error Handling

```javascript
try {
  const wallet = await payvost.wallets.create({
    userId: 'usr_123',
    currency: 'USD',
    type: 'PERSONAL'
  });
} catch (error) {
  switch(error.code) {
    case 'kyc_required':
      console.error('User must complete KYC verification');
      break;
      
    case 'duplicate_wallet':
      console.error('User already has a wallet in this currency');
      break;
      
    case 'unsupported_currency':
      console.error('Currency not supported');
      break;
      
    case 'insufficient_funds':
      console.error('Insufficient balance for operation');
      break;
      
    default:
      console.error('Error:', error.message);
  }
}
```

## Best Practices

1. **Check KYC Status**: Always verify user KYC status before creating wallets in production
2. **Handle Pending Balances**: Consider pending balances in your UI/UX
3. **Cache Balance Queries**: Avoid excessive balance checks; use webhooks for updates
4. **Idempotency**: Use idempotency keys for wallet operations
5. **Security**: Implement wallet PIN/2FA for sensitive operations
6. **Limit Management**: Monitor user limits and notify before they're reached

## Next Steps

- **[Transfer & Remittance](./05-transfer-remittance.md)** - Send money between wallets
- **[Payment Processing](./04-payment-processing.md)** - Accept payments into wallets
- **[Currency Exchange](./07-currency-exchange.md)** - Real-time exchange rates
