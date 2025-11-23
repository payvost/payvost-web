# Currency Service

Web service for currency exchange rates, conversion, and fee calculations. Offloads heavy API calls and caching from Vercel.

## Features

- Real-time exchange rates from OpenExchangeRates API
- In-memory caching (persists on Render, unlike Vercel)
- Currency conversion with precise decimal calculations
- Fee calculation based on user tiers
- Supported currencies: USD, EUR, GBP, NGN, GHS, KES, ZAR, JPY, CAD, AUD, CHF, CNY, INR

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "currency-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "cacheSize": 13,
  "oxrConfigured": true
}
```

### `GET /rates`
Get current exchange rates.

**Query Parameters:**
- `base` (optional) - Base currency (default: USD)
- `target` (optional) - Specific target currency

**Response:** `200 OK`
```json
{
  "base": "USD",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "rates": {
    "EUR": "0.92",
    "GBP": "0.79",
    "NGN": "1580"
  }
}
```

### `POST /convert`
Convert amount from one currency to another.

**Request Body:**
```json
{
  "amount": "100",
  "from": "USD",
  "to": "EUR"
}
```

**Response:** `200 OK`
```json
{
  "amount": "100",
  "from": "USD",
  "to": "EUR",
  "convertedAmount": "92.00",
  "rate": "0.92",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `GET /supported`
Get list of supported currencies.

**Response:** `200 OK`
```json
{
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    }
  ]
}
```

### `POST /calculate-fees`
Calculate currency conversion fees.

**Request Body:**
```json
{
  "amount": "100",
  "from": "USD",
  "to": "EUR",
  "userTier": "STANDARD"
}
```

**Response:** `200 OK`
```json
{
  "amount": "100",
  "from": "USD",
  "to": "EUR",
  "fees": "1.00",
  "breakdown": {
    "conversionFee": "1.00",
    "markup": "0",
    "discount": "0"
  },
  "effectiveRate": "0.9108"
}
```

## Environment Variables

```env
# Port for the currency service
CURRENCY_SERVICE_PORT=3010

# OpenExchangeRates API
OPEN_EXCHANGE_RATES_APP_ID=...

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
    name: payvost-currency-service
    env: node
    buildCommand: cd backend/services/currency-service && npm install && npm run build
    startCommand: cd backend/services/currency-service && npm start
    envVars:
      - key: CURRENCY_SERVICE_PORT
        value: 3010
      - key: OPEN_EXCHANGE_RATES_APP_ID
        value: ${OPEN_EXCHANGE_RATES_APP_ID}
```

## Architecture

1. Receives rate/conversion request
2. Checks in-memory cache (5-minute TTL)
3. If cache miss, fetches from OpenExchangeRates API
4. Caches result for future requests
5. Returns formatted response

## Performance Considerations

- In-memory cache persists on Render (unlike Vercel cold starts)
- 5-minute cache TTL reduces API calls
- Falls back to mock rates if API unavailable
- Uses Decimal.js for precise financial calculations

## Dependencies

- **express** - Web server framework
- **decimal.js** - Precise decimal arithmetic
- **cors** - CORS middleware

