# Development Setup Guide

This guide helps you set up and test all services locally in development mode.

## Prerequisites

- Node.js 18+ and npm
- Firebase project credentials file
- PostgreSQL database (local or remote)
- Environment variables configured

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local` (if it exists)
   - Or create `.env.local` in the root directory
   - See [Environment Variables](#environment-variables) section below

3. **Set up Firebase credentials**
   - Place your Firebase service account JSON file at:
     - `backend/payvost-web-firebase-adminsdk-fbsvc-f14c86f5d6.json`
   - OR remove `FIREBASE_SERVICE_ACCOUNT_KEY` from your `.env.local` to use the local file

4. **Start all services**
   ```bash
   npm run dev
   ```

## Environment Variables

### For Local Development

Create a `.env.local` file in the root directory with these variables:

```bash
# Node Environment
NODE_ENV=development

# Database
# Add connection pool parameters to prevent connection pool exhaustion
# connection_limit: Maximum number of connections (default: 5, recommended: 10-20 for dev)
# pool_timeout: Timeout in seconds to get a connection (default: 10, recommended: 20)
DATABASE_URL=postgresql://user:password@localhost:5432/payvost?connection_limit=10&pool_timeout=20

# Firebase (Optional - will use local file if not set)
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# OR remove this line to use local file: backend/payvost-web-firebase-adminsdk-fbsvc-f14c86f5d6.json

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Email Service (Mailgun)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=no-reply@payvost.com

# Service Ports
EMAIL_SERVICE_PORT=3006
PDF_SERVICE_PORT=3007
ADMIN_STATS_SERVICE_PORT=3008
RATE_ALERT_SERVICE_PORT=3009
WEBHOOK_SERVICE_PORT=3010
```

### Firebase Service Account Setup

**Option 1: Use Local File (Recommended for Development)**
1. Download your Firebase service account JSON from Firebase Console
2. Place it at: `backend/payvost-web-firebase-adminsdk-fbsvc-f14c86f5d6.json`
3. **Do NOT** set `FIREBASE_SERVICE_ACCOUNT_KEY` in your `.env.local`
4. The app will automatically use the local file

**Option 2: Use Environment Variable**
1. If you set `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`, it must be valid JSON
2. If the JSON is invalid, the app will fall back to the local file in development
3. For production (Render/Vercel), use the environment variable

**To prepare Firebase JSON for environment variable:**
```bash
node scripts/prepare-firebase-env.js
```

## Running Individual Services

### Frontend (Next.js)
```bash
npm run dev:client
# Runs on http://localhost:3000
```

### Backend API Gateway
```bash
npm run dev:server
# Runs on http://localhost:3001
```

### Email Service
```bash
npm run dev:email
# Runs on http://localhost:3006
```

### PDF Service
```bash
npm run dev:pdf
# Runs on http://localhost:3007
```

### Admin Stats Service
```bash
npm run dev:admin-stats
# Runs on http://localhost:3008
```

### Webhook Service
```bash
npm run dev:webhooks
# Runs on http://localhost:3010
```

## Common Issues and Fixes

### Issue: Prisma Connection Pool Timeout - "Timed out fetching a new connection"

**Cause:** Multiple parallel Prisma queries are exhausting the connection pool (default limit: 5 connections).

**Solution:**
1. **Add connection pool parameters to your DATABASE_URL:**
   ```bash
   # In .env.local, update DATABASE_URL to include pool parameters:
   DATABASE_URL=postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=20
   ```
   
2. **The route has been optimized** to use `$transaction` which reuses connections efficiently

3. **For Neon/other hosted databases**, check if they have connection limits and adjust accordingly

**Example for Neon:**
```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require&connection_limit=10&pool_timeout=20
```

### Issue: Firebase Admin SDK Error - "Bad control character in string literal"

**Cause:** The `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable has invalid JSON (likely contains actual newlines instead of `\n`).

**Solution:**
1. **For local development:** Remove `FIREBASE_SERVICE_ACCOUNT_KEY` from `.env.local` and use the local file instead
2. **Or fix the JSON:** Ensure the entire JSON is on one line with `\n` for newlines in the private_key

**Example of correct format:**
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"payvost-web","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",...}
```

### Issue: Email Service - "Cannot find module './common/mailgun'"

**Cause:** The common mailgun file hasn't been compiled yet.

**Solution:**
1. The `predev` script should automatically build it, but if it fails:
   ```bash
   cd backend/services/email
   npm run predev
   ```
2. Or manually run:
   ```bash
   cd backend/services/email
   node scripts/build-common.js
   ```

### Issue: Services not starting

**Check:**
1. All dependencies installed: `npm install`
2. Database is accessible: Check `DATABASE_URL`
3. Ports are not in use: Check if ports 3000-3010 are available
4. Environment variables are set correctly

## Testing Services

### Test Email Service
```bash
curl -X POST http://localhost:3006/single \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

### Test Backend API
```bash
curl http://localhost:3001/api/health
```

### Test Frontend
Open http://localhost:3000 in your browser

## Production Deployment (Render)

For production deployment on Render, you'll need to:

1. **Set environment variables in Render dashboard:**
   - Go to your service → Environment
   - Add all required variables from `docs/RENDER_ENVIRONMENT_VARIABLES.md`

2. **Firebase Service Account:**
   - Use `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
   - The JSON must be valid (single line, escaped newlines)
   - Use the script: `node scripts/prepare-firebase-env.js` to format it

3. **Build commands:**
   - Backend: `cd backend && npm install && npm run build`
   - Frontend: `npm install && npm run build`

4. **Start commands:**
   - Backend: `cd backend && node dist/index.js`
   - Frontend: `npm start`

## Troubleshooting

### Check service logs
Each service outputs logs to the console. Look for:
- `[dev:client]` - Frontend logs
- `[dev:server]` - Backend API logs
- `[dev:email]` - Email service logs
- etc.

### Verify Firebase initialization
Look for these log messages:
- ✅ `Firebase Admin SDK: Using local service account file: ...`
- ✅ `Firebase Admin SDK initialized successfully`
- ❌ `Failed to initialize Firebase Admin SDK` - Check credentials

### Verify Email Service
Look for:
- ✅ `[Build] Common mailgun.ts compiled successfully`
- ✅ `[Email Service] Running on port 3006`
- ✅ `[Email Service] Mailgun API: configured`

## Next Steps

- See `README.md` for general project information
- See `docs/RENDER_ENVIRONMENT_VARIABLES.md` for production setup
- See individual service READMEs in `backend/services/*/README.md`

