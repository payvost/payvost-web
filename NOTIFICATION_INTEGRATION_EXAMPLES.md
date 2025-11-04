# Notification Integration Examples

## Using the Unified Notification System

The easiest way to send notifications is using the unified notification helper that sends via all channels automatically.

## Quick Integration

### 1. Transaction Success

```typescript
// In your transaction service (e.g., backend/services/payment/routes.ts)
import { notifyTransactionSuccess } from '@/lib/unified-notifications';

async function processTransaction(userId: string, amount: number, currency: string, recipient: string) {
  try {
    // ... your transaction logic ...
    
    // Send notification via all channels (Push, Email, In-App)
    await notifyTransactionSuccess(
      userId,
      amount,
      currency,
      recipient,
      transactionId
    );
    
    return { success: true };
  } catch (error) {
    // Handle error
  }
}
```

### 2. KYC Approval

```typescript
// In your KYC service or Firebase Function
import { notifyKYCApproved } from '@/lib/unified-notifications';

// When KYC is approved
async function approveKYC(userId: string) {
  // Update user KYC status
  await updateDoc(doc(db, 'users', userId), {
    kycStatus: 'verified',
  });
  
  // Send notification
  await notifyKYCApproved(userId);
}
```

### 3. Bill Payment

```typescript
// In your bill payment service
import { notifyPaymentSuccess } from '@/lib/unified-notifications';

async function processBillPayment(params) {
  const { userId, amount, currency, billerName } = params;
  
  // ... payment processing ...
  
  // Notify user
  await notifyPaymentSuccess(
    userId,
    amount,
    currency,
    billerName,
    referenceNumber
  );
}
```

### 4. Security Alert

```typescript
// When suspicious activity is detected
import { notifySecurityAlert } from '@/lib/unified-notifications';

async function detectSuspiciousActivity(userId: string) {
  await notifySecurityAlert(
    userId,
    'suspicious_login',
    'We detected a login from a new device. If this wasn\'t you, please secure your account.'
  );
}
```

### 5. Deposit Notification

```typescript
// When user receives money
import { notifyDeposit } from '@/lib/unified-notifications';

async function processDeposit(userId: string, amount: number, currency: string, sender: string) {
  // ... deposit logic ...
  
  await notifyDeposit(userId, amount, currency, sender);
}
```

## Custom Notifications

For custom notification content:

```typescript
import { sendUnifiedNotification } from '@/lib/unified-notifications';

await sendUnifiedNotification({
  userId: 'user123',
  title: 'Custom Title',
  body: 'Custom message body',
  type: 'general',
  data: {
    customField: 'value',
  },
  clickAction: '/dashboard/custom-page',
  emailTemplate: 'custom',
  emailVariables: {
    userName: 'John Doe',
    customData: 'value',
  },
});
```

## Broadcast to All Users

```typescript
import { broadcastNotification } from '@/lib/unified-notifications';

// Send announcement to all users
await broadcastNotification({
  title: 'New Feature Available!',
  body: 'Check out our new escrow service',
  type: 'feature',
  clickAction: '/dashboard/escrow',
  topic: 'all_users', // or 'verified_users', 'premium_users', etc.
});
```

## Integration Points in Your App

### 1. Transfer Service (`backend/services/transaction/routes.ts`)

```typescript
import { notifyTransactionSuccess, notifyTransactionFailed } from '@/lib/unified-notifications';

router.post('/transfer', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency, recipientId } = req.body;
    const userId = req.user?.uid;
    
    // Process transfer
    const result = await processTransfer({ userId, amount, currency, recipientId });
    
    if (result.success) {
      // Notify sender
      await notifyTransactionSuccess(
        userId!,
        amount,
        currency,
        result.recipientName,
        result.transactionId
      );
      
      // Notify recipient (deposit)
      await notifyDeposit(
        recipientId,
        amount,
        currency,
        result.senderName
      );
    } else {
      await notifyTransactionFailed(
        userId!,
        amount,
        currency,
        result.reason,
        result.transactionId
      );
    }
    
    res.json(result);
  } catch (error) {
    // Handle error
  }
});
```

### 2. Webhook Handler (`src/app/api/webhooks/reloadly/route.ts`)

```typescript
import { notifyPaymentSuccess } from '@/lib/unified-notifications';

export async function POST(req: Request) {
  const payload = await req.json();
  
  if (payload.status === 'successful') {
    const transaction = await getTransaction(payload.transactionId);
    
    await notifyPaymentSuccess(
      transaction.userId,
      transaction.amount,
      transaction.currency,
      payload.operatorName,
      payload.transactionId
    );
  }
  
  return Response.json({ received: true });
}
```

### 3. Firebase Functions (`functions/src/notificationTriggers.ts`)

Replace OneSignal calls:

```typescript
// OLD (OneSignal)
import { sendTransactionNotification } from './services/notificationService';

// NEW (Unified)
import { notifyTransactionSuccess } from '@/lib/unified-notifications';

export const onTransactionStatusChange = onDocumentUpdated(
  { document: 'transactions/{transactionId}' },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (afterData.status === 'completed' && beforeData.status !== 'completed') {
      await notifyTransactionSuccess(
        afterData.userId,
        afterData.amount,
        afterData.currency,
        afterData.recipientName,
        event.params.transactionId
      );
    }
  }
);
```

### 4. KYC Approval (`functions/src/notificationTriggers.ts`)

```typescript
import { notifyKYCApproved, notifyKYCRejected } from '@/lib/unified-notifications';

export const onKycStatusChange = onDocumentUpdated(
  { document: 'users/{userId}' },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (beforeData.kycStatus !== afterData.kycStatus) {
      if (afterData.kycStatus === 'verified') {
        await notifyKYCApproved(event.params.userId);
      } else if (afterData.kycStatus === 'rejected') {
        await notifyKYCRejected(
          event.params.userId,
          afterData.kycRejectionReason || 'Please contact support'
        );
      }
    }
  }
);
```

## User Preferences

### Allow Users to Control Notifications

```typescript
// In settings page
import { 
  getUserNotificationPreferences,
  updateNotificationPreferences 
} from '@/lib/unified-notifications';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  
  useEffect(() => {
    if (user?.uid) {
      getUserNotificationPreferences(user.uid).then(setPreferences);
    }
  }, [user]);
  
  const handleToggle = async (key: string, value: boolean) => {
    await updateNotificationPreferences(user!.uid, {
      [key]: value,
    });
  };
  
  return (
    <div>
      <Switch 
        checked={preferences?.push} 
        onCheckedChange={(v) => handleToggle('push', v)}
      />
      <label>Push Notifications</label>
      
      <Switch 
        checked={preferences?.email} 
        onCheckedChange={(v) => handleToggle('email', v)}
      />
      <label>Email Notifications</label>
      
      <Switch 
        checked={preferences?.transactionAlerts} 
        onCheckedChange={(v) => handleToggle('transactionAlerts', v)}
      />
      <label>Transaction Alerts</label>
    </div>
  );
}
```

## Admin Panel Usage

### Sending via Admin UI

1. Navigate to `/dashboard/admin/notifications`
2. Choose the tab (Push/Email/In-App)
3. Fill in the form
4. Select target audience
5. Click Send

### Programmatic Admin Sending

```typescript
// Send system maintenance notification
import { broadcastNotification } from '@/lib/unified-notifications';

async function notifyMaintenanceWindow() {
  await broadcastNotification({
    title: 'Scheduled Maintenance',
    body: 'Our service will be down for maintenance on Dec 25, 2025 from 2:00 AM - 4:00 AM UTC',
    type: 'maintenance',
    clickAction: '/dashboard',
  });
}

// Send new feature announcement
async function announceNewFeature() {
  await broadcastNotification({
    title: 'New Feature: Escrow Service',
    body: 'We just launched escrow payments. Try it now!',
    type: 'feature',
    clickAction: '/dashboard/escrow',
    topic: 'verified_users', // Only to verified users
  });
}
```

## Testing

### Test Single User Notification

```typescript
// Create a test script: scripts/test-notification.ts
import { notifyTransactionSuccess } from '@/lib/unified-notifications';

async function testNotification() {
  const result = await notifyTransactionSuccess(
    'YOUR_USER_ID',
    100,
    'USD',
    'Test Recipient',
    'TEST123'
  );
  
  console.log('Push:', result.push);
  console.log('Email:', result.email);
  console.log('In-App:', result.inApp);
}

testNotification();
```

### Test Broadcast

```typescript
import { broadcastNotification } from '@/lib/unified-notifications';

await broadcastNotification({
  title: 'Test Broadcast',
  body: 'This is a test notification to all users',
  type: 'announcement',
});
```

## Monitoring

### Check Delivery Status

```typescript
const result = await notifyTransactionSuccess(...);

if (result.push.success) {
  console.log('✅ Push notification delivered');
} else {
  console.error('❌ Push failed:', result.push.error);
}

if (result.email.success) {
  console.log('✅ Email delivered');
} else {
  console.error('❌ Email failed:', result.email.error);
}

if (result.inApp.success) {
  console.log('✅ In-app notification created');
}
```

### View History

- Admin Panel: `/dashboard/admin/notifications` → History tab
- Firestore: Check `notificationHistory` collection
- FCM Console: Firebase Console → Cloud Messaging → Reports

## Best Practices

1. **Always use unified notifications** for consistency
2. **Check user preferences** before sending
3. **Handle failures gracefully** - if one channel fails, others still work
4. **Don't spam users** - respect rate limits
5. **Provide clear action buttons** in clickAction URLs
6. **Test with real devices** before production deployment
7. **Monitor delivery rates** in Firebase Console
8. **Log notification events** for debugging

## Migration from OneSignal

Replace all OneSignal calls in your Firebase Functions:

```typescript
// OLD
import { sendTransactionNotification } from './services/notificationService';
await sendTransactionNotification({ email, name, ... });

// NEW
import { notifyTransactionSuccess } from '@/lib/unified-notifications';
await notifyTransactionSuccess(userId, amount, currency, recipient, txnId);
```

The new system:
- ✅ Sends to more channels (Push + Email + In-App)
- ✅ Respects user preferences
- ✅ Better error handling
- ✅ Unified API
- ✅ Better monitoring
