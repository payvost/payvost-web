# Payment Processing Integration

Accept payments from customers using cards, bank transfers, mobile money, and alternative payment methods.

## Overview

Payvost's Payment Processing API allows you to:
- Accept one-time and recurring payments
- Support multiple payment methods
- Handle refunds and disputes
- Process international payments
- Manage payment intents and confirmations

## Payment Methods

### Supported Payment Methods

- **Cards**: Visa, Mastercard, American Express, Discover
- **Bank Transfers**: ACH, SEPA, Wire transfers
- **Mobile Money**: M-Pesa, MTN Mobile Money, Airtel Money, Orange Money
- **Digital Wallets**: Apple Pay, Google Pay, PayPal, Alipay
- **Cryptocurrency**: Bitcoin, Ethereum, USDT, USDC
- **Local Methods**: Country-specific payment methods

## Creating a Payment

### Payment Flow

1. Create a payment intent
2. Customer completes payment
3. Receive webhook confirmation
4. Fulfill order/service

### Basic Payment

```javascript
// Node.js
const payment = await payvost.payments.create({
  amount: '99.99',
  currency: 'USD',
  paymentMethod: 'card',
  destinationWalletId: 'acc_merchant_wallet',
  customer: {
    email: 'customer@example.com',
    name: 'John Doe'
  },
  metadata: {
    orderId: 'order_12345',
    productId: 'prod_67890'
  },
  description: 'Premium subscription - Monthly',
  returnUrl: 'https://yourapp.com/payment/success',
  cancelUrl: 'https://yourapp.com/payment/cancel'
});

// Redirect customer to payment page
res.redirect(payment.paymentUrl);
```

```python
# Python
payment = payvost.Payment.create(
    amount='99.99',
    currency='USD',
    payment_method='card',
    destination_wallet_id='acc_merchant_wallet',
    customer={
        'email': 'customer@example.com',
        'name': 'John Doe'
    },
    metadata={
        'order_id': 'order_12345',
        'product_id': 'prod_67890'
    },
    description='Premium subscription - Monthly',
    return_url='https://yourapp.com/payment/success',
    cancel_url='https://yourapp.com/payment/cancel'
)

# Redirect customer to payment page
redirect(payment.payment_url)
```

```bash
# cURL
curl https://api.payvost.com/v1/payments \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "99.99",
    "currency": "USD",
    "paymentMethod": "card",
    "destinationWalletId": "acc_merchant_wallet",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "description": "Premium subscription - Monthly",
    "returnUrl": "https://yourapp.com/payment/success",
    "cancelUrl": "https://yourapp.com/payment/cancel"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "pay_abc123xyz",
    "status": "pending",
    "amount": "99.99",
    "currency": "USD",
    "paymentMethod": "card",
    "paymentUrl": "https://pay.payvost.com/pay/pay_abc123xyz",
    "expiresAt": "2025-11-01T11:00:00Z",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "metadata": {
      "orderId": "order_12345",
      "productId": "prod_67890"
    },
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

## Payment Methods Integration

### Card Payments

#### Direct Card Processing

```javascript
// Node.js - Using Payvost.js (client-side)
const payvost = Payvost('pk_live_your_publishable_key');

// Create card element
const cardElement = payvost.elements.create('card', {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d'
    }
  }
});

cardElement.mount('#card-element');

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const { token, error } = await payvost.createToken(cardElement);
  
  if (error) {
    // Display error
    console.error(error.message);
  } else {
    // Send token to your server
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.id,
        amount: '99.99'
      })
    });
  }
});
```

```javascript
// Server-side processing
app.post('/api/process-payment', async (req, res) => {
  const { token, amount } = req.body;
  
  try {
    const payment = await payvost.payments.create({
      amount: amount,
      currency: 'USD',
      paymentMethod: 'card',
      cardToken: token,
      destinationWalletId: 'acc_merchant_wallet',
      description: 'Product purchase'
    });
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### 3D Secure Authentication

```javascript
// Node.js
const payment = await payvost.payments.create({
  amount: '99.99',
  currency: 'USD',
  paymentMethod: 'card',
  cardToken: 'tok_abc123',
  destinationWalletId: 'acc_merchant_wallet',
  threeDSecure: {
    required: true,
    challengeIndicator: 'challenge_required_if_mandated'
  },
  returnUrl: 'https://yourapp.com/payment/complete'
});

if (payment.requiresAction) {
  // Redirect to 3DS authentication
  res.redirect(payment.authenticationUrl);
}
```

### Mobile Money Payments

```javascript
// Node.js - M-Pesa example
const payment = await payvost.payments.create({
  amount: '1000',
  currency: 'KES',
  paymentMethod: 'mobile_money',
  mobileMoney: {
    provider: 'mpesa',
    phoneNumber: '+254712345678'
  },
  destinationWalletId: 'acc_merchant_wallet',
  description: 'Product purchase'
});

// Customer receives STK push on their phone
console.log('Payment ID:', payment.id);
console.log('Status:', payment.status); // 'pending'
```

```python
# Python - MTN Mobile Money example
payment = payvost.Payment.create(
    amount='50000',
    currency='UGX',
    payment_method='mobile_money',
    mobile_money={
        'provider': 'mtn',
        'phone_number': '+256712345678'
    },
    destination_wallet_id='acc_merchant_wallet',
    description='Service payment'
)

print(f'Payment ID: {payment.id}')
print(f'Status: {payment.status}')
```

### Bank Transfer Payments

```javascript
// Node.js - Generate bank transfer instructions
const payment = await payvost.payments.create({
  amount: '5000.00',
  currency: 'USD',
  paymentMethod: 'bank_transfer',
  bankTransfer: {
    type: 'ach' // or 'sepa', 'wire'
  },
  destinationWalletId: 'acc_merchant_wallet',
  expiresAt: '2025-11-05T23:59:59Z'
});

console.log('Bank Name:', payment.bankTransfer.bankName);
console.log('Account Number:', payment.bankTransfer.accountNumber);
console.log('Routing Number:', payment.bankTransfer.routingNumber);
console.log('Reference:', payment.bankTransfer.reference);
```

### Cryptocurrency Payments

```javascript
// Node.js
const payment = await payvost.payments.create({
  amount: '100.00',
  currency: 'USD',
  paymentMethod: 'cryptocurrency',
  cryptocurrency: {
    type: 'USDT',
    network: 'TRC20'
  },
  destinationWalletId: 'acc_merchant_wallet'
});

console.log('Deposit Address:', payment.cryptocurrency.address);
console.log('Amount:', payment.cryptocurrency.amountCrypto);
console.log('QR Code:', payment.cryptocurrency.qrCodeUrl);
```

## Confirming Payments

After customer completes payment, confirm the status:

```javascript
// Node.js
const payment = await payvost.payments.retrieve('pay_abc123xyz');

if (payment.status === 'succeeded') {
  // Payment successful - fulfill order
  await fulfillOrder(payment.metadata.orderId);
} else if (payment.status === 'failed') {
  // Payment failed - notify customer
  await notifyCustomer(payment.customer.email, 'payment_failed');
}
```

### Payment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated, awaiting completion |
| `processing` | Payment being processed |
| `requires_action` | Requires customer action (e.g., 3D Secure) |
| `succeeded` | Payment completed successfully |
| `failed` | Payment failed |
| `canceled` | Payment canceled |
| `expired` | Payment link expired |

## Recurring Payments

### Create Subscription

```javascript
// Node.js
const subscription = await payvost.subscriptions.create({
  customerId: 'cus_abc123',
  planId: 'plan_monthly_99',
  paymentMethod: 'card',
  cardToken: 'tok_xyz789',
  startDate: '2025-11-01',
  metadata: {
    productId: 'prod_premium'
  }
});

console.log('Subscription ID:', subscription.id);
console.log('Next billing date:', subscription.nextBillingDate);
```

### Create Payment Plan

```javascript
// Node.js
const plan = await payvost.plans.create({
  name: 'Premium Monthly',
  amount: '99.99',
  currency: 'USD',
  interval: 'month',
  intervalCount: 1,
  trialPeriodDays: 7
});

console.log('Plan ID:', plan.id);
```

### Manage Subscription

```javascript
// Pause subscription
await payvost.subscriptions.pause('sub_abc123');

// Resume subscription
await payvost.subscriptions.resume('sub_abc123');

// Cancel subscription
await payvost.subscriptions.cancel('sub_abc123', {
  cancelAtPeriodEnd: true
});

// Update subscription
await payvost.subscriptions.update('sub_abc123', {
  planId: 'plan_yearly_999'
});
```

## Refunds

### Full Refund

```javascript
// Node.js
const refund = await payvost.refunds.create({
  paymentId: 'pay_abc123xyz',
  reason: 'requested_by_customer'
});

console.log('Refund ID:', refund.id);
console.log('Status:', refund.status);
```

### Partial Refund

```javascript
// Node.js
const refund = await payvost.refunds.create({
  paymentId: 'pay_abc123xyz',
  amount: '50.00', // Partial amount
  reason: 'customer_return'
});
```

```bash
# cURL
curl https://api.payvost.com/v1/refunds \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_abc123xyz",
    "amount": "50.00",
    "reason": "customer_return"
  }'
```

### List Refunds

```javascript
// Node.js
const refunds = await payvost.refunds.list({
  paymentId: 'pay_abc123xyz'
});

refunds.data.forEach(refund => {
  console.log(`${refund.id}: ${refund.amount} - ${refund.status}`);
});
```

## Payment Links

Create shareable payment links:

```javascript
// Node.js
const paymentLink = await payvost.paymentLinks.create({
  amount: '149.99',
  currency: 'USD',
  description: 'Premium Course Access',
  successMessage: 'Thank you for your purchase!',
  expiresAt: '2025-12-31T23:59:59Z',
  maxUses: 100,
  metadata: {
    productId: 'course_premium'
  }
});

console.log('Payment Link:', paymentLink.url);
// https://pay.payvost.com/link/plink_abc123xyz
```

```python
# Python
payment_link = payvost.PaymentLink.create(
    amount='149.99',
    currency='USD',
    description='Premium Course Access',
    success_message='Thank you for your purchase!',
    expires_at='2025-12-31T23:59:59Z',
    max_uses=100
)

print(f'Payment Link: {payment_link.url}')
```

## Dispute Management

### List Disputes

```javascript
// Node.js
const disputes = await payvost.disputes.list({
  status: 'needs_response'
});

disputes.data.forEach(dispute => {
  console.log(`Dispute ${dispute.id}: ${dispute.reason}`);
  console.log(`Respond by: ${dispute.respondBy}`);
});
```

### Respond to Dispute

```javascript
// Node.js
const response = await payvost.disputes.respond('disp_abc123', {
  evidence: {
    customerName: 'John Doe',
    customerEmail: 'customer@example.com',
    billingAddress: '123 Main St, City, State',
    receipt: 'https://yourapp.com/receipts/order_12345.pdf',
    shippingTracking: 'TRACK123456',
    shippingDate: '2025-10-28',
    customerCommunication: 'https://yourapp.com/communications/conv_123.pdf',
    description: 'Customer received product and confirmed via email'
  }
});

console.log('Response submitted:', response.id);
```

## Payment Analytics

### Get Payment Statistics

```javascript
// Node.js
const stats = await payvost.payments.getStatistics({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  groupBy: 'day'
});

console.log('Total Volume:', stats.totalVolume);
console.log('Total Transactions:', stats.totalTransactions);
console.log('Success Rate:', stats.successRate);
console.log('Average Transaction:', stats.averageTransaction);
```

### Export Transactions

```javascript
// Node.js
const export = await payvost.payments.export({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  format: 'csv', // or 'xlsx', 'pdf'
  filters: {
    status: 'succeeded',
    currency: 'USD'
  }
});

console.log('Download URL:', export.downloadUrl);
```

## Webhooks

Handle payment events in real-time:

```javascript
// Node.js - Express webhook endpoint
app.post('/webhooks/payvost', (req, res) => {
  const signature = req.headers['payvost-signature'];
  
  try {
    // Verify webhook signature
    const event = payvost.webhooks.verify(
      req.body,
      signature,
      process.env.WEBHOOK_SECRET
    );
    
    switch(event.type) {
      case 'payment.succeeded':
        // Payment successful
        fulfillOrder(event.data.metadata.orderId);
        break;
        
      case 'payment.failed':
        // Payment failed
        notifyCustomer(event.data.customer.email, 'payment_failed');
        break;
        
      case 'refund.created':
        // Refund processed
        processRefund(event.data);
        break;
        
      case 'dispute.created':
        // New dispute
        alertAdmin(event.data);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send('Webhook verification failed');
  }
});
```

## Error Handling

```javascript
try {
  const payment = await payvost.payments.create({
    amount: '99.99',
    currency: 'USD',
    paymentMethod: 'card',
    cardToken: 'tok_abc123'
  });
} catch (error) {
  switch(error.code) {
    case 'card_declined':
      console.error('Card was declined:', error.declineCode);
      break;
      
    case 'insufficient_funds':
      console.error('Insufficient funds on card');
      break;
      
    case 'expired_card':
      console.error('Card has expired');
      break;
      
    case 'invalid_cvc':
      console.error('Invalid CVC code');
      break;
      
    case 'processing_error':
      console.error('Payment processing error');
      break;
      
    default:
      console.error('Payment error:', error.message);
  }
}
```

## Testing

### Test Cards

```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Expired Card: 4000 0000 0000 0069
Invalid CVC: 4000 0000 0000 0127
3D Secure Required: 4000 0000 0000 3220
```

### Test Mobile Money

```
Success: +254712345678 (M-Pesa)
Failed: +254712345679 (M-Pesa)
Timeout: +254712345680 (M-Pesa)
```

## Best Practices

1. **Use Idempotency Keys**: Prevent duplicate charges
2. **Handle Webhooks**: Don't rely solely on client-side callbacks
3. **Verify Signatures**: Always verify webhook signatures
4. **Store Payment IDs**: Keep payment IDs for reference and reconciliation
5. **Handle Failures Gracefully**: Provide clear error messages to customers
6. **PCI Compliance**: Never store raw card details; use tokens
7. **Test Thoroughly**: Use sandbox environment extensively

## Next Steps

- **[Transfer & Remittance](./05-transfer-remittance.md)** - Send money internationally
- **[Webhooks](./08-webhook-notifications.md)** - Real-time event handling
- **[Testing Guide](./12-testing-sandbox.md)** - Comprehensive testing strategies
