# Transfer & Remittance API

Send money domestically and internationally using Payvost's Transfer and Remittance API.

## Overview

Payvost's Transfer API enables:
- **Domestic transfers**: Send money within the same country
- **International remittances**: Cross-border money transfers
- **Instant transfers**: Real-time money movement
- **Scheduled transfers**: Set up future-dated transfers
- **Bulk transfers**: Process multiple transfers at once
- **Transfer tracking**: Real-time status updates

## Transfer Types

### Internal Transfers (Wallet-to-Wallet)

Transfer between Payvost wallets:

```javascript
// Node.js
const transfer = await payvost.transfers.create({
  fromWalletId: 'acc_sender_wallet',
  toWalletId: 'acc_recipient_wallet',
  amount: '100.00',
  currency: 'USD',
  description: 'Payment for services',
  idempotencyKey: 'transfer_unique_key_123',
  metadata: {
    invoiceId: 'inv_12345'
  }
});

console.log('Transfer ID:', transfer.id);
console.log('Status:', transfer.status);
```

```python
# Python
transfer = payvost.Transfer.create(
    from_wallet_id='acc_sender_wallet',
    to_wallet_id='acc_recipient_wallet',
    amount='100.00',
    currency='USD',
    description='Payment for services',
    idempotency_key='transfer_unique_key_123',
    metadata={
        'invoice_id': 'inv_12345'
    }
)

print(f'Transfer ID: {transfer.id}')
print(f'Status: {transfer.status}')
```

```bash
# cURL
curl https://api.payvost.com/v1/transfers \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: transfer_unique_key_123" \
  -d '{
    "fromWalletId": "acc_sender_wallet",
    "toWalletId": "acc_recipient_wallet",
    "amount": "100.00",
    "currency": "USD",
    "description": "Payment for services"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "txn_abc123xyz",
    "type": "internal",
    "fromWalletId": "acc_sender_wallet",
    "toWalletId": "acc_recipient_wallet",
    "amount": "100.00000000",
    "currency": "USD",
    "fee": "0.50000000",
    "status": "completed",
    "description": "Payment for services",
    "idempotencyKey": "transfer_unique_key_123",
    "metadata": {
      "invoiceId": "inv_12345"
    },
    "createdAt": "2025-11-01T10:00:00Z",
    "completedAt": "2025-11-01T10:00:01Z"
  }
}
```

## Bank Transfer (Payout)

Send money to bank accounts:

```javascript
// Node.js
const transfer = await payvost.transfers.create({
  fromWalletId: 'acc_sender_wallet',
  amount: '500.00',
  currency: 'USD',
  type: 'bank_transfer',
  recipient: {
    type: 'bank_account',
    bankAccount: {
      accountNumber: '1234567890',
      routingNumber: '021000021',
      accountType: 'checking',
      accountHolderName: 'John Doe',
      bankName: 'Chase Bank'
    },
    email: 'john@example.com',
    phone: '+1234567890'
  },
  description: 'Salary payment',
  idempotencyKey: 'payout_salary_nov_2025'
});

console.log('Transfer ID:', transfer.id);
console.log('Estimated arrival:', transfer.estimatedArrival);
```

```python
# Python
transfer = payvost.Transfer.create(
    from_wallet_id='acc_sender_wallet',
    amount='500.00',
    currency='USD',
    type='bank_transfer',
    recipient={
        'type': 'bank_account',
        'bank_account': {
            'account_number': '1234567890',
            'routing_number': '021000021',
            'account_type': 'checking',
            'account_holder_name': 'John Doe',
            'bank_name': 'Chase Bank'
        },
        'email': 'john@example.com',
        'phone': '+1234567890'
    },
    description='Salary payment',
    idempotency_key='payout_salary_nov_2025'
)

print(f'Transfer ID: {transfer.id}')
print(f'Estimated arrival: {transfer.estimated_arrival}')
```

## International Remittance

Send money across borders:

```javascript
// Node.js
const remittance = await payvost.transfers.create({
  fromWalletId: 'acc_usd_wallet',
  amount: '1000.00',
  sourceCurrency: 'USD',
  destinationCurrency: 'KES',
  type: 'international',
  recipient: {
    type: 'mobile_money',
    mobileMoney: {
      provider: 'mpesa',
      phoneNumber: '+254712345678',
      accountName: 'Jane Doe'
    },
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    country: 'KE',
    address: {
      street: '123 Main Street',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE'
    }
  },
  purpose: 'family_support',
  sourceOfFunds: 'salary',
  description: 'Monthly support',
  idempotencyKey: 'remittance_nov_2025_001'
});

console.log('Remittance ID:', remittance.id);
console.log('Exchange Rate:', remittance.exchangeRate);
console.log('Recipient Amount:', remittance.recipientAmount);
console.log('Estimated arrival:', remittance.estimatedArrival);
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "txn_remit_xyz789",
    "type": "international",
    "fromWalletId": "acc_usd_wallet",
    "amount": "1000.00000000",
    "sourceCurrency": "USD",
    "destinationCurrency": "KES",
    "exchangeRate": "129.50",
    "recipientAmount": "129500.00",
    "fee": "5.00",
    "totalDebit": "1005.00",
    "status": "processing",
    "estimatedArrival": "2025-11-01T14:00:00Z",
    "recipient": {
      "type": "mobile_money",
      "phoneNumber": "+254712345678",
      "name": "Jane Doe"
    },
    "purpose": "family_support",
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

## Recipient Types

### Bank Account

```javascript
recipient: {
  type: 'bank_account',
  bankAccount: {
    accountNumber: '1234567890',
    routingNumber: '021000021', // US
    // or
    iban: 'DE89370400440532013000', // Europe
    swiftCode: 'DEUTDEFF',
    accountType: 'checking', // or 'savings'
    accountHolderName: 'John Doe',
    bankName: 'Deutsche Bank'
  }
}
```

### Mobile Money

```javascript
recipient: {
  type: 'mobile_money',
  mobileMoney: {
    provider: 'mpesa', // 'mtn', 'airtel', 'orange'
    phoneNumber: '+254712345678',
    accountName: 'Jane Doe'
  }
}
```

### Cash Pickup

```javascript
recipient: {
  type: 'cash_pickup',
  cashPickup: {
    provider: 'western_union', // 'moneygram', 'ria'
    firstName: 'John',
    lastName: 'Doe',
    country: 'NG',
    city: 'Lagos',
    phoneNumber: '+2348012345678'
  }
}
```

### Payvost Wallet

```javascript
recipient: {
  type: 'payvost_wallet',
  walletId: 'acc_recipient_wallet'
  // or
  email: 'recipient@example.com' // Auto-create wallet if needed
}
```

## Exchange Rates

### Get Real-Time Exchange Rate

```javascript
// Node.js
const quote = await payvost.transfers.getQuote({
  amount: '1000.00',
  sourceCurrency: 'USD',
  destinationCurrency: 'NGN',
  type: 'international'
});

console.log('Exchange Rate:', quote.exchangeRate);
console.log('Recipient Amount:', quote.recipientAmount);
console.log('Fee:', quote.fee);
console.log('Total Cost:', quote.totalCost);
console.log('Rate expires:', quote.expiresAt);
```

```python
# Python
quote = payvost.Transfer.get_quote(
    amount='1000.00',
    source_currency='USD',
    destination_currency='NGN',
    type='international'
)

print(f'Exchange Rate: {quote.exchange_rate}')
print(f'Recipient Amount: {quote.recipient_amount}')
print(f'Fee: {quote.fee}')
print(f'Total Cost: {quote.total_cost}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/transfers/quote?amount=1000.00&sourceCurrency=USD&destinationCurrency=NGN" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": {
    "amount": "1000.00",
    "sourceCurrency": "USD",
    "destinationCurrency": "NGN",
    "exchangeRate": "1580.50",
    "recipientAmount": "1580500.00",
    "fee": "5.00",
    "feePercentage": "0.50",
    "totalCost": "1005.00",
    "estimatedArrival": "2025-11-01T14:00:00Z",
    "expiresAt": "2025-11-01T10:15:00Z",
    "quoteId": "quote_abc123"
  }
}
```

### Lock Exchange Rate

```javascript
// Node.js - Use quote for guaranteed rate
const transfer = await payvost.transfers.create({
  fromWalletId: 'acc_usd_wallet',
  amount: '1000.00',
  sourceCurrency: 'USD',
  destinationCurrency: 'NGN',
  quoteId: 'quote_abc123', // Lock the rate
  recipient: {
    type: 'bank_account',
    bankAccount: { /* ... */ }
  }
});
```

## Transfer Status Tracking

### Check Transfer Status

```javascript
// Node.js
const transfer = await payvost.transfers.retrieve('txn_abc123xyz');

console.log('Status:', transfer.status);
console.log('Progress:', transfer.progress);

// Status timeline
transfer.timeline.forEach(event => {
  console.log(`${event.status}: ${event.timestamp} - ${event.description}`);
});
```

### Transfer Statuses

| Status | Description |
|--------|-------------|
| `pending` | Transfer initiated, awaiting processing |
| `processing` | Transfer being processed |
| `completed` | Transfer successful |
| `failed` | Transfer failed |
| `canceled` | Transfer canceled |
| `refunded` | Transfer refunded |

### Status Timeline Example

```json
{
  "id": "txn_abc123xyz",
  "status": "completed",
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2025-11-01T10:00:00Z",
      "description": "Transfer initiated"
    },
    {
      "status": "processing",
      "timestamp": "2025-11-01T10:00:05Z",
      "description": "Transfer being processed"
    },
    {
      "status": "completed",
      "timestamp": "2025-11-01T10:02:30Z",
      "description": "Transfer completed successfully"
    }
  ]
}
```

## Scheduled Transfers

### Create Future-Dated Transfer

```javascript
// Node.js
const transfer = await payvost.transfers.create({
  fromWalletId: 'acc_sender_wallet',
  toWalletId: 'acc_recipient_wallet',
  amount: '500.00',
  currency: 'USD',
  scheduledFor: '2025-11-15T09:00:00Z',
  description: 'Scheduled monthly payment'
});

console.log('Transfer ID:', transfer.id);
console.log('Scheduled for:', transfer.scheduledFor);
console.log('Status:', transfer.status); // 'scheduled'
```

### Cancel Scheduled Transfer

```javascript
// Node.js
await payvost.transfers.cancel('txn_scheduled_abc123');
```

## Recurring Transfers

### Create Recurring Transfer

```javascript
// Node.js
const recurring = await payvost.transfers.createRecurring({
  fromWalletId: 'acc_sender_wallet',
  toWalletId: 'acc_recipient_wallet',
  amount: '1000.00',
  currency: 'USD',
  frequency: 'monthly',
  startDate: '2025-11-01',
  endDate: '2026-11-01',
  dayOfMonth: 15,
  description: 'Monthly rent payment'
});

console.log('Recurring Transfer ID:', recurring.id);
console.log('Next execution:', recurring.nextExecutionDate);
```

### Manage Recurring Transfer

```javascript
// Pause recurring transfer
await payvost.transfers.pauseRecurring('rec_abc123');

// Resume recurring transfer
await payvost.transfers.resumeRecurring('rec_abc123');

// Update amount
await payvost.transfers.updateRecurring('rec_abc123', {
  amount: '1200.00'
});

// Cancel recurring transfer
await payvost.transfers.cancelRecurring('rec_abc123');
```

## Bulk Transfers

Process multiple transfers in a single request:

```javascript
// Node.js
const bulkTransfer = await payvost.transfers.createBulk({
  fromWalletId: 'acc_company_wallet',
  currency: 'USD',
  description: 'November payroll',
  transfers: [
    {
      toWalletId: 'acc_employee_1',
      amount: '2500.00',
      description: 'Salary - John Doe',
      metadata: { employeeId: 'emp_001' }
    },
    {
      toWalletId: 'acc_employee_2',
      amount: '3000.00',
      description: 'Salary - Jane Smith',
      metadata: { employeeId: 'emp_002' }
    },
    {
      type: 'bank_transfer',
      amount: '2750.00',
      recipient: {
        type: 'bank_account',
        bankAccount: {
          accountNumber: '9876543210',
          routingNumber: '021000021',
          accountHolderName: 'Bob Johnson'
        }
      },
      description: 'Salary - Bob Johnson',
      metadata: { employeeId: 'emp_003' }
    }
  ]
});

console.log('Bulk Transfer ID:', bulkTransfer.id);
console.log('Total amount:', bulkTransfer.totalAmount);
console.log('Status:', bulkTransfer.status);
```

### Upload CSV for Bulk Transfers

```javascript
// Node.js with Multer
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('payroll.csv'));
form.append('fromWalletId', 'acc_company_wallet');
form.append('currency', 'USD');

const bulkTransfer = await payvost.transfers.uploadBulk(form);

console.log('Processing:', bulkTransfer.totalTransfers);
console.log('Batch ID:', bulkTransfer.batchId);
```

CSV Format:
```csv
recipient_email,amount,description,metadata
john@example.com,2500.00,Salary - John Doe,employeeId:emp_001
jane@example.com,3000.00,Salary - Jane Smith,employeeId:emp_002
```

## Transfer Limits

### Check Transfer Limits

```javascript
// Node.js
const limits = await payvost.transfers.getLimits('acc_sender_wallet');

console.log('Daily limit:', limits.daily.limit);
console.log('Daily used:', limits.daily.used);
console.log('Daily remaining:', limits.daily.remaining);
console.log('Single transaction max:', limits.transaction.max);
```

### Response

```json
{
  "success": true,
  "data": {
    "walletId": "acc_sender_wallet",
    "daily": {
      "limit": "10000.00",
      "used": "2500.00",
      "remaining": "7500.00",
      "resetsAt": "2025-11-02T00:00:00Z"
    },
    "monthly": {
      "limit": "100000.00",
      "used": "35000.00",
      "remaining": "65000.00"
    },
    "transaction": {
      "min": "1.00",
      "max": "5000.00"
    }
  }
}
```

## Fees

### Calculate Transfer Fee

```javascript
// Node.js
const fee = await payvost.transfers.calculateFee({
  amount: '1000.00',
  sourceCurrency: 'USD',
  destinationCurrency: 'EUR',
  type: 'international'
});

console.log('Fee:', fee.amount);
console.log('Fee percentage:', fee.percentage);
console.log('Total cost:', fee.totalCost);
```

## Cancel/Refund Transfer

### Cancel Pending Transfer

```javascript
// Node.js
const canceledTransfer = await payvost.transfers.cancel('txn_abc123xyz');

console.log('Status:', canceledTransfer.status); // 'canceled'
console.log('Refund amount:', canceledTransfer.refundAmount);
```

### Request Transfer Refund

```javascript
// Node.js
const refund = await payvost.transfers.refund('txn_abc123xyz', {
  reason: 'recipient_request',
  description: 'Recipient requested refund'
});

console.log('Refund ID:', refund.id);
console.log('Status:', refund.status);
```

## Webhooks

Handle transfer events:

```javascript
// Node.js webhook handler
app.post('/webhooks/transfers', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'transfer.created':
      console.log('Transfer created:', event.data.id);
      break;
      
    case 'transfer.completed':
      console.log('Transfer completed:', event.data.id);
      // Update order status, notify users, etc.
      break;
      
    case 'transfer.failed':
      console.log('Transfer failed:', event.data.id);
      console.log('Reason:', event.data.failureReason);
      // Notify sender, process refund, etc.
      break;
      
    case 'transfer.refunded':
      console.log('Transfer refunded:', event.data.id);
      break;
  }
  
  res.json({ received: true });
});
```

## Error Handling

```javascript
try {
  const transfer = await payvost.transfers.create({
    fromWalletId: 'acc_sender',
    toWalletId: 'acc_recipient',
    amount: '100.00',
    currency: 'USD'
  });
} catch (error) {
  switch(error.code) {
    case 'insufficient_funds':
      console.error('Sender wallet has insufficient balance');
      break;
      
    case 'limit_exceeded':
      console.error('Transfer limit exceeded');
      console.error('Daily limit:', error.limits.daily);
      break;
      
    case 'kyc_required':
      console.error('Sender KYC verification required');
      break;
      
    case 'recipient_not_found':
      console.error('Recipient wallet not found');
      break;
      
    case 'invalid_currency':
      console.error('Currency not supported');
      break;
      
    default:
      console.error('Transfer error:', error.message);
  }
}
```

## Best Practices

1. **Use Idempotency Keys**: Prevent duplicate transfers
2. **Validate Recipients**: Verify recipient details before transferring
3. **Check Limits**: Verify limits before initiating large transfers
4. **Lock Exchange Rates**: Use quotes for predictable international transfers
5. **Monitor Status**: Use webhooks for real-time status updates
6. **Handle Failures**: Implement retry logic with exponential backoff
7. **Store References**: Keep transfer IDs for reconciliation and support

## Next Steps

- **[Wallet Integration](./03-wallet-integration.md)** - Manage wallet balances
- **[Currency Exchange](./07-currency-exchange.md)** - Get exchange rates
- **[Webhooks](./08-webhook-notifications.md)** - Real-time notifications
- **[Transaction Reporting](./10-transaction-reporting.md)** - Analytics and reporting
