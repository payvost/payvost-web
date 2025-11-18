# Email and SMS Notification System

## Overview

Payvost uses **Mailgun** for email delivery via Nodemailer and **Twilio** for SMS notifications (to be integrated). This replaces the previous OneSignal integration.

## Email Service (Mailgun + Nodemailer)

### Configuration


### Email Templates

The system includes the following pre-built templates:

1. **Transaction Success** - `transaction_success`
2. **Transaction Failed** - `transaction_failed`
3. **Bill Payment Success** - `bill_payment_success`
4. **Bill Payment Failed** - `bill_payment_failed`
5. **Gift Card Delivered** - `gift_card_delivered`
6. **Airtime Top-up Success** - `airtime_topup_success`
7. **KYC Verified** - `kyc_verified`
8. **Account Welcome** - `account_welcome`
9. **Password Reset** - `password_reset`
10. **Login Alert** - `login_alert`
11. **Withdrawal Request** - `withdrawal_request`
12. **Deposit Received** - `deposit_received`

### Usage Examples

#### Frontend (Next.js)

```typescript
import { notificationService } from '@/services';

// Send bill payment success email
await notificationService.sendEmail({
  to: 'user@example.com',
  subject: 'Bill Payment Successful',
  template: 'bill_payment_success',
  variables: {
    name: 'John Doe',
    billerName: 'Electric Company',
    accountNumber: '123456789',
    amount: 50.00,
    currency: 'USD',
    date: new Date().toLocaleString(),
    reference: 'REF123456',
  },
});

// Send transaction notification automatically
await notificationService.notifyExternalTransaction({
  userId: 'user123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  type: 'success',
  transactionType: 'bill_payment',
  details: {
    billerName: 'Electric Company',
    accountNumber: '123456789',
    amount: 50.00,
    currency: 'USD',
    reference: 'REF123456',
  },
});
```

#### Backend API

```typescript
// POST /api/notification/send-email
{
  "email": "user@example.com",
  "subject": "Transaction Successful",
  "template": "transaction_success",
  "variables": {
    "name": "John Doe",
    "amount": "100.00",
    "currency": "USD",
    "recipient": "Jane Smith",
    "date": "2025-11-01 10:30:00",
    "transactionId": "TXN123456"
  }
}
```

### Webhook Integration

Email notifications are automatically sent when webhooks are received from external providers:

```typescript
// In webhook handler (src/app/api/webhooks/reloadly/route.ts)
await notificationService.notifyExternalTransaction({
  userId: transaction.userId,
  userEmail: user.email,
  userName: user.name,
  type: 'success',
  transactionType: 'airtime_topup',
  details: {
    phoneNumber: '+2348012345678',
    operatorName: 'MTN Nigeria',
    amount: 1000,
    currency: 'NGN',
    transactionId: 'RLDY123456',
  },
});
```

## SMS Service (Twilio)

### Configuration

**Environment Variables:**
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Usage (Placeholder - To be implemented)

```typescript
import { notificationService } from '@/services';

// Send SMS
await notificationService.sendSMS({
  to: '+2348012345678',
  message: 'Your airtime top-up of NGN 1,000 was successful. Ref: RLDY123456',
});
```

**Note:** Twilio integration is currently a placeholder. The actual implementation will be added when Twilio credentials are configured.

## Backend Service Endpoints

### Send Email
**Endpoint:** `POST /api/notification/send-email`

**Body:**
```json
{
  "email": "user@example.com",
  "subject": "Your Subject",
  "template": "transaction_success",
  "variables": {
    "name": "User Name",
    "amount": "100.00",
    "currency": "USD"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_unique_id"
}
```

### Send SMS (Placeholder)
**Endpoint:** `POST /api/notification/send-sms`

**Body:**
```json
{
  "phoneNumber": "+2348012345678",
  "message": "Your transaction was successful"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "placeholder-123456",
  "error": "Twilio integration pending"
}
```

### Send Batch Emails
**Endpoint:** `POST /api/notification/send-batch`

**Body:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "subject": "Important Notification",
  "template": "transaction_success",
  "variables": {
    "name": "User",
    "amount": "100.00"
  }
}
```

**Response:**
```json
{
  "total": 2,
  "successful": 2,
  "failed": 0
}
```

## Migration from OneSignal

### Changes Made

1. **Removed OneSignal Dependency**
   - Removed `@onesignal/node-onesignal` package
   - Commented out OneSignal environment variables in `.env.example`

2. **Added Mailgun/Nodemailer**
   - Added `nodemailer` package (to be installed)
   - Configured Mailgun SMTP transport
   - Created email templates

3. **Updated Services**
   - `src/services/notificationService.ts` - Complete rewrite
   - `backend/services/notification/routes.ts` - Updated to use Mailgun

4. **Webhook Integration**
   - Added email notifications to Reloadly webhook handlers
   - Automatic notifications on transaction success/failure

### To-Do Items

1. **Install Dependencies:**
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

2. **Remove OneSignal:**
   ```bash
   npm uninstall @onesignal/node-onesignal
   ```

3. **Configure Environment:**
   - Copy Mailgun credentials to `.env.local`
   - Test email sending in development

4. **Implement Twilio:**
   - Add Twilio SDK: `npm install twilio`
   - Implement SMS sending in `notificationService.sendSMS()`
   - Test SMS delivery

5. **Update User Records:**
   - Fetch user email/name from database in webhook handlers
   - Store notification preferences

## Testing

### Test Email Sending (Development)

```typescript
// Create a test script: scripts/test-email.ts
import { notificationService } from '@/services';

async function testEmail() {
  const result = await notificationService.sendEmail({
    to: 'your-email@example.com',
    subject: 'Test Email',
    template: 'transaction_success',
    variables: {
      name: 'Test User',
      amount: '100.00',
      currency: 'USD',
      recipient: 'Test Recipient',
      date: new Date().toLocaleString(),
      transactionId: 'TEST123',
    },
  });

  console.log('Email send result:', result);
}

testEmail();
```

### Test API Endpoints (Postman/cURL)

```bash
curl -X POST http://localhost:3001/api/notification/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Email",
    "template": "transaction_success",
    "variables": {
      "name": "Test User",
      "amount": "100.00",
      "currency": "USD",
      "recipient": "Test Recipient",
      "date": "2025-11-01",
      "transactionId": "TEST123"
    }
  }'
```

## Production Deployment

### Checklist

- [ ] Install nodemailer package
- [ ] Configure Mailgun credentials in production environment
- [ ] Test email delivery to real addresses
- [ ] Set up Twilio account and configure credentials
- [ ] Implement Twilio SMS sending
- [ ] Test SMS delivery
- [ ] Update webhook URLs in Reloadly/Rapyd dashboards
- [ ] Monitor email delivery rates
- [ ] Set up email logging/tracking
- [ ] Implement retry logic for failed emails
- [ ] Add rate limiting to prevent abuse

## Troubleshooting

### Emails Not Sending

1. Check Mailgun credentials in `.env`
2. Verify SMTP host and port
3. Check Mailgun dashboard for delivery logs
4. Verify domain verification in Mailgun
5. Check firewall rules for SMTP port 587

### Common Errors

**Error: "Email service not configured"**
- Solution: Add Mailgun credentials to environment variables

**Error: "SMTP connection timeout"**
- Solution: Check network connectivity and firewall rules

**Error: "Invalid credentials"**
- Solution: Verify MAILGUN_SMTP_LOGIN and MAILGUN_SMTP_PASSWORD

## Support

For issues or questions:
- Email: support@payvost.com
- Documentation: https://docs.payvost.com/notifications
- Mailgun Support: https://help.mailgun.com
- Twilio Support: https://support.twilio.com
