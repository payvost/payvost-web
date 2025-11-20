# Vercel Environment Variables Configuration

Add these environment variables to your Vercel project settings:

## Required Variables

### Database (Prisma)
```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=<your-prisma-accelerate-api-key>
```
**Note:** Get your API key from the Prisma Accelerate dashboard. Never commit actual keys to version control.

### Firebase Admin SDK
**Option 1: JSON String (Recommended)**
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"payvost",...}
```

**Option 2: Base64 Encoded**
```
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=<base64-encoded-json>
```

To get base64 encoded version:
```bash
cat backend/payvost-ae91662ec061.json | base64 -w 0
```

### External APIs

#### Fixer.io (Currency Exchange Rates)
```
FIXER_API_KEY=<your-fixer-api-key>
```
**Note:** Get your API key from [Fixer.io dashboard](https://fixer.io/dashboard). Never commit actual keys to version control.

#### Reloadly (Airtime/Gift Cards)
```
RELOADLY_CLIENT_ID=<your-reloadly-client-id>
RELOADLY_CLIENT_SECRET=<your-reloadly-client-secret>
RELOADLY_WEBHOOK_SECRET=<your-reloadly-webhook-secret>
RELOADLY_ENV=production
```
**Note:** Get your credentials from [Reloadly dashboard](https://www.reloadly.com/developers/api-credentials). Never commit actual secrets to version control.

## Optional Variables

### Mailgun (Email Notifications)
```
MAILGUN_SMTP_HOST=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_LOGIN=<your-mailgun-smtp-login>
MAILGUN_SMTP_PASSWORD=<your-mailgun-smtp-password>
MAILGUN_FROM_EMAIL=no-reply@payvost.com
```

### Stripe (Payments)
```
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=<your-stripe-public-key>
```

### Twilio (SMS - Optional)
```
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_FROM_NUMBER=<your-twilio-phone>
```

### Firebase Realtime Database (Optional)
```
FIREBASE_DATABASE_URL=https://payvost-default-rtdb.firebaseio.com
```

### Error Tracking (Optional)
Error tracking is built-in and uses your database. To enable in development:
```
ENABLE_ERROR_TRACKING=true
```

## How to Add Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its value
4. Select which environments to apply to:
   - Production
   - Preview
   - Development

## Verification

After adding variables, redeploy your application:
```bash
git push origin main
```

Or trigger a manual deployment from the Vercel dashboard.

## Security Notes

- Never commit `.env` files to git
- Keep sensitive credentials secure
- Rotate API keys regularly
- Use Vercel's secret masking for sensitive values
- Consider using different keys for preview/production environments
