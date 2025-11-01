# Notification Service

Handles email, push, and SMS notifications for user events and transactions.

## Features

- Push notifications via OneSignal
- Email notifications with templates
- Batch notification support
- User notification preferences
- Transaction alerts
- KYC status updates
- Security alerts

## API Endpoints

### Send Notification
```
POST /api/notification/send
Authentication: Required
```

Send a push notification to a user.

**Request Body:**
```json
{
  "userId": "uuid",
  "title": "Transfer Received",
  "message": "You received $100 USD from John Doe",
  "type": "TRANSFER_RECEIVED",
  "data": {
    "transferId": "uuid",
    "amount": "100",
    "currency": "USD"
  }
}
```

### Send Email
```
POST /api/notification/send-email
Authentication: Required
```

Send an email using a template.

**Request Body:**
```json
{
  "email": "user@example.com",
  "templateId": "welcome-template-id",
  "subject": "Welcome to Payvost",
  "variables": {
    "name": "John Doe",
    "verificationLink": "https://..."
  }
}
```

### Send Batch Notifications
```
POST /api/notification/send-batch
Authentication: Required
```

Send the same notification to multiple users.

**Request Body:**
```json
{
  "userIds": ["uuid1", "uuid2", "uuid3"],
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday",
  "type": "SYSTEM_ALERT"
}
```

### Update Preferences
```
POST /api/notification/preferences
Authentication: Required
```

Update user's notification preferences.

**Request Body:**
```json
{
  "email": true,
  "push": true,
  "sms": false,
  "transactionAlerts": true,
  "marketingEmails": false
}
```

## Notification Templates

### Transaction Notifications
- `TRANSFER_SENT`: Outgoing transfer confirmation
- `TRANSFER_RECEIVED`: Incoming transfer notification
- `PAYMENT_SUCCESSFUL`: Payment completed
- `PAYMENT_FAILED`: Payment failed with reason

### Account Notifications
- `KYC_APPROVED`: Identity verification approved
- `KYC_REJECTED`: Identity verification rejected
- `ACCOUNT_LOCKED`: Account locked due to security
- `SUSPICIOUS_ACTIVITY`: Fraud detection alert

## Integration

Requires environment variables:
- `ONESIGNAL_APP_ID`: OneSignal application ID
- `ONESIGNAL_API_KEY`: OneSignal REST API key

Integrates with:
- **OneSignal**: Push and email delivery
- **Transaction Service**: Transaction alerts
- **User Service**: KYC and account updates
- **Fraud Service**: Security alerts

## Usage Example

```typescript
import { NotificationTemplates } from './routes';

// Send transfer notification
await sendPushNotification({
  userId: 'user-123',
  title: NotificationTemplates.TRANSFER_RECEIVED.title,
  message: NotificationTemplates.TRANSFER_RECEIVED.message('100', 'USD', 'John Doe'),
  type: 'TRANSFER_RECEIVED',
  data: { transferId: 'transfer-456' }
});
```

