# Notification System - Quick Reference

## Current Implementation Summary

### ✅ What's Already Working

1. **Email Notifications (Mailgun)**
   - Service: `/src/services/notificationService.ts`
   - Backend: `/backend/services/notification/routes.ts`
   - Templates: Transaction, KYC, Bill Payment, etc.

2. **OneSignal (Firebase Functions)**
   - Location: `/functions/src/services/notificationService.ts`
   - Auto-triggers: Login, KYC status, Transactions, Invoices
   - Used for email templates only

3. **In-App Notifications**
   - UI: `/src/components/notification-dropdown.tsx`
   - Page: `/src/app/dashboard/notifications/page.tsx`
   - Storage: Firestore `notifications` collection

### 🆕 What Was Just Added

1. **Firebase Cloud Messaging (FCM)**
   - Service Worker: `/public/firebase-messaging-sw.js`
   - Client Service: `/src/lib/fcm.ts`
   - React Hook: `/src/hooks/use-notifications.ts`
   - Backend Service: `/backend/services/notification/fcm.ts`

2. **Admin Notification Center**
   - Location: `/src/app/dashboard/admin/notifications/page.tsx`
   - Features: Push, Email, In-App, History

3. **Backend API Endpoints**
   - `POST /api/notification/send-push` - Single device
   - `POST /api/notification/send-push-batch` - Multiple devices
   - `POST /api/notification/send-topic` - Topic broadcast
   - `POST /api/notification/subscribe-topic` - Subscribe to topic
   - `POST /api/notification/unsubscribe-topic` - Unsubscribe from topic

## 🔧 Setup Required

### 1. Get VAPID Key (5 minutes)

1. Go to: https://console.firebase.google.com/
2. Select project: **qwibik-remit**
3. Project Settings → Cloud Messaging → Web Push certificates
4. Click "Generate key pair"
5. Copy the generated key

### 2. Update Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_FCM_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

### 3. Update FCM Service

Edit `/src/lib/fcm.ts` line 10:
```typescript
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // Replace with actual key
```

## 🚀 Quick Start Guide

### Enable Notifications for a User

```typescript
import { setupUserNotifications } from '@/lib/fcm';

// After user logs in
await setupUserNotifications(userId);
```

### Send Push Notification

```typescript
import { sendPushNotification } from '@/backend/services/notification/fcm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Get user's FCM token
const userDoc = await getDoc(doc(db, 'users', userId));
const fcmToken = userDoc.data()?.fcmToken;

if (fcmToken) {
  await sendPushNotification({
    token: fcmToken,
    title: 'Payment Successful',
    body: 'Your payment of $100 was successful',
    data: { type: 'payment', transactionId: 'TXN123' },
    clickAction: '/dashboard/transactions',
  });
}
```

### Send to All Users

```typescript
import { sendTopicNotification } from '@/backend/services/notification/fcm';

await sendTopicNotification({
  topic: 'all_users',
  title: 'New Feature!',
  body: 'Check out our new escrow service',
});
```

### Use Admin Panel

1. Navigate to: `/dashboard/admin/notifications`
2. Select notification type (Push/Email/In-App)
3. Fill in the form
4. Choose target audience
5. Click Send

## 📊 How It All Works Together

### Notification Flow

```
User Action (e.g., Payment)
    ↓
Backend Service
    ↓
Three parallel notifications:
    ↓
1. FCM Push → User's device → Toast/Banner
2. Email → Mailgun → User's inbox
3. In-App → Firestore → Dashboard notification dropdown
```

### Data Flow

1. **Registration**:
   - User grants permission
   - FCM generates token
   - Token saved to Firestore: `users/{userId}/fcmToken`

2. **Sending**:
   - Backend retrieves token from Firestore
   - Calls `firebase-admin.messaging().send()`
   - FCM delivers to device

3. **Receiving**:
   - Background: Service worker shows notification
   - Foreground: React hook shows toast
   - Click: Routes to specified URL

## 🎯 Common Use Cases

### 1. Transaction Notification

```typescript
// After successful transaction
const user = await getDoc(doc(db, 'users', userId));
const fcmToken = user.data()?.fcmToken;

// Send push
if (fcmToken) {
  await sendPushNotification({
    token: fcmToken,
    title: 'Transaction Successful',
    body: `You sent ${amount} ${currency}`,
    data: { type: 'transaction', id: txnId },
  });
}

// Send email
await notificationService.sendEmail({
  to: user.data()?.email,
  subject: 'Transaction Successful',
  template: 'transaction_success',
  variables: { amount, currency, date, transactionId: txnId },
});

// Create in-app notification
await addDoc(collection(db, 'notifications'), {
  userId,
  title: 'Transaction Successful',
  message: `You sent ${amount} ${currency}`,
  type: 'success',
  read: false,
  createdAt: serverTimestamp(),
});
```

### 2. KYC Status Update

```typescript
// When KYC is approved
const user = await getDoc(doc(db, 'users', userId));
const fcmToken = user.data()?.fcmToken;

if (fcmToken) {
  await sendPushNotification({
    token: fcmToken,
    title: 'KYC Approved ✓',
    body: 'Your account has been verified',
    data: { type: 'kyc', status: 'approved' },
  });
}
```

### 3. Broadcast Announcement

```typescript
// Send to all users via admin panel or programmatically
await sendTopicNotification({
  topic: 'all_users',
  title: 'System Maintenance',
  body: 'Scheduled maintenance on Dec 25',
  data: { type: 'announcement' },
});
```

## 📝 Testing Checklist

- [ ] Generate VAPID key from Firebase Console
- [ ] Add VAPID key to environment variables
- [ ] Update `/src/lib/fcm.ts` with VAPID key
- [ ] Request notification permission in browser
- [ ] Verify service worker registered (`chrome://serviceworker-internals`)
- [ ] Check FCM token saved to Firestore
- [ ] Send test notification via admin panel
- [ ] Verify notification received on device
- [ ] Test notification click action
- [ ] Check notification history in admin panel

## 🔍 Debugging

### Check Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(console.log);
```

### Check FCM Token
```javascript
// In browser console
import { requestNotificationPermission } from '@/lib/fcm';
const token = await requestNotificationPermission();
console.log(token);
```

### Check Notification Permission
```javascript
// In browser console
console.log(Notification.permission); // Should be "granted"
```

## 📚 Documentation

- Full Guide: `/FCM_IMPLEMENTATION_GUIDE.md`
- Notification System: `/docs/NOTIFICATION_SYSTEM.md`
- Backend Service: `/backend/services/notification/README.md`

## 🆘 Troubleshooting

**Notifications not showing?**
1. Check browser permission: Settings → Notifications
2. Verify service worker registered
3. Check FCM token exists in Firestore
4. Look at browser console for errors

**Service worker not registering?**
1. Ensure file exists: `/public/firebase-messaging-sw.js`
2. Check file is accessible: `http://localhost:3000/firebase-messaging-sw.js`
3. Clear browser cache and reload

**Token not saving?**
1. Check user is logged in
2. Verify Firestore rules allow write to `users/{userId}`
3. Check browser console for errors

## 🔐 Your FCM Credentials

```
Server Key: AAAAzXnyRGQ:APA91bH7JWx07PnIHKC-gWBZ5z0teUIFjFVrUqgdN5bIIi1yUVcNrjV2a1vBw-_YkZk-4U3iU0ZYRJBVsoRYKG4719kTrBSx_5LsODxHwFJo82OK3fs9-bIrrmxd5g2kgPSn1CvE28D1

Sender ID: 882514216036 ✓ (Already configured)

VAPID Key: [Generate from Firebase Console]
```

The server key and sender ID are already configured. You just need to generate and add the VAPID key.

## Next Steps

1. ✅ Generate VAPID key (5 min)
2. ✅ Add to environment and code (2 min)
3. ✅ Test notification flow (10 min)
4. ✅ Deploy to production
5. ✅ Enable notifications for users
6. ✅ Monitor in Firebase Console
