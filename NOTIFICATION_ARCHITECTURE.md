# Notification Architecture - Hybrid Solution

## Overview

The Payvost notification system uses a **hybrid approach** combining Firebase Functions and Vercel Edge Functions for optimal performance and cost-efficiency.

## Architecture Decision

### Firebase Functions (Google Cloud)
**Use for:** Firestore-triggered notifications
**Why:** Native integration with Firestore events

**Handles:**
- ✅ KYC status change notifications (Firestore trigger: `users/{userId}`)
- ✅ Business approval notifications (Firestore trigger: `businesses/{businessId}`)
- ✅ Transaction status notifications (Firestore trigger: `transactions/{transactionId}`)
- ✅ Payment link creation notifications (Firestore trigger: `paymentLinks/{linkId}`)
- ✅ Invoice status notifications (Firestore trigger: `invoices/{invoiceId}`)
- ✅ Scheduled invoice reminders (Cloud Scheduler: daily)

**Location:** `/functions/src/notificationTriggers.ts`

**Deployment:**
```bash
firebase deploy --only functions
```

---

### Vercel Edge Functions (Next.js API Routes)
**Use for:** Manual/API-triggered notifications
**Why:** Faster cold starts, better frontend integration, cost-effective

**Handles:**
- ✅ Admin-initiated email notifications
- ✅ Batch email sending
- ✅ Custom notification templates
- ✅ On-demand notification sending from frontend

**Location:** `/src/app/api/notifications/`

**Deployment:**
```bash
vercel --prod
# Or automatic deployment via GitHub push
```

---

## Comparison Table

| Feature | Firebase Functions | Vercel Edge Functions |
|---------|-------------------|----------------------|
| **Cold Start** | ~1-2 seconds | ~50-100ms |
| **Cost (Free Tier)** | 2M invocations/month | 100k requests/month |
| **Firestore Triggers** | ✅ Native support | ❌ Requires webhooks |
| **Scheduled Tasks** | ✅ Cloud Scheduler | ❌ Use Vercel Cron |
| **Frontend Integration** | ⚠️ Requires CORS | ✅ Same domain |
| **TypeScript** | ✅ Full support | ✅ Full support |
| **Environment** | Node.js 20 | Edge Runtime |

---

## API Endpoints

### Vercel Edge Functions

#### 1. Send Single Email
```bash
POST /api/notifications/send-email
Authorization: Bearer <firebase-token>

{
  "to": "user@example.com",
  "subject": "Welcome to Payvost",
  "type": "kyc_approved",
  "data": {
    "name": "John Doe",
    "amount": "1000",
    "currency": "USD"
  }
}
```

#### 2. Send Batch Emails
```bash
POST /api/notifications/send-batch
Authorization: Bearer <firebase-token>

{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Notification 1",
      "html": "<html>...</html>"
    },
    {
      "to": "user2@example.com",
      "subject": "Notification 2",
      "html": "<html>...</html>"
    }
  ]
}
```

**Batch Limits:**
- Maximum 100 emails per request
- Rate limiting applies

---

## Email Templates

### Supported Types

1. **`kyc_approved`** - KYC verification approved
2. **`transaction_success`** - Transaction completed
3. **`invoice_generated`** - New invoice created
4. **`custom`** - Custom HTML content

### Adding New Templates

Edit `/src/app/api/notifications/send-email/route.ts`:

```typescript
case 'your_template_name':
  return baseStyle + `
    <h2>Your Template Title</h2>
    <p>Hello ${data.name},</p>
    <p>Your custom message here</p>
  ` + baseEnd;
```

---

## Usage Examples

### From Frontend (Admin Panel)

```typescript
// Send single email
async function sendNotification() {
  const token = await user.getIdToken();
  
  const response = await fetch('/api/notifications/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'KYC Approved',
      type: 'kyc_approved',
      data: {
        name: 'John Doe',
      },
    }),
  });
  
  const result = await response.json();
  console.log('Email sent:', result.messageId);
}
```

### From Backend Service

```typescript
// Trigger from Firebase Function
import { sendEmail } from './email-service';

async function notifyUser(userId: string) {
  const userData = await getUser(userId);
  
  // Call Vercel Edge Function
  await fetch('https://your-app.vercel.app/api/notifications/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
    body: JSON.stringify({
      to: userData.email,
      subject: 'Transaction Complete',
      type: 'transaction_success',
      data: {
        name: userData.name,
        amount: '100',
        currency: 'USD',
        transactionId: 'TXN123',
      },
    }),
  });
}
```

---

## Environment Variables

### Vercel Environment Variables
Add these to your Vercel project settings:

```bash
# Mailgun SMTP
MAILGUN_SMTP_HOST=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_LOGIN=your_mailgun_login
MAILGUN_SMTP_PASSWORD=your_mailgun_password
MAILGUN_FROM_EMAIL=no-reply@payvost.com

# Firebase Admin (for token verification)
FIREBASE_SERVICE_ACCOUNT_KEY=<your-service-account-json>
```

### Firebase Functions Environment Variables
```bash
firebase functions:config:set \
  mailgun.smtp_host="smtp.mailgun.org" \
  mailgun.smtp_port="587" \
  mailgun.smtp_login="your_login" \
  mailgun.smtp_password="your_password" \
  mailgun.from_email="no-reply@payvost.com"
```

---

## Monitoring & Debugging

### Vercel Logs
```bash
vercel logs <deployment-url>
```

Or view in Vercel Dashboard:
- https://vercel.com/your-org/payvost-web/logs

### Firebase Functions Logs
```bash
firebase functions:log
```

Or view in Firebase Console:
- https://console.firebase.google.com/project/payvost/functions/logs

---

## Cost Analysis

### Current Setup (Hybrid)

**Firebase Functions:**
- Free tier: 2M invocations/month
- Estimated usage: ~50k/month (Firestore triggers)
- **Cost: $0/month** ✅

**Vercel Edge Functions:**
- Free tier: 100k requests/month
- Estimated usage: ~10k/month (manual sends)
- **Cost: $0/month** ✅

**Mailgun:**
- Free tier: 1,000 emails/month
- Paid: $35/month for 50k emails
- **Cost: $35/month** (if needed)

**Total: ~$35/month** (only Mailgun)

---

## Migration Benefits

✅ **Faster Performance** - Edge functions have sub-100ms cold starts
✅ **Cost Savings** - Free tier covers most usage
✅ **Better DX** - Single codebase for frontend and API routes
✅ **Automatic Scaling** - Vercel handles scaling automatically
✅ **Keep Firebase Triggers** - Best tool for Firestore events
✅ **Simpler Deployment** - Git push deploys everything

---

## Recommendation Summary

**KEEP using Firebase Functions for:**
- Firestore document triggers
- Scheduled tasks (invoice reminders)
- Cloud-native integrations

**MIGRATE to Vercel Edge Functions for:**
- Admin-initiated notifications
- Manual email sending
- Batch operations
- Custom API-triggered emails

This hybrid approach gives you **the best of both worlds**! 🎉
