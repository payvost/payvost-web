# Migration Guide: Firebase Functions → Render Notification Service

## Overview

This guide shows how to migrate from Firebase Functions to the Render-based notification service to reduce costs.

## Cost Comparison

- **Firebase Functions**: ~$0.40 per million invocations + compute time
- **Render Service**: $7/month (Starter plan) - unlimited requests
- **Savings**: Significant for high-volume applications

## Architecture Change

### Before (Firebase Functions)
```
Firestore Change → Firebase Function Trigger → Email Service
```

### After (Render Service)
```
App Code → Notification Service Webhook → Email Service
```

## Migration Steps

### 1. Deploy Notification Service

The service is already configured in `render.yaml`. After pushing to GitHub, Render will automatically deploy it.

### 2. Update Your Code

Instead of relying on Firebase Function triggers, call the notification service directly from your app code.

#### Example: Login Notification

**Before (Firebase Function):**
```typescript
// Firebase Function automatically triggers on login event
// No code needed in app
```

**After (Render Service):**
```typescript
import { sendLoginNotification } from '@/lib/notification-webhook';

// In your login handler
await sendLoginNotification({
  email: user.email,
  name: user.displayName || user.email,
  deviceInfo: 'Web Browser',
  location: 'Unknown',
  timestamp: new Date(),
  ipAddress: request.ip,
});
```

#### Example: KYC Status Change

**Before (Firebase Function):**
```typescript
// Firebase Function automatically triggers on user document update
// No code needed in app
```

**After (Render Service):**
```typescript
import { sendKycNotification } from '@/lib/notification-webhook';

// When updating KYC status in your admin panel
await sendKycNotification({
  email: user.email,
  name: user.fullName || user.displayName,
  status: 'approved', // or 'rejected'
  reason: rejectionReason, // optional
  nextSteps: 'You can now use all features', // optional
});
```

#### Example: Transaction Notification

**Before (Firebase Function):**
```typescript
// Firebase Function automatically triggers on transaction document write
// No code needed in app
```

**After (Render Service):**
```typescript
import { sendTransactionNotification } from '@/lib/notification-webhook';

// After creating/updating a transaction
await sendTransactionNotification({
  email: user.email,
  name: user.fullName || user.displayName,
  transactionId: transaction.id,
  amount: transaction.amount,
  currency: transaction.currency,
  status: transaction.status, // 'success' | 'failed' | 'initiated'
  recipientName: transaction.recipientName,
  reason: transaction.failureReason, // optional
});
```

#### Example: Invoice Notification

**Before (Firebase Function):**
```typescript
// Firebase Function automatically triggers on invoice document write
// No code needed in app
```

**After (Render Service):**
```typescript
import { sendInvoiceNotification } from '@/lib/notification-webhook';

// When creating an invoice
await sendInvoiceNotification({
  email: invoice.customerEmail,
  name: invoice.customerName,
  invoiceNumber: invoice.invoiceNumber,
  amount: invoice.amount,
  currency: invoice.currency,
  dueDate: invoice.dueDate,
  businessName: business.businessName,
  downloadLink: invoice.downloadUrl,
  type: 'generated', // or 'reminder' | 'paid'
});
```

### 3. Where to Add Notification Calls

#### Login Notifications
- Location: Your authentication handler
- File: `src/app/api/auth/login/route.ts` or similar
- Trigger: After successful login

#### KYC Notifications
- Location: Admin panel where KYC status is updated
- File: `src/app/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/[id]/page.tsx`
- Trigger: When admin approves/rejects KYC

#### Business Notifications
- Location: Admin panel where business status is updated
- Trigger: When admin approves/rejects business account

#### Transaction Notifications
- Location: Transaction creation/update handlers
- Files: Transaction service files
- Trigger: After transaction status changes

#### Invoice Notifications
- Location: Invoice creation/payment handlers
- Files: Invoice service files
- Trigger: When invoice is created, paid, or reminder needed

### 4. Environment Variables

Add to your `.env.local` or Vercel environment:

```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://payvost-notification-service.onrender.com
```

Or use the default (already set in the code).

### 5. Mailgun Template Names

Make sure your Mailgun templates are named exactly:
- `login-notification`
- `kyc-approved`
- `kyc-rejected`
- `business-approved`
- `business-rejected`
- `transaction-success`
- `transaction-failed`
- `payment-link`
- `invoice-generated`
- `invoice-reminder`
- `invoice-paid`

### 6. Testing

Test each notification type:

```bash
# Test login notification
curl -X POST https://payvost-notification-service.onrender.com/notify/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "deviceInfo": "Chrome Browser",
    "location": "New York, US"
  }'
```

### 7. Disable Firebase Functions (Optional)

Once you've migrated all notifications, you can:
1. Comment out Firebase Function triggers in `functions/src/notificationTriggers.ts`
2. Or delete the Firebase Functions entirely
3. This will stop Firebase Functions costs

## Benefits

✅ **Cost Savings**: $7/month vs per-invocation pricing  
✅ **Better Control**: Call notifications exactly when you need them  
✅ **Easier Debugging**: Direct webhook calls are easier to test  
✅ **No Cold Starts**: Render services stay warm  
✅ **Uses Your Mailgun Templates**: All templates you've already created  

## Rollback Plan

If you need to rollback:
1. Keep Firebase Functions code (just don't deploy)
2. Remove notification service calls from app
3. Redeploy Firebase Functions

## Support

If you encounter issues:
1. Check notification service logs in Render Dashboard
2. Check email service logs
3. Verify Mailgun template names match exactly
4. Test endpoints directly with curl

