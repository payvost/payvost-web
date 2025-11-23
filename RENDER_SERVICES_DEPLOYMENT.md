# Render Services Deployment Guide

This document describes the deployment of all Payvost services on Render.

## Services Overview

### Already Deployed
1. **payvost-web-hook-services** - Webhook processing (Reloadly, etc.)
2. **payvost-admin-stat-service** - Admin dashboard statistics
3. **payvost-pdf-generator** - PDF generation service
4. **payvost-email-service** - Email sending service

### New Services (Priority)
1. **payvost-rate-alert-service** - Rate alert monitoring (Background Worker)
2. **payvost-currency-service** - Currency exchange rates and conversion
3. **payvost-fraud-service** - Fraud detection and risk analysis
4. **payvost-core-banking-service** - Core banking operations (transfers, accounts)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push render.yaml to your repository**
   ```bash
   git add render.yaml
   git commit -m "Add Render services configuration"
   git push
   ```

2. **Connect repository to Render**
   - Go to Render Dashboard → New → Blueprint
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Set Environment Variables**
   For each service, set the following in Render Dashboard:
   
   **Rate Alert Service:**
   - `MAILGUN_API_KEY`
   - `MAILGUN_DOMAIN`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `OPEN_EXCHANGE_RATES_APP_ID`
   
   **Currency Service:**
   - `OPEN_EXCHANGE_RATES_APP_ID`
   
   **Fraud Service:**
   - `INTERNAL_API_KEY` (generate a secure random string)
   
   **Core Banking Service:**
   - `INTERNAL_API_KEY` (same as Fraud Service or separate)

4. **Deploy**
   - Render will automatically deploy all services
   - Monitor logs for each service

### Option 2: Manual Deployment

For each service, create a new Web Service:

1. **Rate Alert Service**
   - Name: `payvost-rate-alert-service`
   - Environment: Node
   - Build Command: `cd backend/services/rate-alert-service && npm install && npm run build`
   - Start Command: `cd backend/services/rate-alert-service && npm start`
   - Port: `3009`

2. **Currency Service**
   - Name: `payvost-currency-service`
   - Environment: Node
   - Build Command: `cd backend/services/currency-service && npm install && npm run build`
   - Start Command: `cd backend/services/currency-service && npm start`
   - Port: `3010`

3. **Fraud Service**
   - Name: `payvost-fraud-service`
   - Environment: Node
   - Build Command: `cd backend/services/fraud-service && npm install && npm run build`
   - Start Command: `cd backend/services/fraud-service && npm start`
   - Port: `3011`

4. **Core Banking Service**
   - Name: `payvost-core-banking-service`
   - Environment: Node
   - Build Command: `cd backend/services/core-banking-service && npm install && npm run build`
   - Start Command: `cd backend/services/core-banking-service && npm start`
   - Port: `3012`

## Environment Variables

### Shared Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set if using Render PostgreSQL)
- `NODE_ENV=production`

### Rate Alert Service
```env
RATE_ALERT_SERVICE_PORT=3009
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=alerts@payvost.com
OPEN_EXCHANGE_RATES_APP_ID=...
AUTO_RUN_ON_STARTUP=false
```

### Currency Service
```env
CURRENCY_SERVICE_PORT=3010
OPEN_EXCHANGE_RATES_APP_ID=...
```

### Fraud Service
```env
FRAUD_SERVICE_PORT=3011
INTERNAL_API_KEY=...  # Generate secure random string
```

### Core Banking Service
```env
CORE_BANKING_SERVICE_PORT=3012
INTERNAL_API_KEY=...  # Same as Fraud Service or separate
```

## Service URLs

After deployment, services will be available at:
- Rate Alert: `https://payvost-rate-alert-service.onrender.com`
- Currency: `https://payvost-currency-service.onrender.com`
- Fraud: `https://payvost-fraud-service.onrender.com`
- Core Banking: `https://payvost-core-banking-service.onrender.com`

## Rate Alert Monitor Setup

The Rate Alert Service can run in two modes:

### Mode 1: Always-On Background Worker
- Service Type: Web Service
- Set `AUTO_RUN_ON_STARTUP=false`
- Use Render Cron Job or external scheduler to call `POST /run` every 15 minutes

### Mode 2: Scheduled Cron Job
- Service Type: Cron Job
- Schedule: `*/15 * * * *` (every 15 minutes)
- Command: `cd backend/services/rate-alert-service && npm start && curl -X POST http://localhost:3009/run`
- Or set `AUTO_RUN_ON_STARTUP=true` and just run: `cd backend/services/rate-alert-service && npm start`

## Vercel Integration

Update your Vercel environment variables to point to Render services:

```env
# Currency Service
CURRENCY_SERVICE_URL=https://payvost-currency-service.onrender.com

# Fraud Service
FRAUD_SERVICE_URL=https://payvost-fraud-service.onrender.com
FRAUD_SERVICE_API_KEY=<same-as-INTERNAL_API_KEY>

# Core Banking Service
CORE_BANKING_SERVICE_URL=https://payvost-core-banking-service.onrender.com
CORE_BANKING_SERVICE_API_KEY=<same-as-INTERNAL_API_KEY>

# Rate Alert Service (for manual triggers)
RATE_ALERT_SERVICE_URL=https://payvost-rate-alert-service.onrender.com
```

## Testing

### Health Checks
```bash
# Rate Alert Service
curl https://payvost-rate-alert-service.onrender.com/health

# Currency Service
curl https://payvost-currency-service.onrender.com/health

# Fraud Service
curl https://payvost-fraud-service.onrender.com/health

# Core Banking Service
curl https://payvost-core-banking-service.onrender.com/health
```

### Test Currency Service
```bash
curl "https://payvost-currency-service.onrender.com/rates?base=USD&target=EUR"
```

### Test Fraud Service
```bash
curl -X POST https://payvost-fraud-service.onrender.com/analyze-transaction \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "account-123",
    "toAccountId": "account-456",
    "amount": "100.00",
    "currency": "USD"
  }'
```

### Test Core Banking Service
```bash
curl -X POST https://payvost-core-banking-service.onrender.com/transfer \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "account-123",
    "toAccountId": "account-456",
    "amount": "100.00",
    "currency": "USD",
    "idempotencyKey": "test-123",
    "description": "Test transfer"
  }'
```

## Monitoring

- Check service logs in Render Dashboard
- Monitor health endpoints
- Set up alerts for service failures
- Monitor database connections

## Troubleshooting

### Service Won't Start
- Check build logs for compilation errors
- Verify all environment variables are set
- Check Prisma schema is accessible

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from Render
- Ensure Prisma migrations are run

### Authentication Errors
- Verify `INTERNAL_API_KEY` matches between services
- Check API key is included in request headers

### Rate Alert Not Running
- Check if service is running (not sleeping)
- Verify cron job schedule if using scheduled mode
- Check logs for errors

## Cost Considerations

- **Starter Plan ($7/month per service)**: Recommended for production
- **Free Tier**: Services sleep after 15 minutes of inactivity
- **Background Workers**: Always-on, no sleep (Starter plan required)

## Next Steps

1. Deploy all services to Render
2. Update Vercel environment variables
3. Update frontend/backend to use new service URLs
4. Test all integrations
5. Monitor performance and adjust as needed

