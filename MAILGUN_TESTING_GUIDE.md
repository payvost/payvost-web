# Mailgun Testing Guide

## Overview
This guide explains how to test if Mailgun is properly configured and working in your Payvost system.

## Quick Test

### Using curl (Command Line)

```bash
# Make sure you have a valid Firebase token
# Replace YOUR_FIREBASE_TOKEN and YOUR_EMAIL

curl -X POST \
  'http://localhost:3001/api/test/mailgun?email=YOUR_EMAIL@example.com' \
  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN' \
  -H 'Content-Type: application/json'
```

### Expected Success Response (200 OK)
```json
{
  "success": true,
  "message": "Test email sent successfully to your.email@example.com",
  "messageId": "20250127.123456.a1b2c3d4@sandboxa1b2c3d4.mailgun.org",
  "details": {
    "recipient": "your.email@example.com",
    "template": "test-email",
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

### Using JavaScript/Node.js

```typescript
// Test Mailgun from frontend or Node.js
async function testMailgun(email: string) {
  const token = await getFirebaseToken(); // Your auth method
  
  const response = await fetch(
    `/api/test/mailgun?email=${encodeURIComponent(email)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  console.log('Mailgun Test Result:', data);
  return data;
}

// Usage
testMailgun('your.email@example.com').then(result => {
  if (result.success) {
    console.log('✅ Mailgun is working!');
  } else {
    console.log('❌ Mailgun error:', result.error);
  }
});
```

## API Endpoints

### Frontend Proxy (Recommended)
**Endpoint**: `POST /api/test/mailgun?email={email}`  
**Location**: `src/app/api/test/mailgun/route.ts`  
**Requires**: Firebase authentication token  
**Use**: From your web application

### Backend Gateway
**Endpoint**: `POST /api/test/mailgun?email={email}`  
**Location**: `backend/gateway/index.ts`  
**Requires**: Firebase token in Authorization header  
**Use**: Direct backend testing

## Error Scenarios

### 1. Missing Email Parameter
```json
{
  "error": "Email parameter required",
  "usage": "POST /api/test/mailgun?email=test@example.com",
  "headers": { "Authorization": "Bearer <firebase_token>" }
}
```
**Solution**: Add `?email=your.email@example.com` to the URL

### 2. Invalid Email Format
```json
{
  "error": "Invalid email format"
}
```
**Solution**: Use a valid email address (e.g., `user@domain.com`)

### 3. Mailgun Not Configured (Most Common)
```json
{
  "error": "Mailgun is not configured",
  "required_env_vars": ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"],
  "environment_check": {
    "mailgun_api_key": "NOT SET",
    "mailgun_domain": "NOT SET",
    "mailgun_from_email": "NOT SET"
  }
}
```
**Solution**: Set environment variables:
- `MAILGUN_API_KEY` - Your Mailgun API key
- `MAILGUN_DOMAIN` - Your Mailgun domain (e.g., `mg.payvost.com`)
- `MAILGUN_FROM_EMAIL` - Sender email (e.g., `noreply@payvost.com`)

### 4. Invalid Mailgun Credentials
```json
{
  "success": false,
  "error": "Forbidden - Check your API key and domain"
}
```
**Solution**: Verify credentials in Mailgun dashboard

### 5. Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```
**Solution**: Pass valid Firebase token in Authorization header

## Testing Checklist

- [ ] Environment variables set on server (Render/local)
- [ ] Firebase authentication working
- [ ] Test email sends successfully
- [ ] Email appears in your inbox (not spam)
- [ ] Mailgun dashboard shows the message was sent
- [ ] Invoice reminder button works on business invoices page
- [ ] Notification processor cron job logs show emails sent

## Debugging Steps

### Step 1: Verify Environment Variables
On Render:
1. Go to your `payvost-backend-gateway` service
2. Click **Environment** tab
3. Verify these variables exist:
   - `MAILGUN_API_KEY` - Should start with `key-`
   - `MAILGUN_DOMAIN` - Should be your domain
   - `MAILGUN_FROM_EMAIL` - Should be a valid email

### Step 2: Check Mailgun Dashboard
1. Go to [mailgun.com](https://mailgun.com)
2. Login to your account
3. Check **Logs** → **Messages** to see if test email arrived
4. Check **Sending Domains** to verify domain is verified

### Step 3: Monitor Service Logs
```bash
# Render logs
# Go to Render dashboard → payvost-backend-gateway → Logs

# Look for:
# - "[test/mailgun] Test email endpoint called"
# - "Successfully sent email via Mailgun"
# - Error messages if any
```

### Step 4: Test Different Scenarios
```bash
# Test with your personal email
curl -X POST 'http://localhost:3001/api/test/mailgun?email=yourname@gmail.com' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Test with different domain
curl -X POST 'http://localhost:3001/api/test/mailgun?email=test@yourcompany.com' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Test with invalid email
curl -X POST 'http://localhost:3001/api/test/mailgun?email=not-an-email' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Mailgun Configuration

### Getting Mailgun API Key
1. Sign up at [mailgun.com](https://mailgun.com)
2. Go to **Settings** → **API Security**
3. Copy the API Key (starts with `key-`)
4. Keep it secure - this is sensitive

### Setting Up Domain
1. In Mailgun, go to **Sending Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `mg.payvost.com` or `payvost.com`)
4. Add the DNS records provided by Mailgun
5. Wait for verification (usually 24 hours)
6. Once verified, you can use it

### For Testing (Sandbox Domain)
Mailgun provides a free sandbox domain for testing:
- Domain: `sandboxa1b2c3d4.mailgun.org` (unique to your account)
- API Key: Your API key
- Limitation: Can only send to authorized recipients

### For Production (Custom Domain)
- Domain: Your custom domain (e.g., `mg.payvost.com`)
- Setup: Requires DNS records
- Benefit: Professional sender address, better deliverability

## Email Templates

The test uses the `test-email` template. Make sure this template exists in Mailgun:

1. Go to **Templates** in Mailgun
2. Click **Create Template**
3. Name: `test-email`
4. Content:
```html
<h1>Test Email from Payvost</h1>
<p>This is a test email sent at {{test_time}}</p>
<p>To: {{recipient_email}}</p>
<p>If you received this, Mailgun is working correctly!</p>
```

Or use a simple template for now - test email doesn't require a template to work.

## Troubleshooting Invoice Reminders

If invoice reminders aren't working, test in this order:

1. **Test Mailgun Configuration**
   ```bash
   POST /api/test/mailgun?email=your@email.com
   ```
   Expected: Success, email arrives

2. **Test Invoice Reminder Endpoint**
   ```bash
   POST /api/invoices/{invoiceId}/send-reminder
   Authorization: Bearer YOUR_TOKEN
   ```
   Expected: Success response

3. **Check Notification Service**
   - Is notification-processor running?
   - Is NOTIFICATION_SERVICE_URL correctly set in gateway?

4. **Check Logs**
   - Frontend: Browser console
   - Backend: Render logs
   - Mailgun: Dashboard logs

## Success Indicators

✅ **Mailgun is working when:**
- Test email sends successfully
- Email appears in your inbox
- Mailgun dashboard shows message with status "delivered"
- No errors in logs

❌ **Common failure points:**
- Environment variables not set
- Invalid API key or domain
- Domain not verified in Mailgun
- Firewall/network blocking Mailgun API
- Rate limiting exceeded

## Next Steps

After confirming Mailgun works:
1. ✅ Send test invoice reminder
2. ✅ Verify email arrives
3. ✅ Check notification-processor is running
4. ✅ Monitor cron jobs for daily reminders
5. ✅ Set up monitoring/alerts for failures
