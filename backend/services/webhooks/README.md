# Webhook Service

Webhook processing service for external providers (Reloadly, etc.). Handles long-running webhook processing that would timeout on Vercel.

## Features

- Reloadly webhook processing (topup, gift cards, bill payments)
- Signature verification
- Database updates (Prisma)
- Account refunds on failures
- Email notifications via email service
- Fast response times (returns 200 OK immediately)

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`

### `POST /reloadly`
Process Reloadly webhooks.

**Headers:**
- `x-reloadly-signature` or `x-webhook-signature` - Webhook signature for verification

**Request Body:**
```json
{
  "event": "topup.success",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "transactionId": 12345,
    "customIdentifier": "topup-userId-accountId-timestamp",
    "status": "SUCCESSFUL",
    "amount": 10.00,
    "currency": "USD",
    "recipientPhone": "+1234567890"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Topup success processed"
}
```

## Supported Events

- `topup.success` - Airtime/data topup successful
- `topup.failed` - Airtime/data topup failed
- `giftcard.order.success` - Gift card order successful
- `giftcard.order.failed` - Gift card order failed
- `bill.payment.success` - Bill payment successful
- `bill.payment.failed` - Bill payment failed

## Environment Variables

```env
# Port for the webhook service
WEBHOOK_SERVICE_PORT=3008

# Webhook secret for signature verification
RELOADLY_WEBHOOK_SECRET=your-webhook-secret

# Email service URL (for notifications)
EMAIL_SERVICE_URL=http://localhost:3006

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY={...} # JSON string
# OR
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64={...} # Base64 encoded JSON

# Database
DATABASE_URL=postgresql://...

# Node environment
NODE_ENV=development
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Deployment

### Railway
```bash
cd backend/services/webhooks
railway init
railway up
```

### Render
Add to `render.yaml`:
```yaml
services:
  - type: web
    name: payvost-webhooks
    env: node
    buildCommand: cd backend/services/webhooks && npm install && npm run build
    startCommand: cd backend/services/webhooks && npm start
    # Note: buildCommand automatically runs prisma generate
    envVars:
      - key: WEBHOOK_SERVICE_PORT
        value: 3008
      - key: RELOADLY_WEBHOOK_SECRET
        value: ${RELOADLY_WEBHOOK_SECRET}
      - key: EMAIL_SERVICE_URL
        value: ${EMAIL_SERVICE_URL}
      - key: DATABASE_URL
        value: ${DATABASE_URL}
```

## Architecture

1. Receives webhook request
2. Verifies webhook signature
3. Parses payload
4. Routes to appropriate handler
5. Updates database (Prisma)
6. Processes refunds if needed
7. Sends email notifications via email service
8. Returns 200 OK immediately (async processing)

## Dependencies

- **express** - Web server framework
- **@prisma/client** - Database client
- **firebase-admin** - Firebase Admin SDK
- **cors** - CORS middleware

## Performance Considerations

- Returns 200 OK immediately to prevent webhook retries
- Long-running operations (refunds, emails) happen asynchronously
- Designed to run on Railway/Render with longer timeouts
- Can handle complex database transactions

