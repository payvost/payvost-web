# Multi-Currency Account Management

Manage multiple currency accounts for your users with seamless currency conversion.

## Overview

Payvost's Multi-Currency Account system allows:
- **Multiple currency wallets per user**
- **Automatic currency conversion**
- **Cross-currency transfers**
- **Real-time exchange rates**
- **Currency hedging options**
- **Consolidated balance views**

## Account Structure

Each user can have multiple accounts (wallets), one for each currency:

```
User
├── USD Account (Primary)
├── EUR Account
├── GBP Account
├── NGN Account
└── KES Account
```

## Creating Multi-Currency Accounts

### Create Multiple Accounts

```javascript
// Node.js
const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'KES'];

for (const currency of currencies) {
  const account = await payvost.wallets.create({
    userId: 'usr_abc123',
    currency: currency,
    type: 'PERSONAL'
  });
  
  console.log(`Created ${currency} account:`, account.id);
}
```

```python
# Python
currencies = ['USD', 'EUR', 'GBP', 'NGN', 'KES']

for currency in currencies:
    account = payvost.Wallet.create(
        user_id='usr_abc123',
        currency=currency,
        type='PERSONAL'
    )
    
    print(f'Created {currency} account: {account.id}')
```

### Bulk Account Creation

```javascript
// Node.js
const accounts = await payvost.wallets.createBulk({
  userId: 'usr_abc123',
  currencies: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'JPY'],
  type: 'PERSONAL'
});

console.log('Created accounts:', accounts.length);
accounts.forEach(account => {
  console.log(`${account.currency}: ${account.id}`);
});
```

## Get All User Accounts

### List All Accounts with Balances

```javascript
// Node.js
const accounts = await payvost.wallets.list({
  userId: 'usr_abc123',
  includeBalance: true
});

let totalUSD = 0;
accounts.data.forEach(account => {
  console.log(`${account.currency}: ${account.balance}`);
  // Convert to USD for total
  totalUSD += parseFloat(account.balanceUSD);
});

console.log('Total (USD equivalent):', totalUSD);
```

```python
# Python
accounts = payvost.Wallet.list(
    user_id='usr_abc123',
    include_balance=True
)

total_usd = 0
for account in accounts.data:
    print(f'{account.currency}: {account.balance}')
    total_usd += float(account.balance_usd)

print(f'Total (USD equivalent): {total_usd}')
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "acc_usd_123",
      "userId": "usr_abc123",
      "currency": "USD",
      "balance": "5000.00",
      "balanceUSD": "5000.00",
      "type": "PERSONAL",
      "isPrimary": true
    },
    {
      "id": "acc_eur_456",
      "userId": "usr_abc123",
      "currency": "EUR",
      "balance": "3000.00",
      "balanceUSD": "3264.35",
      "type": "PERSONAL",
      "isPrimary": false
    },
    {
      "id": "acc_ngn_789",
      "userId": "usr_abc123",
      "currency": "NGN",
      "balance": "1000000.00",
      "balanceUSD": "632.91",
      "type": "PERSONAL",
      "isPrimary": false
    }
  ],
  "summary": {
    "totalAccounts": 3,
    "totalBalanceUSD": "8897.26",
    "activeCurrencies": ["USD", "EUR", "NGN"]
  }
}
```

## Consolidated Balance View

### Get Consolidated Balance

```javascript
// Node.js
const consolidated = await payvost.wallets.getConsolidatedBalance('usr_abc123', {
  targetCurrency: 'USD'
});

console.log('Total Balance (USD):', consolidated.totalBalance);
console.log('Number of currencies:', consolidated.currencies.length);

consolidated.currencies.forEach(curr => {
  console.log(`${curr.code}: ${curr.balance} = ${curr.balanceConverted} USD`);
});
```

### Response

```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "targetCurrency": "USD",
    "totalBalance": "8897.26",
    "currencies": [
      {
        "code": "USD",
        "balance": "5000.00",
        "balanceConverted": "5000.00",
        "exchangeRate": "1.0000",
        "percentage": "56.2"
      },
      {
        "code": "EUR",
        "balance": "3000.00",
        "balanceConverted": "3264.35",
        "exchangeRate": "1.0881",
        "percentage": "36.7"
      },
      {
        "code": "NGN",
        "balance": "1000000.00",
        "balanceConverted": "632.91",
        "exchangeRate": "0.0006329",
        "percentage": "7.1"
      }
    ],
    "lastUpdated": "2025-11-01T10:00:00Z"
  }
}
```

## Cross-Currency Transfers

### Transfer Between Different Currencies

```javascript
// Node.js
const transfer = await payvost.transfers.create({
  fromWalletId: 'acc_usd_123',
  toWalletId: 'acc_eur_456',
  amount: '1000.00',
  sourceCurrency: 'USD',
  destinationCurrency: 'EUR',
  autoConvert: true,
  description: 'Currency conversion'
});

console.log('Debited:', transfer.debitAmount, 'USD');
console.log('Credited:', transfer.creditAmount, 'EUR');
console.log('Exchange Rate:', transfer.exchangeRate);
console.log('Conversion Fee:', transfer.conversionFee);
```

```python
# Python
transfer = payvost.Transfer.create(
    from_wallet_id='acc_usd_123',
    to_wallet_id='acc_eur_456',
    amount='1000.00',
    source_currency='USD',
    destination_currency='EUR',
    auto_convert=True,
    description='Currency conversion'
)

print(f'Debited: {transfer.debit_amount} USD')
print(f'Credited: {transfer.credit_amount} EUR')
print(f'Exchange Rate: {transfer.exchange_rate}')
print(f'Conversion Fee: {transfer.conversion_fee}')
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "txn_conversion_abc123",
    "type": "currency_conversion",
    "fromWalletId": "acc_usd_123",
    "toWalletId": "acc_eur_456",
    "sourceCurrency": "USD",
    "destinationCurrency": "EUR",
    "debitAmount": "1000.00",
    "creditAmount": "920.00",
    "exchangeRate": "0.9200",
    "conversionFee": "2.50",
    "status": "completed",
    "completedAt": "2025-11-01T10:00:00Z"
  }
}
```

## Primary Currency Management

### Set Primary Currency

```javascript
// Node.js
await payvost.wallets.setPrimary('acc_eur_456');

console.log('EUR account set as primary');
```

### Get Primary Account

```javascript
// Node.js
const primaryAccount = await payvost.wallets.getPrimary('usr_abc123');

console.log('Primary currency:', primaryAccount.currency);
console.log('Balance:', primaryAccount.balance);
```

## Currency Conversion

### Manual Currency Conversion

```javascript
// Node.js
const conversion = await payvost.exchange.convert({
  fromWalletId: 'acc_usd_123',
  toWalletId: 'acc_eur_456',
  amount: '500.00',
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  lockRate: true,
  lockDuration: 300 // 5 minutes
});

console.log('Conversion ID:', conversion.id);
console.log('Rate locked until:', conversion.rateLockedUntil);
```

### Get Conversion Quote

```javascript
// Node.js
const quote = await payvost.exchange.getQuote({
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  amount: '1000.00'
});

console.log('You send:', quote.fromAmount, 'USD');
console.log('They receive:', quote.toAmount, 'EUR');
console.log('Exchange rate:', quote.rate);
console.log('Fee:', quote.fee);
console.log('Total cost:', quote.totalCost);
console.log('Quote valid until:', quote.expiresAt);
```

## Auto-Conversion Rules

### Create Auto-Conversion Rule

```javascript
// Node.js
const rule = await payvost.wallets.createAutoConversionRule({
  userId: 'usr_abc123',
  sourceCurrency: 'EUR',
  targetCurrency: 'USD',
  trigger: 'balance_threshold',
  thresholdAmount: '5000.00',
  conversionAmount: 'all', // or specific amount
  enabled: true
});

console.log('Rule ID:', rule.id);
```

### Auto-Convert on Receipt

```javascript
// Node.js
const rule = await payvost.wallets.createAutoConversionRule({
  userId: 'usr_abc123',
  sourceCurrency: 'NGN',
  targetCurrency: 'USD',
  trigger: 'on_receipt',
  minAmount: '100.00',
  enabled: true
});

// Now, when NGN is received, it's automatically converted to USD
```

## Currency Exchange History

### Get Conversion History

```javascript
// Node.js
const history = await payvost.exchange.getHistory({
  userId: 'usr_abc123',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  currencies: ['USD', 'EUR', 'GBP'],
  limit: 50
});

history.data.forEach(conv => {
  console.log(`${conv.fromCurrency} → ${conv.toCurrency}: ${conv.fromAmount} @ ${conv.rate}`);
});
```

## Multi-Currency Payments

### Accept Payments in Multiple Currencies

```javascript
// Node.js
const payment = await payvost.payments.create({
  amount: '99.99',
  currency: 'USD',
  allowedCurrencies: ['USD', 'EUR', 'GBP'], // Customer can choose
  destinationWalletId: 'acc_usd_123',
  autoConvert: true, // Convert to destination currency
  customer: {
    email: 'customer@example.com'
  }
});

console.log('Payment URL:', payment.paymentUrl);
```

### Customer Selects Currency

The payment page allows customers to choose their preferred currency:

```javascript
// Customer sees:
// Pay $99.99 USD
// or €91.99 EUR  
// or £79.99 GBP
```

## Currency-Specific Limits

### Set Currency-Specific Limits

```javascript
// Node.js
await payvost.wallets.setLimits('acc_eur_456', {
  daily: {
    send: '10000.00',
    receive: '50000.00'
  },
  monthly: {
    send: '100000.00',
    receive: '500000.00'
  },
  transaction: {
    min: '10.00',
    max: '5000.00'
  }
});
```

### Get Limits Across All Currencies

```javascript
// Node.js
const limits = await payvost.wallets.getAllLimits('usr_abc123', {
  convertTo: 'USD'
});

limits.data.forEach(limit => {
  console.log(`${limit.currency}: Daily ${limit.daily.remaining} (${limit.daily.remainingUSD} USD)`);
});
```

## Balance Alerts

### Set Balance Alerts

```javascript
// Node.js
const alert = await payvost.wallets.createAlert({
  walletId: 'acc_eur_456',
  type: 'low_balance',
  threshold: '100.00',
  notificationMethod: 'email',
  enabled: true
});

// Alert when EUR balance drops below 100.00
```

### Multi-Currency Balance Alert

```javascript
// Node.js
const alert = await payvost.wallets.createAlert({
  userId: 'usr_abc123',
  type: 'total_balance',
  targetCurrency: 'USD',
  threshold: '1000.00',
  notificationMethod: 'email'
});

// Alert when total balance (all currencies) drops below $1000 USD equivalent
```

## Currency Hedging

### Lock Exchange Rate

```javascript
// Node.js
const hedge = await payvost.exchange.lockRate({
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  amount: '10000.00',
  duration: 86400, // 24 hours
  purpose: 'future_payment'
});

console.log('Hedge ID:', hedge.id);
console.log('Locked rate:', hedge.rate);
console.log('Valid until:', hedge.expiresAt);

// Use the locked rate later
const conversion = await payvost.exchange.convert({
  hedgeId: hedge.id,
  fromWalletId: 'acc_usd_123',
  toWalletId: 'acc_eur_456',
  amount: '10000.00'
});
```

## Reporting

### Multi-Currency Statement

```javascript
// Node.js
const statement = await payvost.reports.generateMultiCurrencyStatement({
  userId: 'usr_abc123',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  currencies: ['USD', 'EUR', 'GBP', 'NGN'],
  format: 'pdf',
  consolidatedView: true,
  targetCurrency: 'USD'
});

console.log('Statement URL:', statement.downloadUrl);
```

### Currency Exposure Report

```javascript
// Node.js
const exposure = await payvost.analytics.getCurrencyExposure('usr_abc123');

exposure.data.forEach(curr => {
  console.log(`${curr.code}: ${curr.percentage}% of total balance`);
  console.log(`Risk level: ${curr.riskLevel}`);
});
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "code": "USD",
      "balance": "5000.00",
      "percentage": "56.2",
      "riskLevel": "low",
      "volatility": "low"
    },
    {
      "code": "EUR",
      "balance": "3000.00",
      "percentage": "36.7",
      "riskLevel": "low",
      "volatility": "low"
    },
    {
      "code": "NGN",
      "balance": "1000000.00",
      "percentage": "7.1",
      "riskLevel": "medium",
      "volatility": "high"
    }
  ]
}
```

## Batch Operations

### Batch Currency Conversion

```javascript
// Node.js
const batchConversion = await payvost.exchange.convertBatch({
  conversions: [
    {
      fromWalletId: 'acc_usd_123',
      toWalletId: 'acc_eur_456',
      amount: '1000.00'
    },
    {
      fromWalletId: 'acc_usd_123',
      toWalletId: 'acc_gbp_789',
      amount: '500.00'
    },
    {
      fromWalletId: 'acc_eur_456',
      toWalletId: 'acc_ngn_012',
      amount: '200.00'
    }
  ]
});

console.log('Batch ID:', batchConversion.id);
console.log('Total conversions:', batchConversion.totalConversions);
console.log('Success:', batchConversion.successCount);
console.log('Failed:', batchConversion.failedCount);
```

## Webhooks

Subscribe to multi-currency events:

```javascript
// Node.js webhook handler
app.post('/webhooks/currency', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'currency.conversion_completed':
      console.log('Conversion completed:', event.data.id);
      console.log(`${event.data.fromAmount} ${event.data.fromCurrency} → ${event.data.toAmount} ${event.data.toCurrency}`);
      break;
      
    case 'currency.low_balance_alert':
      console.log('Low balance:', event.data.walletId);
      console.log(`Balance: ${event.data.balance} ${event.data.currency}`);
      // Auto-convert or notify user
      break;
      
    case 'currency.rate_significant_change':
      console.log('Rate change:', event.data.pair);
      console.log(`Change: ${event.data.changePercent}%`);
      // Notify users or execute conversions
      break;
  }
  
  res.json({ received: true });
});
```

## Best Practices

1. **Default Currency**: Set a primary currency for each user
2. **Auto-Convert**: Use auto-conversion rules for convenience
3. **Monitor Exchange Rates**: Set up rate alerts for important pairs
4. **Minimize Conversions**: Reduce conversion fees by keeping funds in native currency
5. **Lock Rates**: Use rate locking for large future conversions
6. **Diversify**: Don't keep all funds in volatile currencies
7. **Report Regularly**: Generate currency exposure reports monthly
8. **Educate Users**: Explain conversion fees and rates clearly

## Error Handling

```javascript
try {
  const conversion = await payvost.exchange.convert({
    fromWalletId: 'acc_usd_123',
    toWalletId: 'acc_eur_456',
    amount: '1000.00'
  });
} catch (error) {
  switch(error.code) {
    case 'insufficient_balance':
      console.error('Insufficient balance in source wallet');
      break;
      
    case 'unsupported_currency_pair':
      console.error('Currency pair not supported');
      break;
      
    case 'conversion_limit_exceeded':
      console.error('Conversion limit exceeded');
      console.error('Daily limit:', error.dailyLimit);
      break;
      
    case 'rate_changed':
      console.error('Exchange rate changed during conversion');
      console.error('New rate:', error.newRate);
      // Retry with new rate
      break;
      
    default:
      console.error('Conversion error:', error.message);
  }
}
```

## Next Steps

- **[Currency Exchange](./07-currency-exchange.md)** - Exchange rate APIs
- **[Transfer & Remittance](./05-transfer-remittance.md)** - Cross-border transfers
- **[Wallet Integration](./03-wallet-integration.md)** - Wallet management basics
- **[Transaction Reporting](./10-transaction-reporting.md)** - Multi-currency reporting
