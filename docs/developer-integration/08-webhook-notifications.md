# Webhook & Notification Integration

Receive real-time notifications about events in your Payvost integration.

## Overview

Payvost webhooks allow you to receive HTTP callbacks when events occur in your account:
- **Payment events**: Payment completed, failed, refunded
- **Transfer events**: Transfer initiated, completed, failed
- **Wallet events**: Balance updated, wallet created
- **User events**: KYC verified, account updated
- **Fraud events**: Suspicious activity detected

## Setting Up Webhooks

### Create Webhook Endpoint

```javascript
// Node.js with Express
const express = require('express');
const app = express();

// Important: Use raw body for signature verification
app.post('/webhooks/payvost', 
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['payvost-signature'];
    const payload = req.body;
    
    // Verify webhook signature (see below)
    try {
      const event = verifyWebhook(payload, signature);
      handleWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook verification failed:', error.message);
      res.status(400).send('Webhook verification failed');
    }
  }
);

app.listen(3000);
```

```python
# Python with Flask
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

@app.route('/webhooks/payvost', methods=['POST'])
def webhook():
    signature = request.headers.get('Payvost-Signature')
    payload = request.get_data()
    
    try:
        event = verify_webhook(payload, signature)
        handle_webhook_event(event)
        return jsonify({'received': True})
    except Exception as e:
        print(f'Webhook verification failed: {e}')
        return 'Webhook verification failed', 400

if __name__ == '__main__':
    app.run(port=3000)
```

### Register Webhook in Dashboard

1. Log in to [Payvost Dashboard](https://dashboard.payvost.com)
2. Navigate to **Settings** > **Webhooks**
3. Click **Add Endpoint**
4. Enter your webhook URL: `https://yourapp.com/webhooks/payvost`
5. Select events to subscribe to
6. Save and copy your webhook secret

### Register Webhook via API

```javascript
// Node.js
const webhook = await payvost.webhooks.create({
  url: 'https://yourapp.com/webhooks/payvost',
  events: [
    'payment.*',
    'transfer.*',
    'wallet.balance_updated',
    'user.kyc_verified'
  ],
  description: 'Production webhook endpoint',
  metadata: {
    environment: 'production'
  }
});

console.log('Webhook ID:', webhook.id);
console.log('Webhook Secret:', webhook.secret); // Store this securely!
```

```bash
# cURL
curl https://api.payvost.com/v1/webhooks \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/payvost",
    "events": ["payment.*", "transfer.*"],
    "description": "Production webhook endpoint"
  }'
```

## Webhook Security

### Verify Webhook Signatures

Always verify webhook signatures to ensure authenticity:

```javascript
// Node.js
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }
  
  return JSON.parse(payload);
}

// Usage
app.post('/webhooks/payvost', 
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['payvost-signature'];
    const secret = process.env.WEBHOOK_SECRET;
    
    try {
      const event = verifyWebhook(req.body, signature, secret);
      // Process event
      res.json({ received: true });
    } catch (error) {
      res.status(400).send('Invalid signature');
    }
  }
);
```

```python
# Python
import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_signature:
        raise ValueError('Invalid webhook signature')
    
    return json.loads(payload)

# Usage
@app.route('/webhooks/payvost', methods=['POST'])
def webhook():
    signature = request.headers.get('Payvost-Signature')
    secret = os.environ['WEBHOOK_SECRET']
    payload = request.get_data()
    
    try:
        event = verify_webhook(payload, signature, secret)
        # Process event
        return jsonify({'received': True})
    except ValueError as e:
        return str(e), 400
```

```php
<?php
// PHP
function verifyWebhook($payload, $signature, $secret) {
    $expectedSignature = hash_hmac('sha256', $payload, $secret);
    
    if ($signature !== $expectedSignature) {
        throw new Exception('Invalid webhook signature');
    }
    
    return json_decode($payload, true);
}

// Usage
$signature = $_SERVER['HTTP_PAYVOST_SIGNATURE'];
$payload = file_get_contents('php://input');
$secret = getenv('WEBHOOK_SECRET');

try {
    $event = verifyWebhook($payload, $signature, $secret);
    // Process event
    http_response_code(200);
    echo json_encode(['received' => true]);
} catch (Exception $e) {
    http_response_code(400);
    echo 'Invalid signature';
}
```

## Webhook Event Structure

All webhook events follow this structure:

```json
{
  "id": "evt_abc123xyz",
  "type": "payment.succeeded",
  "createdAt": "2025-11-01T10:00:00Z",
  "liveMode": true,
  "data": {
    "id": "pay_def456uvw",
    "amount": "99.99",
    "currency": "USD",
    "status": "succeeded",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "metadata": {
      "orderId": "order_12345"
    }
  },
  "previousData": null
}
```

## Event Types

### Payment Events

```javascript
// payment.created
{
  "type": "payment.created",
  "data": {
    "id": "pay_abc123",
    "amount": "99.99",
    "currency": "USD",
    "status": "pending"
  }
}

// payment.succeeded
{
  "type": "payment.succeeded",
  "data": {
    "id": "pay_abc123",
    "amount": "99.99",
    "currency": "USD",
    "status": "succeeded",
    "paidAt": "2025-11-01T10:00:00Z"
  }
}

// payment.failed
{
  "type": "payment.failed",
  "data": {
    "id": "pay_abc123",
    "amount": "99.99",
    "currency": "USD",
    "status": "failed",
    "failureCode": "card_declined",
    "failureMessage": "Card was declined"
  }
}

// payment.refunded
{
  "type": "payment.refunded",
  "data": {
    "id": "pay_abc123",
    "refundId": "ref_xyz789",
    "refundAmount": "99.99",
    "reason": "requested_by_customer"
  }
}
```

### Transfer Events

```javascript
// transfer.created
{
  "type": "transfer.created",
  "data": {
    "id": "txn_abc123",
    "fromWalletId": "acc_sender",
    "toWalletId": "acc_recipient",
    "amount": "100.00",
    "currency": "USD",
    "status": "pending"
  }
}

// transfer.completed
{
  "type": "transfer.completed",
  "data": {
    "id": "txn_abc123",
    "status": "completed",
    "completedAt": "2025-11-01T10:00:00Z"
  }
}

// transfer.failed
{
  "type": "transfer.failed",
  "data": {
    "id": "txn_abc123",
    "status": "failed",
    "failureReason": "insufficient_funds"
  }
}
```

### Wallet Events

```javascript
// wallet.created
{
  "type": "wallet.created",
  "data": {
    "id": "acc_abc123",
    "userId": "usr_xyz789",
    "currency": "USD",
    "balance": "0.00"
  }
}

// wallet.balance_updated
{
  "type": "wallet.balance_updated",
  "data": {
    "id": "acc_abc123",
    "balance": "1000.00",
    "previousBalance": "950.00",
    "change": "+50.00"
  }
}

// wallet.frozen
{
  "type": "wallet.frozen",
  "data": {
    "id": "acc_abc123",
    "reason": "suspicious_activity",
    "frozenAt": "2025-11-01T10:00:00Z"
  }
}
```

### User Events

```javascript
// user.created
{
  "type": "user.created",
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "country": "US"
  }
}

// user.kyc_submitted
{
  "type": "user.kyc_submitted",
  "data": {
    "userId": "usr_abc123",
    "submittedAt": "2025-11-01T10:00:00Z"
  }
}

// user.kyc_verified
{
  "type": "user.kyc_verified",
  "data": {
    "userId": "usr_abc123",
    "tier": "VERIFIED",
    "verifiedAt": "2025-11-01T12:00:00Z"
  }
}

// user.kyc_rejected
{
  "type": "user.kyc_rejected",
  "data": {
    "userId": "usr_abc123",
    "reason": "document_expired",
    "requiredActions": ["resubmit_identity"]
  }
}
```

### Fraud Events

```javascript
// fraud.alert_created
{
  "type": "fraud.alert_created",
  "data": {
    "alertId": "alert_abc123",
    "userId": "usr_xyz789",
    "type": "unusual_transaction_pattern",
    "severity": "high",
    "description": "Multiple large transactions in short period"
  }
}

// fraud.transaction_blocked
{
  "type": "fraud.transaction_blocked",
  "data": {
    "transactionId": "txn_abc123",
    "reason": "exceeds_velocity_limits",
    "userId": "usr_xyz789"
  }
}
```

## Handling Webhook Events

### Complete Event Handler

```javascript
// Node.js
function handleWebhookEvent(event) {
  console.log('Received event:', event.type, event.id);
  
  switch(event.type) {
    // Payment events
    case 'payment.succeeded':
      handlePaymentSucceeded(event.data);
      break;
    case 'payment.failed':
      handlePaymentFailed(event.data);
      break;
    case 'payment.refunded':
      handlePaymentRefunded(event.data);
      break;
    
    // Transfer events
    case 'transfer.completed':
      handleTransferCompleted(event.data);
      break;
    case 'transfer.failed':
      handleTransferFailed(event.data);
      break;
    
    // Wallet events
    case 'wallet.balance_updated':
      handleBalanceUpdated(event.data);
      break;
    
    // User events
    case 'user.kyc_verified':
      handleKYCVerified(event.data);
      break;
    case 'user.kyc_rejected':
      handleKYCRejected(event.data);
      break;
    
    // Fraud events
    case 'fraud.alert_created':
      handleFraudAlert(event.data);
      break;
    
    default:
      console.log('Unhandled event type:', event.type);
  }
}

async function handlePaymentSucceeded(payment) {
  // Update order status
  await updateOrderStatus(payment.metadata.orderId, 'paid');
  
  // Send confirmation email
  await sendEmail(payment.customer.email, 'payment_confirmation', {
    amount: payment.amount,
    currency: payment.currency
  });
  
  // Fulfill order
  await fulfillOrder(payment.metadata.orderId);
}

async function handleKYCVerified(kycData) {
  // Upgrade user tier
  await upgradeUserTier(kycData.userId, kycData.tier);
  
  // Send congratulations email
  await sendEmail(kycData.userEmail, 'kyc_approved');
  
  // Enable premium features
  await enablePremiumFeatures(kycData.userId);
}
```

```python
# Python
def handle_webhook_event(event):
    print(f'Received event: {event["type"]} {event["id"]}')
    
    event_type = event['type']
    data = event['data']
    
    if event_type == 'payment.succeeded':
        handle_payment_succeeded(data)
    elif event_type == 'payment.failed':
        handle_payment_failed(data)
    elif event_type == 'transfer.completed':
        handle_transfer_completed(data)
    elif event_type == 'user.kyc_verified':
        handle_kyc_verified(data)
    else:
        print(f'Unhandled event type: {event_type}')

def handle_payment_succeeded(payment):
    # Update order status
    update_order_status(payment['metadata']['orderId'], 'paid')
    
    # Send confirmation email
    send_email(
        payment['customer']['email'],
        'payment_confirmation',
        {'amount': payment['amount'], 'currency': payment['currency']}
    )
    
    # Fulfill order
    fulfill_order(payment['metadata']['orderId'])
```

## Retry Logic

Payvost automatically retries failed webhook deliveries:

- **Immediate retry**: After 5 seconds
- **Second retry**: After 1 minute
- **Third retry**: After 5 minutes
- **Fourth retry**: After 30 minutes
- **Final retry**: After 1 hour

### Implement Idempotency

```javascript
// Node.js with Redis
const redis = require('redis');
const client = redis.createClient();

async function handleWebhookEvent(event) {
  // Check if event already processed
  const processed = await client.get(`webhook:${event.id}`);
  if (processed) {
    console.log('Event already processed:', event.id);
    return;
  }
  
  // Process event
  await processEvent(event);
  
  // Mark as processed (expires after 24 hours)
  await client.setex(`webhook:${event.id}`, 86400, 'true');
}
```

## Testing Webhooks

### Test Webhook Endpoint

```bash
# cURL
curl https://api.payvost.com/v1/webhooks/webhook_abc123/test \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -d '{
    "eventType": "payment.succeeded"
  }'
```

### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your local server
node server.js  # Running on port 3000

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in your webhook configuration
# https://abc123.ngrok.io/webhooks/payvost
```

### Webhook Event Logs

View webhook delivery attempts in the dashboard:

```javascript
// Or via API
const logs = await payvost.webhooks.getLogs('webhook_abc123', {
  limit: 50,
  status: 'failed' // or 'succeeded', 'pending'
});

logs.data.forEach(log => {
  console.log(`${log.event.type}: ${log.status} - ${log.responseCode}`);
  console.log('Response:', log.responseBody);
});
```

## Managing Webhooks

### List Webhooks

```javascript
// Node.js
const webhooks = await payvost.webhooks.list();

webhooks.data.forEach(webhook => {
  console.log(`${webhook.url}: ${webhook.events.join(', ')}`);
});
```

### Update Webhook

```javascript
// Node.js
await payvost.webhooks.update('webhook_abc123', {
  events: ['payment.*', 'transfer.*', 'user.kyc_verified'],
  enabled: true
});
```

### Delete Webhook

```javascript
// Node.js
await payvost.webhooks.delete('webhook_abc123');
```

### Rotate Webhook Secret

```javascript
// Node.js
const newSecret = await payvost.webhooks.rotateSecret('webhook_abc123');

console.log('New secret:', newSecret.secret);
// Update your environment variable with the new secret
```

## Best Practices

1. **Always Verify Signatures**: Never process unverified webhooks
2. **Respond Quickly**: Return 200 status within 5 seconds; process asynchronously
3. **Implement Idempotency**: Handle duplicate webhook deliveries
4. **Use HTTPS**: Webhook URLs must use HTTPS in production
5. **Monitor Failures**: Set up alerts for repeated webhook failures
6. **Handle All Event Types**: Include default case for unknown events
7. **Log Everything**: Keep detailed logs for debugging
8. **Test Thoroughly**: Test webhook handlers in staging before production

## Troubleshooting

### Common Issues

**Webhook not received:**
- Check firewall/security group settings
- Verify webhook URL is accessible from internet
- Check webhook is enabled in dashboard
- Review webhook logs for delivery attempts

**Signature verification fails:**
- Ensure using raw request body
- Check webhook secret is correct
- Verify signature header name: `Payvost-Signature`

**Timeout errors:**
- Process webhooks asynchronously
- Return 200 response immediately
- Use message queue for processing

## Next Steps

- **[Payment Processing](./04-payment-processing.md)** - Payment webhooks
- **[Transfer & Remittance](./05-transfer-remittance.md)** - Transfer webhooks
- **[Testing Guide](./12-testing-sandbox.md)** - Testing webhook integration
