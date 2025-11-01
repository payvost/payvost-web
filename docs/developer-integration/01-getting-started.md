# Getting Started with Payvost API

Welcome to the Payvost API documentation. This guide will help you integrate Payvost's payment and remittance services into your application.

## Overview

Payvost provides a comprehensive suite of APIs for:
- **Multi-currency wallet management**
- **International money transfers and remittances**
- **Payment processing**
- **User authentication and KYC/AML compliance**
- **Real-time exchange rates**
- **Transaction tracking and reporting**

## API Base URL

```
Production: https://api.payvost.com
Sandbox: https://sandbox-api.payvost.com
```

## API Architecture

Payvost uses a RESTful API architecture with JSON payloads. All API requests must be made over HTTPS.

### Key Principles

- **Idempotency**: Use idempotency keys for sensitive operations like transfers
- **Versioning**: API version is included in the URL path (e.g., `/v1/`)
- **Rate Limiting**: 100 requests per minute per API key (Production), 500 requests per minute (Sandbox)
- **Pagination**: List endpoints support `limit` and `offset` parameters

## Prerequisites

Before you begin, you'll need:

1. **Payvost Account**: Sign up at [https://dashboard.payvost.com/signup](https://dashboard.payvost.com/signup)
2. **API Keys**: Generate your API keys from the dashboard
3. **KYC Verification**: Complete your business verification for production access
4. **Webhook Endpoint**: (Optional) For receiving real-time notifications

## Quick Start

### Step 1: Install SDK (Optional)

```bash
# Node.js
npm install @payvost/node-sdk

# Python
pip install payvost

# PHP
composer require payvost/payvost-php

# Ruby
gem install payvost
```

### Step 2: Initialize the Client

```javascript
// Node.js
const Payvost = require('@payvost/node-sdk');

const payvost = new Payvost({
  apiKey: 'pk_live_your_api_key_here',
  environment: 'production' // or 'sandbox'
});
```

```python
# Python
import payvost

payvost.api_key = 'pk_live_your_api_key_here'
payvost.environment = 'production'  # or 'sandbox'
```

```php
<?php
// PHP
require_once('vendor/autoload.php');

\Payvost\Payvost::setApiKey('pk_live_your_api_key_here');
\Payvost\Payvost::setEnvironment('production'); // or 'sandbox'
```

```ruby
# Ruby
require 'payvost'

Payvost.api_key = 'pk_live_your_api_key_here'
Payvost.environment = 'production' # or 'sandbox'
```

### Step 3: Make Your First API Call

Let's create a user account:

```javascript
// Node.js
try {
  const user = await payvost.users.create({
    email: 'user@example.com',
    name: 'John Doe',
    country: 'US'
  });
  
  console.log('User created:', user.id);
} catch (error) {
  console.error('Error:', error.message);
}
```

```python
# Python
try:
    user = payvost.User.create(
        email='user@example.com',
        name='John Doe',
        country='US'
    )
    print(f'User created: {user.id}')
except payvost.error.PayvostError as e:
    print(f'Error: {e.message}')
```

```php
<?php
// PHP
try {
    $user = \Payvost\User::create([
        'email' => 'user@example.com',
        'name' => 'John Doe',
        'country' => 'US'
    ]);
    
    echo 'User created: ' . $user->id;
} catch (\Payvost\Exception\ApiErrorException $e) {
    echo 'Error: ' . $e->getMessage();
}
```

```ruby
# Ruby
begin
  user = Payvost::User.create(
    email: 'user@example.com',
    name: 'John Doe',
    country: 'US'
  )
  
  puts "User created: #{user.id}"
rescue Payvost::PayvostError => e
  puts "Error: #{e.message}"
end
```

### Step 4: Create a Wallet

```javascript
// Node.js
const wallet = await payvost.wallets.create({
  userId: user.id,
  currency: 'USD',
  type: 'PERSONAL'
});

console.log('Wallet created:', wallet.id);
console.log('Balance:', wallet.balance);
```

```python
# Python
wallet = payvost.Wallet.create(
    user_id=user.id,
    currency='USD',
    type='PERSONAL'
)

print(f'Wallet created: {wallet.id}')
print(f'Balance: {wallet.balance}')
```

## Direct REST API Usage

If you prefer not to use an SDK, you can make direct HTTP requests:

```bash
curl https://api.payvost.com/v1/users \
  -X POST \
  -H "Authorization: Bearer pk_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "country": "US"
  }'
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "usr_1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "country": "US",
    "kycStatus": "pending",
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Invalid email address",
    "field": "email",
    "requestId": "req_abc123xyz"
  }
}
```

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `authentication_error` | 401 | Invalid or missing API key |
| `authorization_error` | 403 | Insufficient permissions |
| `validation_error` | 400 | Invalid request parameters |
| `kyc_required` | 403 | KYC verification required |
| `insufficient_funds` | 400 | Wallet balance too low |
| `rate_limit_exceeded` | 429 | Too many requests |
| `service_error` | 500 | Internal server error |

## Testing in Sandbox

The sandbox environment provides:
- Test API keys with `pk_test_` prefix
- Virtual currencies and balances
- Simulated payment processing
- No real money transactions
- Full API functionality

Test Cards:
```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

## Next Steps

Now that you've set up your integration, explore these guides:

- **[Authentication & API Keys](./02-authentication-api-keys.md)** - Secure your API access
- **[Wallet Integration](./03-wallet-integration.md)** - Manage multi-currency wallets
- **[Payment Processing](./04-payment-processing.md)** - Accept payments
- **[Transfer & Remittance](./05-transfer-remittance.md)** - Send money internationally
- **[Webhooks](./08-webhook-notifications.md)** - Receive real-time events

## Support

- **Documentation**: [https://docs.payvost.com](https://docs.payvost.com)
- **API Reference**: [https://api-docs.payvost.com](https://api-docs.payvost.com)
- **Support Email**: developers@payvost.com
- **Community Forum**: [https://community.payvost.com](https://community.payvost.com)
- **Status Page**: [https://status.payvost.com](https://status.payvost.com)

## Rate Limits

| Environment | Requests per Minute | Burst Limit |
|-------------|---------------------|-------------|
| Production | 100 | 150 |
| Sandbox | 500 | 750 |

When you exceed rate limits, you'll receive a `429` status code with a `Retry-After` header.
