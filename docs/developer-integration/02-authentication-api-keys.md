# Authentication & API Keys

Learn how to securely authenticate your API requests and manage your API keys.

## Overview

Payvost uses API keys to authenticate requests. Your API keys carry many privileges, so keep them secure. Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, etc.

## API Key Types

### Publishable Keys (Client-Side)

```
pk_live_1234567890abcdef  // Production
pk_test_1234567890abcdef  // Sandbox
```

- Safe to use in client-side code
- Limited to creating user sessions and retrieving public data
- Cannot perform sensitive operations

### Secret Keys (Server-Side)

```
sk_live_1234567890abcdef  // Production
sk_test_1234567890abcdef  // Sandbox
```

- Must be kept confidential
- Full API access
- Use only in server-side code
- Never expose in client-side code or version control

## Getting Your API Keys

1. Log in to your [Payvost Dashboard](https://dashboard.payvost.com)
2. Navigate to **Settings** > **API Keys**
3. Click **Generate New Key**
4. Choose the environment (Production or Sandbox)
5. Copy and securely store your keys

## Authentication Methods

### Bearer Token Authentication

Include your API key in the `Authorization` header:

```bash
curl https://api.payvost.com/v1/users/me \
  -H "Authorization: Bearer sk_live_your_secret_key_here"
```

```javascript
// Node.js with fetch
const response = await fetch('https://api.payvost.com/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${process.env.PAYVOST_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

```python
# Python with requests
import requests
import os

response = requests.get(
    'https://api.payvost.com/v1/users/me',
    headers={
        'Authorization': f'Bearer {os.environ["PAYVOST_SECRET_KEY"]}',
        'Content-Type': 'application/json'
    }
)
```

```php
<?php
// PHP with cURL
$ch = curl_init('https://api.payvost.com/v1/users/me');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . getenv('PAYVOST_SECRET_KEY'),
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
```

### SDK Authentication

When using official SDKs, authentication is handled automatically:

```javascript
// Node.js
const Payvost = require('@payvost/node-sdk');

const payvost = new Payvost({
  apiKey: process.env.PAYVOST_SECRET_KEY
});

// All subsequent requests are authenticated
const user = await payvost.users.retrieve('usr_123');
```

```python
# Python
import payvost
import os

payvost.api_key = os.environ['PAYVOST_SECRET_KEY']

# All subsequent requests are authenticated
user = payvost.User.retrieve('usr_123')
```

## User Authentication (OAuth 2.0)

For applications that need to act on behalf of users, use OAuth 2.0:

### Step 1: Redirect Users to Authorize

```javascript
const authUrl = `https://auth.payvost.com/oauth/authorize?` +
  `client_id=${YOUR_CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(YOUR_REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=wallet:read wallet:write transfers:create`;

// Redirect user to authUrl
res.redirect(authUrl);
```

### Step 2: Exchange Authorization Code for Access Token

```javascript
// Node.js
const response = await fetch('https://auth.payvost.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: YOUR_CLIENT_ID,
    client_secret: YOUR_CLIENT_SECRET,
    redirect_uri: YOUR_REDIRECT_URI
  })
});

const { access_token, refresh_token, expires_in } = await response.json();
```

```python
# Python
import requests

response = requests.post(
    'https://auth.payvost.com/oauth/token',
    json={
        'grant_type': 'authorization_code',
        'code': authorization_code,
        'client_id': YOUR_CLIENT_ID,
        'client_secret': YOUR_CLIENT_SECRET,
        'redirect_uri': YOUR_REDIRECT_URI
    }
)

data = response.json()
access_token = data['access_token']
refresh_token = data['refresh_token']
```

### Step 3: Use Access Token

```javascript
const response = await fetch('https://api.payvost.com/v1/wallets', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### Step 4: Refresh Access Token

```javascript
const response = await fetch('https://auth.payvost.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    client_id: YOUR_CLIENT_ID,
    client_secret: YOUR_CLIENT_SECRET
  })
});

const { access_token: newAccessToken } = await response.json();
```

## OAuth Scopes

| Scope | Description |
|-------|-------------|
| `user:read` | Read user profile information |
| `user:write` | Update user profile information |
| `wallet:read` | Read wallet balances and transactions |
| `wallet:write` | Create wallets and update settings |
| `transfers:create` | Initiate money transfers |
| `transfers:read` | Read transfer history |
| `payments:create` | Process payments |
| `payments:read` | Read payment history |

## Firebase Authentication Integration

For applications using Firebase, Payvost provides seamless integration:

```javascript
// Node.js with Firebase Admin SDK
import admin from 'firebase-admin';
import { Payvost } from '@payvost/node-sdk';

// Initialize Firebase
admin.initializeApp();

// Verify Firebase token
const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
const userId = decodedToken.uid;

// Exchange for Payvost token
const payvostToken = await payvost.auth.exchangeFirebaseToken({
  firebaseToken: firebaseToken,
  userId: userId
});

// Use Payvost token for API calls
const client = new Payvost({
  accessToken: payvostToken.access_token
});
```

## Security Best Practices

### 1. Store Keys Securely

**Environment Variables:**
```bash
# .env file (never commit to version control)
PAYVOST_SECRET_KEY=sk_live_your_secret_key_here
PAYVOST_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
```

```javascript
// Node.js
require('dotenv').config();
const apiKey = process.env.PAYVOST_SECRET_KEY;
```

**Secrets Managers:**
```javascript
// AWS Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const secret = await secretsManager.getSecretValue({
  SecretId: 'payvost/api-key'
}).promise();

const apiKey = JSON.parse(secret.SecretString).PAYVOST_SECRET_KEY;
```

### 2. Rotate Keys Regularly

```bash
# Generate new key
curl https://api.payvost.com/v1/api-keys \
  -X POST \
  -H "Authorization: Bearer sk_live_current_key" \
  -d "description=New production key"

# Update your application
# Revoke old key after migration
curl https://api.payvost.com/v1/api-keys/key_abc123 \
  -X DELETE \
  -H "Authorization: Bearer sk_live_new_key"
```

### 3. Use IP Whitelisting

Restrict API key usage to specific IP addresses:

```bash
curl https://api.payvost.com/v1/api-keys/key_abc123 \
  -X PATCH \
  -H "Authorization: Bearer sk_live_your_key" \
  -d '{
    "allowedIps": ["203.0.113.0/24", "198.51.100.42"]
  }'
```

### 4. Monitor API Key Usage

```bash
# Get API key usage statistics
curl https://api.payvost.com/v1/api-keys/key_abc123/usage \
  -H "Authorization: Bearer sk_live_your_key"
```

Response:
```json
{
  "keyId": "key_abc123",
  "totalRequests": 15234,
  "lastUsed": "2025-11-01T10:30:00Z",
  "topEndpoints": [
    {
      "endpoint": "/v1/transfers",
      "count": 5421
    },
    {
      "endpoint": "/v1/wallets",
      "count": 3210
    }
  ],
  "errorRate": 0.02
}
```

### 5. Implement Request Signing

For additional security, sign requests with HMAC:

```javascript
// Node.js
const crypto = require('crypto');

function signRequest(method, path, body, timestamp, secretKey) {
  const payload = `${method}\n${path}\n${timestamp}\n${JSON.stringify(body)}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
  return signature;
}

const timestamp = Date.now();
const signature = signRequest('POST', '/v1/transfers', requestBody, timestamp, secretKey);

const response = await fetch('https://api.payvost.com/v1/transfers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'X-Payvost-Timestamp': timestamp,
    'X-Payvost-Signature': signature,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});
```

## Testing Authentication

### Test Your API Key

```bash
curl https://api.payvost.com/v1/auth/verify \
  -H "Authorization: Bearer sk_test_your_key"
```

Response:
```json
{
  "valid": true,
  "keyType": "secret",
  "environment": "sandbox",
  "permissions": [
    "users:read",
    "users:write",
    "wallets:read",
    "wallets:write",
    "transfers:create"
  ],
  "expiresAt": null
}
```

## Handling Authentication Errors

```javascript
try {
  const user = await payvost.users.retrieve('usr_123');
} catch (error) {
  if (error.code === 'authentication_error') {
    // Invalid or missing API key
    console.error('Authentication failed:', error.message);
    // Refresh or regenerate your API key
  } else if (error.code === 'authorization_error') {
    // Insufficient permissions
    console.error('Authorization failed:', error.message);
    // Check OAuth scopes or API key permissions
  }
}
```

## API Key Management

### List All Keys

```bash
curl https://api.payvost.com/v1/api-keys \
  -H "Authorization: Bearer sk_live_your_key"
```

### Create New Key

```bash
curl https://api.payvost.com/v1/api-keys \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -d '{
    "description": "Production server key",
    "permissions": ["transfers:create", "wallets:read"],
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

### Revoke Key

```bash
curl https://api.payvost.com/v1/api-keys/key_abc123 \
  -X DELETE \
  -H "Authorization: Bearer sk_live_your_key"
```

## Next Steps

- **[Wallet Integration](./03-wallet-integration.md)** - Manage user wallets
- **[Payment Processing](./04-payment-processing.md)** - Accept payments
- **[Webhooks](./08-webhook-notifications.md)** - Secure webhook verification
