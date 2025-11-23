# Core Banking Service

Critical financial service for account management and fund transfers. Handles ACID transactions with database locking.

## Features

- ACID-compliant fund transfers
- Database row locking (FOR UPDATE) to prevent race conditions
- Idempotency support via idempotency keys
- Account balance management
- Ledger entry creation
- Account creation

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "core-banking-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "prismaConnected": true
}
```

### `POST /transfer`
Transfer funds between accounts.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Request Body:**
```json
{
  "fromAccountId": "account-123",
  "toAccountId": "account-456",
  "amount": "100.50",
  "currency": "USD",
  "idempotencyKey": "unique-key-123",
  "description": "Payment for invoice #123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "transferId": "transfer-789"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "Insufficient funds",
  "success": false
}
```

### `GET /balance/:accountId`
Get account balance.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Response:** `200 OK`
```json
{
  "accountId": "account-123",
  "balance": "1000.50",
  "currency": "USD"
}
```

### `POST /account`
Create a new account.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Request Body:**
```json
{
  "userId": "user-123",
  "currency": "USD"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "accountId": "account-456"
}
```

## Environment Variables

```env
# Port for the core banking service
CORE_BANKING_SERVICE_PORT=3012

# Database
DATABASE_URL=postgresql://...

# Internal API key for service-to-service authentication
INTERNAL_API_KEY=...
# OR
CORE_BANKING_SERVICE_API_KEY=...

# Node environment
NODE_ENV=production
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

### Render
Add to `render.yaml`:
```yaml
services:
  - type: web
    name: payvost-core-banking-service
    env: node
    buildCommand: cd backend/services/core-banking-service && npm install && npm run build
    startCommand: cd backend/services/core-banking-service && npm start
    envVars:
      - key: CORE_BANKING_SERVICE_PORT
        value: 3012
      - key: DATABASE_URL
        value: ${DATABASE_URL}
      - key: INTERNAL_API_KEY
        value: ${INTERNAL_API_KEY}
```

## Architecture

1. Receives transfer request with idempotency key
2. Checks for existing transfer (idempotency)
3. Starts database transaction
4. Locks both accounts using `FOR UPDATE`
5. Validates balances and amounts
6. Creates transfer record
7. Updates account balances atomically
8. Creates ledger entries
9. Commits transaction

## ACID Guarantees

- **Atomicity**: All operations succeed or fail together
- **Consistency**: Balances always sum correctly
- **Isolation**: Row locking prevents concurrent modifications
- **Durability**: All changes are persisted

## Idempotency

- Use `idempotencyKey` to prevent duplicate transfers
- If transfer with same key exists, returns existing transfer ID
- Critical for retry logic and webhook handling

## Security

- Internal API key authentication required
- All endpoints require authentication (except health check)
- Database transactions ensure data integrity
- Row locking prevents race conditions

## Dependencies

- **express** - Web server framework
- **@prisma/client** - Database client with transaction support
- **cors** - CORS middleware

