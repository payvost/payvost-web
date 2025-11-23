# Fraud Detection Service

Web service for fraud detection, risk analysis, and compliance monitoring. Handles complex database queries and risk calculations.

## Features

- Transaction risk analysis with multiple factors
- Account risk scoring
- Compliance alert management
- Real-time fraud detection
- Complex database aggregations

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "fraud-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "prismaConnected": true
}
```

### `POST /analyze-transaction`
Analyze a transaction for fraud risk.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Request Body:**
```json
{
  "fromAccountId": "account-123",
  "toAccountId": "account-456",
  "amount": "1000.00",
  "currency": "USD"
}
```

**Response:** `200 OK`
```json
{
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "factors": [
    "Elevated transaction velocity",
    "New recipient"
  ],
  "recommendation": "Monitor closely and consider additional checks"
}
```

### `GET /risk-score/:accountId`
Get risk score for an account.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Response:** `200 OK`
```json
{
  "accountId": "account-123",
  "riskScore": 30,
  "riskLevel": "MEDIUM",
  "factors": [
    "Account less than 30 days old",
    "KYC not verified"
  ]
}
```

### `GET /alerts`
Get compliance alerts.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Query Parameters:**
- `status` (optional) - Filter by status
- `severity` (optional) - Filter by severity
- `limit` (optional) - Results limit (default: 50)
- `offset` (optional) - Results offset (default: 0)

**Response:** `200 OK`
```json
{
  "alerts": [...],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

### `POST /alerts/:id/resolve`
Resolve a compliance alert.

**Headers:**
- `X-API-Key: <internal-api-key>` or `Authorization: Bearer <internal-api-key>`

**Request Body:**
```json
{
  "resolution": "False positive - verified user",
  "resolvedBy": "admin-user-id"
}
```

## Environment Variables

```env
# Port for the fraud service
FRAUD_SERVICE_PORT=3011

# Database
DATABASE_URL=postgresql://...

# Internal API key for service-to-service authentication
INTERNAL_API_KEY=...
# OR
FRAUD_SERVICE_API_KEY=...

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
    name: payvost-fraud-service
    env: node
    buildCommand: cd backend/services/fraud-service && npm install && npm run build
    startCommand: cd backend/services/fraud-service && npm start
    envVars:
      - key: FRAUD_SERVICE_PORT
        value: 3011
      - key: DATABASE_URL
        value: ${DATABASE_URL}
      - key: INTERNAL_API_KEY
        value: ${INTERNAL_API_KEY}
```

## Architecture

1. Receives transaction analysis request
2. Performs multiple database queries:
   - Transaction velocity check
   - Average transaction amount calculation
   - Recipient history check
   - Account age verification
   - KYC status check
3. Calculates risk score based on factors
4. Creates compliance alert if high risk
5. Returns risk assessment

## Risk Factors

- **Transaction Velocity**: Number of transactions in last hour
- **Amount Anomaly**: Comparison to account's average transaction
- **New Recipient**: First-time transfer to recipient
- **Account Age**: Days since account creation
- **KYC Status**: Identity verification status

## Risk Levels

- **LOW** (0-29): Proceed with transaction
- **MEDIUM** (30-49): Monitor closely
- **HIGH** (50-79): Require additional verification
- **CRITICAL** (80+): Block and flag for review

## Dependencies

- **express** - Web server framework
- **@prisma/client** - Database client
- **decimal.js** - Precise decimal arithmetic
- **cors** - CORS middleware

