# Notification Service

A webhook-based notification service that handles email notifications by calling the email service with Mailgun templates.

## Overview

This service receives webhook calls from your application and sends email notifications using Mailgun templates via the email service. It replaces Firebase Functions for cost efficiency.

## Features

- ✅ Webhook-based architecture (no Firebase Functions needed)
- ✅ Uses Mailgun templates you've configured
- ✅ Calls existing email service on Render
- ✅ Supports all notification types: login, KYC, business, transactions, invoices, payment links

## Endpoints

### Health Check
```
GET /health
```

### Send Login Notification
```
POST /notify/login
Body: {
  email: string;
  name: string;
  deviceInfo?: string;
  location?: string;
  timestamp?: Date | string;
  ipAddress?: string;
}
```

### Send KYC Notification
```
POST /notify/kyc
Body: {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  reason?: string;
  nextSteps?: string;
}
```

### Send Business Notification
```
POST /notify/business
Body: {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  businessName: string;
  reason?: string;
  nextSteps?: string;
}
```

### Send Transaction Notification
```
POST /notify/transaction
Body: {
  email: string;
  name: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'initiated';
  recipientName?: string;
  reason?: string;
}
```

### Send Payment Link Notification
```
POST /notify/payment-link
Body: {
  email: string;
  name: string;
  amount: number;
  currency: string;
  paymentLink: string;
  expiryDate?: Date | string;
  description?: string;
}
```

### Send Invoice Notification
```
POST /notify/invoice
Body: {
  email: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date | string;
  businessName: string;
  downloadLink?: string;
  type: 'generated' | 'reminder' | 'paid';
}
```

## Mailgun Template Names

Make sure your Mailgun templates are named exactly as follows:
- `login-notification` - Login alerts
- `kyc-approved` - KYC verification approved
- `kyc-rejected` - KYC verification rejected
- `business-approved` - Business account approved
- `business-rejected` - Business account rejected
- `transaction-success` - Transaction successful
- `transaction-failed` - Transaction failed
- `payment-link` - Payment link generated
- `invoice-generated` - New invoice
- `invoice-reminder` - Invoice payment reminder
- `invoice-paid` - Invoice paid

## Environment Variables

```env
NOTIFICATION_SERVICE_PORT=3005
EMAIL_SERVICE_URL=https://payvost-email-service.onrender.com
INTERNAL_API_KEY=your-secure-api-key  # Optional
NODE_ENV=production
```

## Deployment on Render

The service is configured in `render.yaml` and will be automatically deployed.

## Usage from Your App

Instead of calling Firebase Functions, call this service:

```typescript
// Example: Send login notification
const response = await fetch('https://payvost-notification-service.onrender.com/notify/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: user.email,
    name: user.name,
    deviceInfo: 'Web Browser',
    location: 'Unknown',
    timestamp: new Date(),
  }),
});
```

## Cost Comparison

- **Firebase Functions**: ~$0.40 per million invocations + compute time
- **Render Service**: $7/month (Starter plan) - unlimited requests
- **Savings**: Significant for high-volume applications

## Integration

Update your app code to call this service instead of Firebase Functions:

1. Replace Firebase Function triggers with webhook calls
2. Call notification service endpoints when events occur
3. No need to deploy Firebase Functions anymore

