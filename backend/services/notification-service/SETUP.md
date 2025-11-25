# Notification Service Setup

## Quick Start

1. **Deploy to Render**: The service is already in `render.yaml` - just push to GitHub and Render will deploy it automatically.

2. **Set Environment Variables in Render Dashboard**:
   - `NOTIFICATION_SERVICE_PORT=3005`
   - `EMAIL_SERVICE_URL=https://payvost-email-service.onrender.com`
   - `INTERNAL_API_KEY` (optional, for service-to-service auth)
   - `NODE_ENV=production`

3. **Verify Mailgun Templates**: Make sure your Mailgun templates are named:
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

4. **Use in Your App**: Import and use the helper functions from `src/lib/notification-webhook.ts`

## Service URL

After deployment, your service will be available at:
```
https://payvost-notification-service.onrender.com
```

## Testing

```bash
# Health check
curl https://payvost-notification-service.onrender.com/health

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

## Next Steps

See `docs/NOTIFICATION_SERVICE_MIGRATION.md` for how to integrate this into your app code.

