# Admin Stats Service

Heavy data aggregation service for admin dashboard statistics. Handles complex queries that would timeout on Vercel.

## Features

- Dashboard statistics (total volume, active users, payouts, etc.)
- Volume over time analysis
- Growth calculations
- Currency filtering
- Date range filtering

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`

### `GET /stats`
Get dashboard statistics.

**Query Parameters:**
- `startDate` (optional) - Start date (ISO string)
- `endDate` (optional) - End date (ISO string)
- `currency` (optional) - Filter by currency (e.g., 'USD', 'NGN', or 'ALL')

**Response:** `200 OK`
```json
{
  "totalVolume": 125000.50,
  "activeUsers": 245,
  "totalUsers": 500,
  "totalPayouts": 75000.25,
  "avgTransactionValue": 510.20,
  "transactionCount": 245,
  "growth": {
    "volume": 15.5,
    "activeUsers": 0,
    "payouts": 12.3,
    "avgValue": 5.2
  }
}
```

### `GET /volume-over-time`
Get transaction volume over time (monthly breakdown).

**Query Parameters:**
- `startDate` (optional) - Start date (ISO string, defaults to 12 months ago)
- `endDate` (optional) - End date (ISO string, defaults to now)
- `currency` (optional) - Filter by currency

**Response:** `200 OK`
```json
{
  "data": [
    {
      "month": "January 2024",
      "volume": 10000,
      "payouts": 6000
    },
    {
      "month": "February 2024",
      "volume": 12000,
      "payouts": 7000
    }
  ]
}
```

## Environment Variables

```env
# Port for the admin stats service
ADMIN_STATS_SERVICE_PORT=3007

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY={...} # JSON string
# OR
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64={...} # Base64 encoded JSON

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
cd backend/services/admin-stats
railway init
railway up
```

### Render
Add to `render.yaml`:
```yaml
services:
  - type: web
    name: payvost-admin-stats
    env: node
    buildCommand: cd backend/services/admin-stats && npm install && npm run build
    startCommand: cd backend/services/admin-stats && npm start
    envVars:
      - key: ADMIN_STATS_SERVICE_PORT
        value: 3007
      - key: FIREBASE_SERVICE_ACCOUNT_KEY
        value: ${FIREBASE_SERVICE_ACCOUNT_KEY}
```

## Architecture

1. Receives stats request with optional filters
2. Queries Firestore for all users
3. Iterates through users and their transactions
4. Aggregates data (volume, payouts, counts)
5. Calculates growth percentages
6. Returns formatted statistics

## Performance Considerations

- This service handles heavy queries that iterate through all users
- Designed to run on Railway/Render with longer timeouts
- Can take 10-30+ seconds for large datasets
- Consider caching results for frequently accessed stats

## Dependencies

- **express** - Web server framework
- **firebase-admin** - Firebase Admin SDK for Firestore access
- **cors** - CORS middleware

