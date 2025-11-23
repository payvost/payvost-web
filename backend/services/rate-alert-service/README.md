# Rate Alert Monitor Service

Background service that monitors FX rate alerts and sends notifications when target rates are met.

## Features

- Monitors active FX rate alerts from database
- Fetches real-time exchange rates from OpenExchangeRates API
- Sends email notifications via Mailgun
- Sends push notifications via Web Push
- Marks alerts as notified after triggering

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "rate-alert-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "prismaConnected": true,
  "mailgunConfigured": true,
  "webpushConfigured": true,
  "oxrConfigured": true
}
```

### `POST /run`
Manually trigger the rate alert monitor.

**Response:** `200 OK`
```json
{
  "success": true,
  "processed": 10,
  "notified": 3,
  "errors": 0
}
```

## Environment Variables

```env
# Port for the rate alert service
RATE_ALERT_SERVICE_PORT=3009

# Database
DATABASE_URL=postgresql://...

# Mailgun (for email notifications)
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...

# Web Push (for push notifications)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=alerts@payvost.com

# OpenExchangeRates API
OPEN_EXCHANGE_RATES_APP_ID=...

# Auto-run on startup (for Render Cron Jobs)
AUTO_RUN_ON_STARTUP=true

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

### Render (Background Worker / Cron Job)

**Option 1: Background Worker (Always Running)**
- Service Type: Background Worker
- Build Command: `cd backend/services/rate-alert-service && npm install && npm run build`
- Start Command: `cd backend/services/rate-alert-service && npm start`
- Set `AUTO_RUN_ON_STARTUP=false` and use a cron job to call `POST /run`

**Option 2: Cron Job (Scheduled)**
- Service Type: Cron Job
- Schedule: `*/15 * * * *` (every 15 minutes)
- Build Command: `cd backend/services/rate-alert-service && npm install && npm run build`
- Start Command: `cd backend/services/rate-alert-service && npm start && curl -X POST http://localhost:3009/run`
- Or set `AUTO_RUN_ON_STARTUP=true` and use: `cd backend/services/rate-alert-service && npm start`

## Architecture

1. Service starts and optionally auto-runs monitor
2. Fetches all active alerts from database
3. Fetches current FX rates from OpenExchangeRates API
4. For each alert, checks if target rate is met
5. Sends email and/or push notifications
6. Marks alert as notified and deactivates it

## Performance Considerations

- Processes alerts sequentially to avoid rate limits
- Handles expired push subscriptions gracefully
- Logs all operations for debugging
- Can be triggered manually or run on schedule

## Dependencies

- **express** - Web server framework
- **@prisma/client** - Database client
- **mailgun.js** - Email sending
- **web-push** - Push notifications
- **axios** - HTTP client for FX rates API

