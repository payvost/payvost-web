# Vercel Environment Variables Configuration

Add these environment variables to your Vercel project settings:

## Required Variables

### Database (Prisma)
```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19iTzE5SmdvTmlsbjJuclpmMmN5VWMiLCJhcGlfa2V5IjoiMDFLOFlIMjNFUVdKN0JKMzBDNjFZMFc0WUsiLCJ0ZW5hbnRfaWQiOiJiOGUwOTgyMTlmNzYxOWZhYzRmZjY3OTZjZjY4YWE3ZTNjMTA5YWQwN2YwNGU2OGE2MDYxMmNlN2Q5YmQxOGJkIiwiaW50ZXJuYWxfc2VjcmV0IjoiYmM5MzBiNjEtODFmZS00ZTczLWE0OGUtNTk2MjhlYWNjNWU2In0.mqwgRmI68hyvDaFWv22sBOUYtbn98ySh_TAAdAskRWw
```

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
FIXER_API_KEY=228793b424835fd85f1ca3d53d11d552
```

#### Reloadly (Airtime/Gift Cards)
```
RELOADLY_CLIENT_ID=q0iLeNtwNqaqsBQuyGoHCA7dI9QfX8vj
RELOADLY_CLIENT_SECRET=gCluhtQd6y-pvyIdQLdjW0zJp7h9G3-NxEEgguYatH3TmJxK3y5gRAzz6vwQim8
RELOADLY_WEBHOOK_SECRET=Q9dgoBCyaM-0DFu9MSobWvtYEzapDy-8PX8ViKzTkWQF2zn5MHRu1vffNTgEam8
RELOADLY_ENV=production
```

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
