# Firebase Cloud Messaging (FCM) Implementation Guide

## Overview

This guide explains how Firebase Cloud Messaging has been integrated into Payvost for push notifications, complementing the existing email (Mailgun) and in-app notification systems.

## Architecture

### Notification Channels

1. **Push Notifications (FCM)** - Real-time device notifications
2. **Email (Mailgun)** - Email notifications via SMTP
3. **In-App Messages** - Firestore-based dashboard notifications
4. **SMS (Twilio)** - SMS notifications (placeholder, to be implemented)

### Components Created

#### Frontend
- `/src/lib/fcm.ts` - FCM client service with token management
- `/src/hooks/use-notifications.ts` - React hook for notification management
- `/public/firebase-messaging-sw.js` - Service worker for background notifications
- `/src/app/dashboard/admin/notifications/page.tsx` - Admin notification center

#### Backend
- `/backend/services/notification/fcm.ts` - FCM server-side sending logic
- `/backend/services/notification/routes.ts` - Updated with FCM endpoints

## Configuration

### 1. Firebase Console Setup

#### Step 1: Get VAPID Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `qwibik-remit`
3. Navigate to **Project Settings** → **Cloud Messaging**
4. Scroll to **Web configuration**
5. Under **Web Push certificates**, click **Generate key pair**
6. Copy the generated VAPID key

#### Step 2: Verify Server Key
Your FCM server key is already available:
```
Server Key: <your-fcm-server-key>
**SECURITY NOTE:** Get your FCM Server Key from Firebase Console > Project Settings > Cloud Messaging. Never commit actual keys.
Sender ID: 882514216036
```

This is already configured in your Firebase config:
```typescript
messagingSenderId: "882514216036"
```

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Already configured
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=882514216036

# Add VAPID key after generating it
NEXT_PUBLIC_FCM_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

### 3. Update FCM Service

Update `/src/lib/fcm.ts` with your VAPID key:

```typescript
const VAPID_KEY = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';
```

## Usage

### Frontend Implementation

#### 1. Enable Notifications for Users

In your user dashboard or settings page:

```typescript
import { useNotifications } from '@/hooks/use-notifications';

export default function NotificationSettings() {
  const { isEnabled, isLoading, enableNotifications, disableNotifications } = useNotifications();

  return (
    <div>
      <Button 
        onClick={enableNotifications}
        disabled={isLoading || isEnabled}
      >
        Enable Push Notifications
      </Button>
    </div>
  );
}
```

#### 2. Setup on User Login

In your login flow:

```typescript
import { setupUserNotifications } from '@/lib/fcm';
import { useAuth } from '@/hooks/use-auth';

useEffect(() => {
  if (user?.uid) {
    // Setup notifications after login
    setupUserNotifications(user.uid);
  }
}, [user]);
```

### Backend Implementation

#### 1. Send Push Notification to Single User

```typescript
import { sendPushNotification } from './backend/services/notification/fcm';

// Send to specific device
await sendPushNotification({
  token: userFCMToken, // Retrieved from Firestore
  title: 'Payment Successful',
  body: 'Your payment of $100 was successful',
  data: {
    type: 'payment',
    transactionId: 'TXN123',
  },
  clickAction: '/dashboard/transactions',
});
```

#### 2. Send to Multiple Users

```typescript
import { sendMulticastNotification } from './backend/services/notification/fcm';

await sendMulticastNotification({
  tokens: [token1, token2, token3], // Array of FCM tokens
  title: 'New Feature Available',
  body: 'Check out our new escrow service',
  data: {
    type: 'announcement',
  },
});
```

#### 3. Send to Topic (All Users)

```typescript
import { sendTopicNotification } from './backend/services/notification/fcm';

await sendTopicNotification({
  topic: 'all_users',
  title: 'System Maintenance',
  body: 'Scheduled maintenance on Dec 25, 2025',
  data: {
    type: 'maintenance',
  },
});
```

### API Endpoints

#### Send Push Notification
```bash
POST /api/notification/send-push
Content-Type: application/json
Authorization: Bearer <firebase-token>

{
  "token": "fcm_device_token",
  "title": "Payment Successful",
  "body": "Your payment was processed",
  "data": {
    "type": "payment",
    "transactionId": "TXN123"
  },
  "clickAction": "/dashboard/transactions"
}
```

#### Send Multicast
```bash
POST /api/notification/send-push-batch
Content-Type: application/json

{
  "tokens": ["token1", "token2"],
  "title": "Announcement",
  "body": "New feature available"
}
```

#### Send to Topic
```bash
POST /api/notification/send-topic
Content-Type: application/json

{
  "topic": "verified_users",
  "title": "Important Update",
  "body": "Please review your account"
}
```

#### Subscribe to Topic
```bash
POST /api/notification/subscribe-topic
Content-Type: application/json

{
  "tokens": ["token1", "token2"],
  "topic": "verified_users"
}
```

## Admin Notification Center

Access at: `/dashboard/admin/notifications`

Features:
- **Push Notifications** - Send to all users, topic, or specific user
- **Email** - Send bulk emails with templates
- **In-App Messages** - Create dashboard notifications
- **History** - View all sent notifications

### Admin Usage

1. Navigate to `/dashboard/admin/notifications`
2. Select the notification type (Push, Email, In-App)
3. Fill in the form
4. Choose target audience
5. Click Send

## Integration with Existing Systems

### Transaction Notifications

In your transaction service, add FCM notifications:

```typescript
import { sendPushNotification } from '@/backend/services/notification/fcm';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function notifyTransactionSuccess(userId: string, amount: number, currency: string) {
  // Get user's FCM token from Firestore
  const userDoc = await getDoc(doc(db, 'users', userId));
  const fcmToken = userDoc.data()?.fcmToken;

  if (fcmToken) {
    await sendPushNotification({
      token: fcmToken,
      title: 'Transaction Successful',
      body: `You sent ${amount} ${currency}`,
      data: {
        type: 'transaction',
        status: 'success',
      },
      clickAction: '/dashboard/transactions',
    });
  }

  // Also send email
  await sendEmail({...});
  
  // Create in-app notification
  await addDoc(collection(db, 'notifications'), {...});
}
```

### KYC Status Updates

```typescript
async function notifyKYCApproved(userId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  const fcmToken = userData?.fcmToken;

  if (fcmToken) {
    await sendPushNotification({
      token: fcmToken,
      title: 'KYC Approved ✓',
      body: 'Your identity verification has been approved',
      data: {
        type: 'kyc',
        status: 'approved',
      },
      clickAction: '/dashboard/settings',
    });
  }
}
```

## Testing

### 1. Test Service Worker Registration

Open browser console and run:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### 2. Test Token Generation

```typescript
import { requestNotificationPermission } from '@/lib/fcm';

const token = await requestNotificationPermission();
console.log('FCM Token:', token);
```

### 3. Send Test Notification

Use the admin panel or API:
```bash
curl -X POST http://localhost:3001/api/notification/send-topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "all_users",
    "title": "Test Notification",
    "body": "This is a test"
  }'
```

## Troubleshooting

### Notifications Not Received

1. **Check Permission**
   - Ensure browser notification permission is granted
   - Check: Settings → Site Settings → Notifications

2. **Verify Service Worker**
   - Check service worker is registered: `navigator.serviceWorker.controller`
   - Look for errors in Console → Application → Service Workers

3. **Validate FCM Token**
   - Check if token is saved in Firestore: `users/{userId}/fcmToken`
   - Tokens expire - re-request if needed

4. **Check Firebase Console**
   - Go to Cloud Messaging section
   - Look for delivery reports and errors

### Common Errors

**Error: "Messaging: Missing required VAPID key"**
- Solution: Add VAPID key to `/src/lib/fcm.ts`

**Error: "Messaging: Failed to register a ServiceWorker"**
- Solution: Ensure `/public/firebase-messaging-sw.js` exists and is accessible

**Error: "Notifications blocked by browser"**
- Solution: User must grant notification permission

## Best Practices

1. **Request Permission at Right Time**
   - Don't ask immediately on page load
   - Ask after user performs meaningful action
   - Explain the value of notifications

2. **Handle Token Refresh**
   - Tokens can expire or change
   - Update Firestore when tokens change
   - Remove invalid tokens

3. **Graceful Degradation**
   - Not all browsers support FCM
   - Fall back to email/in-app notifications

4. **Don't Spam Users**
   - Respect notification preferences
   - Allow users to customize notification types
   - Provide unsubscribe option

5. **Data Privacy**
   - Don't send sensitive data in notifications
   - Use notification data for routing only
   - Fetch sensitive data after user clicks

## Migration from OneSignal

Your project currently uses OneSignal in Firebase Functions. Here's how to migrate:

### 1. Update Functions

Replace OneSignal calls with FCM in `/functions/src/services/notificationService.ts`:

```typescript
// Old (OneSignal)
await sendTransactionNotification({...});

// New (FCM)
import { sendPushNotification } from '@/backend/services/notification/fcm';
await sendPushNotification({...});
```

### 2. Migrate User Tokens

OneSignal stores email tokens. FCM needs device tokens:
- Users must re-register for push notifications
- Prompt existing users to enable notifications
- Store FCM tokens in Firestore `users/{userId}/fcmToken`

### 3. Topic Migration

OneSignal segments → FCM topics:
- Map OneSignal segments to FCM topics
- Subscribe users to appropriate topics
- Use `/api/notification/subscribe-topic`

## Notification Topics

Suggested topics for user segmentation:

- `all_users` - All registered users
- `verified_users` - KYC verified users
- `premium_users` - Premium account holders
- `business_users` - Business account users
- `new_users` - Users registered in last 30 days

Subscribe users to topics:
```typescript
import { subscribeToTopic } from '@/backend/services/notification/fcm';

await subscribeToTopic([userFCMToken], 'verified_users');
```

## Monitoring & Analytics

### Track Notification Performance

Add analytics to notification handlers:

```typescript
import { logEvent, analytics } from '@/lib/firebase';

// On notification sent
logEvent(analytics, 'notification_sent', {
  type: 'push',
  target: 'all_users',
});

// On notification clicked
logEvent(analytics, 'notification_click', {
  type: 'transaction',
});
```

### Firestore Logging

Notifications are logged to `notificationHistory` collection:
- View in admin panel
- Export for analysis
- Track success/failure rates

## Security Considerations

1. **Validate Tokens**
   - Verify FCM tokens before sending
   - Remove expired tokens from database

2. **Rate Limiting**
   - Implement rate limits on notification endpoints
   - Prevent abuse of admin panel

3. **Authentication**
   - All endpoints require Firebase authentication
   - Admin endpoints should check user role

4. **Content Validation**
   - Sanitize notification content
   - Prevent XSS in notification messages

## Support

For issues:
- Email: dev@payvost.com
- Firebase Docs: https://firebase.google.com/docs/cloud-messaging
- Service Worker Docs: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

## Next Steps

1. ✅ Generate VAPID key from Firebase Console
2. ✅ Add VAPID key to environment variables
3. ✅ Update `/src/lib/fcm.ts` with VAPID key
4. ✅ Deploy service worker to production
5. ✅ Test notification flow end-to-end
6. ✅ Enable notifications for existing users
7. ✅ Monitor delivery rates in Firebase Console
8. ✅ Migrate from OneSignal (if needed)
