# Push Notifications Setup

This directory contains the push notification service for the mobile app.

## Features

- ✅ Request notification permissions
- ✅ Get Expo push tokens
- ✅ Register/unregister tokens with backend
- ✅ Handle foreground and background notifications
- ✅ Deep linking from notifications
- ✅ Badge count management
- ✅ Local notification scheduling

## Setup

### 1. EAS Project ID

Make sure your `app.json` has the EAS project ID:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 2. Backend API Endpoints

The app expects these endpoints:
- `POST /api/v1/user/push-token` - Register push token
- `DELETE /api/v1/user/push-token` - Unregister push token
- `GET /api/v1/user/notification-preferences` - Get preferences
- `PUT /api/v1/user/notification-preferences` - Update preferences

### 3. Notification Payload Format

Notifications should include data for deep linking:
```json
{
  "title": "Payment Received",
  "body": "You received $100",
  "data": {
    "type": "payment",
    "screen": "/payments",
    "transactionId": "123"
  }
}
```

## Usage

### Initialize Notifications
Notifications are automatically initialized when user logs in via `useAuth` hook.

### Manual Initialization
```typescript
import { initializePushNotifications } from '../lib/notifications';

await initializePushNotifications();
```

### Handle Notification Taps
Deep linking is handled automatically in `app/_layout.tsx`. You can customize the behavior by modifying the notification tap handler.

### Schedule Local Notifications
```typescript
import { scheduleLocalNotification } from '../lib/notifications';

await scheduleLocalNotification(
  'Reminder',
  'Don\'t forget to check your balance',
  { type: 'reminder' },
  { seconds: 3600 } // Show in 1 hour
);
```

## Testing

### Using Expo Push Notification Tool
1. Get your Expo push token from the app logs
2. Visit: https://expo.dev/notifications
3. Send a test notification

### Using Backend
Send notifications through your backend FCM service, which will forward them to Expo's push notification service.

## Platform-Specific Notes

### iOS
- Requires physical device for testing
- APNs certificates configured via EAS
- Badge count supported

### Android
- Notification channel created automatically
- High priority notifications
- Vibration and sound enabled

## Troubleshooting

### "Must use physical device"
Push notifications don't work in simulators. Use a physical device.

### "EAS project ID not found"
Make sure `app.json` has the EAS project ID in `extra.eas.projectId`.

### Token not registering
- Check backend API endpoint is correct
- Verify authentication token is valid
- Check network connectivity

