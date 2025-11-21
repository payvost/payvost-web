# Business Service - Local Testing Guide

## Quick Setup

### 1. Generate Prisma Client (if not already done)
```bash
npm run prisma:generate
```

### 2. Start Backend Server
```bash
# From root directory
npm run dev:server

# Or from backend directory
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 3. Test Endpoints

You'll need a Firebase authentication token. Get one from your frontend after logging in, or use the Firebase Admin SDK for testing.

#### Option A: Using curl with Firebase Token

```bash
# Replace YOUR_FIREBASE_TOKEN with actual token from browser
TOKEN="YOUR_FIREBASE_TOKEN"

# Test Dashboard Endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/business/dashboard

# Test Analytics Endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/business/analytics

# Test Health Score Endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/business/health-score

# Test Transactions Endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/business/transactions?status=all&limit=10"

# Test Quotes Endpoint (GET)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/business/quotes

# Test Payout Endpoint (POST)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientType": "new",
    "recipientName": "John Doe",
    "accountNumber": "1234567890",
    "bank": "Chase Bank",
    "amount": 100,
    "currency": "USD",
    "narration": "Test payout",
    "fundingSource": "wallet",
    "saveBeneficiary": false
  }' \
  http://localhost:3001/api/business/payouts

# Test Quote Creation (POST)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "QT-12345",
    "issueDate": "2024-01-15T00:00:00Z",
    "expiryDate": "2024-02-15T00:00:00Z",
    "clientName": "Test Client",
    "clientEmail": "client@example.com",
    "items": [
      {
        "description": "Test Item",
        "quantity": 1,
        "price": 100
      }
    ],
    "taxRate": 10,
    "currency": "USD"
  }' \
  http://localhost:3001/api/business/quotes
```

#### Option B: Using Browser DevTools

1. Open your frontend app at `http://localhost:3000`
2. Log in to get authenticated
3. Open Browser DevTools → Network tab
4. Navigate to `/business` dashboard
5. Check the network requests to see the API calls

#### Option C: Using Postman/Insomnia

1. Import the endpoints
2. Set Authorization header: `Bearer YOUR_FIREBASE_TOKEN`
3. Test each endpoint

## Expected Responses

### Dashboard (`/api/business/dashboard`)
```json
{
  "accountBalance": 52345.67,
  "accountCurrency": "USD",
  "accountName": "Business Account",
  "pendingPayouts": 5230.00,
  "pendingPayoutsCount": 2,
  "openInvoices": 8,
  "openInvoicesAmount": 12800,
  "newCustomers": 24,
  "newCustomersChange": 5,
  "recentTransactions": [...]
}
```

### Analytics (`/api/business/analytics`)
```json
{
  "grossRevenue": 152345.67,
  "netRevenue": 148987.12,
  "refunds": 1230.00,
  "taxes": 2128.55,
  "grossRevenueChange": 18.2,
  "netRevenueChange": 17.9,
  "refundsChange": -5.1,
  "taxesChange": 18.2,
  "currency": "USD",
  "revenueData": [...]
}
```

### Health Score (`/api/business/health-score`)
```json
{
  "overallScore": 85,
  "metrics": [...],
  "alerts": [...]
}
```

## Troubleshooting

### "Business account not found"
- Make sure you have a BUSINESS type account in the database
- Check: `SELECT * FROM "Account" WHERE "type" = 'BUSINESS' AND "userId" = 'YOUR_USER_ID'`

### "Unauthorized" errors
- Make sure you're passing a valid Firebase token
- Token should be in format: `Bearer <token>`

### Database connection errors
- Check your `DATABASE_URL` in `.env` or `.env.local`
- Verify database is running and accessible

### TypeScript errors
- Run `npm run prisma:generate` to regenerate Prisma Client
- Make sure all dependencies are installed: `npm install`

## Testing with Frontend

The easiest way to test is through the frontend:

1. Start both frontend and backend:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/business`

3. The dashboard should automatically fetch data from the backend

4. Check browser console for any errors

5. Check Network tab to see API requests/responses

