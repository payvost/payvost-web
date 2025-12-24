# Render Services - Required Environment Variables

This document lists all required and optional environment variables for each Render service.

## 1. payvost-backend-gateway

**Port:** `3001`  
**Description:** Main API Gateway (includes all service routes)

### Required Variables
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=<your-neon-postgresql-connection-string>
FIREBASE_SERVICE_ACCOUNT_KEY=<firebase-service-account-json-as-string>
FRONTEND_URL=<comma-separated-origins>
```

### Optional but Recommended
```env
# Firebase
FIREBASE_DATABASE_URL=<firebase-realtime-database-url>

# Redis (for caching)
REDIS_URL=<redis-connection-url>

# Email (Mailgun)
MAILGUN_API_KEY=<mailgun-api-key>
MAILGUN_DOMAIN=<mailgun-domain>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_FROM_NUMBER=<twilio-phone-number>

# JWT Authentication
JWT_SECRET=<jwt-secret-key>

# AI Chat (OpenAI)
OPENAI_API_KEY=<openai-api-key>

# Service URLs (for proxying to other services)
PDF_SERVICE_URL=https://payvost-pdf-generator.onrender.com
EMAIL_SERVICE_URL=https://payvost-email-service.onrender.com
ADMIN_STATS_SERVICE_URL=https://payvost-admin-stat-service.onrender.com
WEBHOOK_SERVICE_URL=https://payvost-web-hook-services.onrender.com
CURRENCY_SERVICE_URL=https://payvost-currency-service.onrender.com
FRAUD_SERVICE_URL=https://payvost-fraud-service.onrender.com
CORE_BANKING_SERVICE_URL=https://payvost-core-banking-service.onrender.com
RATE_ALERT_SERVICE_URL=https://payvost-rate-alert-service.onrender.com
NOTIFICATION_SERVICE_URL=https://payvost-notification-service.onrender.com
```

---

## 2. payvost-rate-alert-service

**Port:** `3009`  
**Description:** Rate alert monitoring background worker

### Required Variables
```env
RATE_ALERT_SERVICE_PORT=3009
NODE_ENV=production
DATABASE_URL=<your-neon-postgresql-connection-string>
OPEN_EXCHANGE_RATES_APP_ID=<open-exchange-rates-api-key>
```

### Optional
```env
# Email notifications
MAILGUN_API_KEY=<mailgun-api-key>
MAILGUN_DOMAIN=<mailgun-domain>

# Push notifications (VAPID)
VAPID_PUBLIC_KEY=<vapid-public-key>
VAPID_PRIVATE_KEY=<vapid-private-key>
VAPID_EMAIL=alerts@payvost.com

# Auto-run on startup (set to "true" for always-on monitoring)
AUTO_RUN_ON_STARTUP=false
```

---

## 3. payvost-currency-service

**Port:** `3010`  
**Description:** Currency exchange rates and conversion

### Required Variables
```env
CURRENCY_SERVICE_PORT=3010
NODE_ENV=production
OPEN_EXCHANGE_RATES_APP_ID=<open-exchange-rates-api-key>
```

---

## 4. payvost-fraud-service

**Port:** `3011`  
**Description:** Fraud detection and risk analysis

### Required Variables
```env
FRAUD_SERVICE_PORT=3011
NODE_ENV=production
DATABASE_URL=<your-neon-postgresql-connection-string>
INTERNAL_API_KEY=<secure-random-string-for-internal-auth>
```

**Note:** Generate a secure random string for `INTERNAL_API_KEY` (e.g., using `openssl rand -hex 32`)

---

## 5. payvost-core-banking-service

**Port:** `3012`  
**Description:** Core banking operations (transfers, accounts)

### Required Variables
```env
CORE_BANKING_SERVICE_PORT=3012
NODE_ENV=production
DATABASE_URL=<your-neon-postgresql-connection-string>
INTERNAL_API_KEY=<secure-random-string-for-internal-auth>
```

**Note:** Can use the same `INTERNAL_API_KEY` as fraud service or a separate one

---

## 6. payvost-web-hook-services

**Port:** `3008`  
**Description:** Webhook processing (Reloadly, Mailgun, etc.)

### Required Variables
```env
WEBHOOK_SERVICE_PORT=3008
NODE_ENV=production
DATABASE_URL=<your-neon-postgresql-connection-string>
FIREBASE_SERVICE_ACCOUNT_KEY=<firebase-service-account-json-as-string>
RELOADLY_WEBHOOK_SECRET=<reloadly-webhook-secret>
```

---

## 7. payvost-admin-stat-service

**Port:** `3007`  
**Description:** Admin dashboard statistics

### Required Variables
```env
ADMIN_STATS_SERVICE_PORT=3007
NODE_ENV=production
FIREBASE_SERVICE_ACCOUNT_KEY=<firebase-service-account-json-as-string>
```

### Optional
```env
DATABASE_URL=<your-neon-postgresql-connection-string>
```

---

## 8. payvost-pdf-generator

**Port:** `8080`  
**Description:** PDF generation service

### Required Variables
```env
PORT=8080
NODE_ENV=production
```

### Optional
```env
VERCEL_BASE_URL=<vercel-base-url-for-invoice-data>
```

---

## 9. payvost-email-service

**Port:** `3006`  
**Description:** Email sending service

### Required Variables
```env
EMAIL_SERVICE_PORT=3006
NODE_ENV=production
MAILGUN_API_KEY=<mailgun-api-key>
MAILGUN_DOMAIN=<mailgun-domain>
MAILGUN_FROM_EMAIL=<from-email-address>
```

**Example:**
```env
MAILGUN_FROM_EMAIL=no-reply@payvost.com
```

---

## 10. payvost-notification-service

**Port:** `3005`  
**Description:** Webhook-based notifications

### Required Variables
```env
NOTIFICATION_SERVICE_PORT=3005
NODE_ENV=production
EMAIL_SERVICE_URL=https://payvost-email-service.onrender.com
```

### Optional
```env
INTERNAL_API_KEY=<api-key-for-internal-service-communication>
```

---

## Shared Environment Variables

### Database
All services that need database access require:
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Firebase
Services that need Firebase access require:
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Note:** The entire Firebase service account JSON should be provided as a single string.

---

## Service URL Configuration

After deploying services, update the backend gateway with the actual service URLs:

```env
# In payvost-backend-gateway
PDF_SERVICE_URL=https://payvost-pdf-generator.onrender.com
EMAIL_SERVICE_URL=https://payvost-email-service.onrender.com
ADMIN_STATS_SERVICE_URL=https://payvost-admin-stat-service.onrender.com
WEBHOOK_SERVICE_URL=https://payvost-web-hook-services.onrender.com
CURRENCY_SERVICE_URL=https://payvost-currency-service.onrender.com
FRAUD_SERVICE_URL=https://payvost-fraud-service.onrender.com
CORE_BANKING_SERVICE_URL=https://payvost-core-banking-service.onrender.com
RATE_ALERT_SERVICE_URL=https://payvost-rate-alert-service.onrender.com
NOTIFICATION_SERVICE_URL=https://payvost-notification-service.onrender.com
```

---

## Quick Setup Checklist

### 1. Database
- [ ] Create Neon PostgreSQL database
- [ ] Copy `DATABASE_URL` connection string
- [ ] Run Prisma migrations: `npx prisma migrate deploy`

### 2. Firebase
- [ ] Get Firebase service account JSON
- [ ] Convert to string (escape quotes) or use Render's environment variable editor

### 3. API Keys
- [ ] Open Exchange Rates: Get `OPEN_EXCHANGE_RATES_APP_ID` from https://openexchangerates.org
- [ ] Mailgun: Get `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` from https://mailgun.com
- [ ] OpenAI: Get `OPENAI_API_KEY` from https://platform.openai.com (optional, for AI chat)
- [ ] Twilio: Get credentials from https://twilio.com (optional, for SMS)

### 4. Internal API Keys
- [ ] Generate `INTERNAL_API_KEY`: `openssl rand -hex 32`
- [ ] Use same key for fraud and core banking services, or separate keys

### 5. Service URLs
- [ ] Deploy all services first
- [ ] Copy service URLs from Render dashboard
- [ ] Update backend gateway with service URLs

---

## Environment Variable Priority

1. **Critical (Service won't start without these):**
   - `DATABASE_URL` (for services that need DB)
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (for services that need Firebase)
   - `NODE_ENV=production`

2. **Important (Features won't work without these):**
   - `OPEN_EXCHANGE_RATES_APP_ID` (for currency/rate services)
   - `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (for email services)
   - `INTERNAL_API_KEY` (for fraud/core banking services)

3. **Optional (Features disabled gracefully if missing):**
   - `OPENAI_API_KEY` (AI chat disabled)
   - `TWILIO_*` (SMS notifications disabled)
   - `REDIS_URL` (Caching disabled)
   - Service URLs (Will use localhost defaults, update after deployment)

---

## Security Notes

1. **Never commit environment variables to git**
2. **Use Render's environment variable editor** for sensitive values
3. **Rotate API keys regularly**
4. **Use different `INTERNAL_API_KEY` values** for different environments (dev/staging/prod)
5. **Firebase service account JSON** should be kept secure - it has full access to your Firebase project

