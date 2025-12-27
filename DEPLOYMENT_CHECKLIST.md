# notification-processor Deployment Checklist

## Pre-Deployment Verification ✅

### Code Status
- [x] All TypeScript errors fixed (11 errors → 0)
- [x] Service compiles successfully locally: `npm run build`
- [x] Prisma Client generates correctly: `npx prisma generate`
- [x] All source files in `/src`: index.ts, cron-jobs.ts, mailgun.ts, prisma.ts
- [x] All built files in `/dist`: TypeScript compiled

### Configuration Files
- [x] `package.json`: Dependencies installed, scripts configured
- [x] `tsconfig.json`: ES2020 target, rootDir ./src, strict mode
- [x] `.env`: DATABASE_URL configured (for local testing)
- [x] `prisma/schema.prisma`: Copied from main schema, generator output correct
- [x] `render.yaml`: Service configuration simplified, build command fixed

### Dependencies
- [x] @types/cors: Added (was missing)
- [x] @types/node: Present
- [x] @types/express: Present
- [x] prisma: Added to devDependencies
- [x] All runtime deps: express, @prisma/client, mailgun.js, node-cron, etc.

### Environment Variables (Required on Render)
- [ ] DATABASE_URL: PostgreSQL connection string
- [ ] DIRECT_URL: Direct database URL (optional, for Prisma optimization)
- [ ] MAILGUN_API_KEY: For email delivery
- [ ] MAILGUN_DOMAIN: Mailgun domain (e.g., mg.payvost.com)
- [ ] MAILGUN_FROM_EMAIL: From email address

### Features
- [x] Express server with 4 endpoints: /, /health, /send, /test
- [x] CORS middleware enabled
- [x] JSON body parser configured
- [x] Cron job initialized: Invoice reminder daily 9 AM UTC
- [x] Graceful shutdown: SIGTERM and SIGINT handlers
- [x] Error handling in cron jobs (per-invoice try-catch)
- [x] Mailgun integration: sendEmailViaMailgun() function

### Database Models (Available through Prisma)
- [x] User: For email contact information
- [x] Account: For owner/customer account mapping
- [x] Invoice: Core model for invoice reminders

### Build Process (on Render)
1. cd backend/services/notification-processor
2. npm install --include=dev
3. npx prisma generate (generates from prisma/schema.prisma)
4. npm run build (tsc compiles to dist/)

### Startup Command
```bash
cd backend/services/notification-processor && npm start
```

This runs: `node dist/index.js`

## Deployment Steps

### Step 1: Commit Changes
```bash
git add -A
git commit -m "Fix Prisma Client path resolution for Render deployment"
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Deploy to Render
1. Go to Render Dashboard
2. Select payvost-notification-processor service
3. Click "Deploy"
4. Monitor build logs

### Step 4: Verify Deployment
1. Check build logs for success:
   - ✓ npm install completed
   - ✓ prisma generate succeeded
   - ✓ tsc build succeeded
2. Test health endpoint: `GET https://payvost-notification-processor-<id>.onrender.com/health`
3. Expected response: `{ "status": "healthy" }`

### Step 5: Monitor Runtime
1. Check service logs for startup:
   - Should show: ASCII banner with service info
   - Should show: Cron job initialized
   - Should show: "Listening on port 3006"
2. Monitor error logs for database connection issues
3. Verify cron job runs at scheduled time

## Troubleshooting

### Build Fails
- Check: DATABASE_URL environment variable is set
- Check: DIRECT_URL is optional but helps with connection pooling
- Check: Render has enough memory (starter plan is 0.5 GB)

### Service Won't Start
- Check: Node process running: `npm start` should start on port 3006
- Check: No port conflicts with other services
- Check: Prisma Client generated successfully (check build logs)

### Cron Job Not Running
- Check: Invoice records exist in database with DRAFT status
- Check: Due date within 3 days from today
- Check: paidAt is null (invoice not paid)
- Check: Service logs for cron job execution

### Email Not Sending
- Check: MAILGUN_API_KEY is set correctly
- Check: MAILGUN_DOMAIN is set (format: mg.payvost.com)
- Check: MAILGUN_FROM_EMAIL is set
- Check: Check Mailgun dashboard for bounced emails

## Success Criteria

✅ **Deployment Complete When**:
1. Build succeeds on Render (all 4 steps complete)
2. Service starts and listens on port 3006
3. Health endpoint returns 200 status
4. Cron job logs appear in service logs
5. No errors in Render logs

✅ **Production Ready When**:
1. All above + tested with real database
2. Invoice reminder emails sent successfully
3. Daily 9 AM UTC cron job verified
4. Error handling tested (malformed data, API failures)
5. Service responds gracefully under load

## After Deployment

1. **Monitor**: Check Render logs daily for first week
2. **Test**: Send test email via POST /send endpoint
3. **Verify**: Check invoice reminders are being sent
4. **Optimize**: Monitor database connection usage
5. **Document**: Update deployment guide with actual URL

## Useful Commands for Debugging

Local testing:
```bash
cd backend/services/notification-processor

# Test with local environment
npm run dev

# Test build
npm run build

# Test start
npm start

# Check Prisma Client
npx prisma generate --verbose

# View generated schema
npx prisma db push --dry-run
```

Render:
```bash
# View logs
render logs payvost-notification-processor

# SSH into service
render exec payvost-notification-processor

# Check running processes
ps aux | grep node
```
