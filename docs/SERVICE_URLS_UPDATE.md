# Service URLs Update

## Overview
All service URLs have been updated to use the new Render deployment URLs from the new workspace.

## Updated Service URLs

### Core Services
- **Notification Service**: `https://payvost-notification-service-xrk6.onrender.com`
- **Email Service**: `https://payvost-email-service-3vnx.onrender.com`
- **PDF Generator**: `https://payvost-pdf-generator-45c7.onrender.com`
- **Admin Stats Service**: `https://payvost-admin-stat-service-00u8.onrender.com`

### Additional Services (for reference)
- **Currency Service**: `https://payvost-currency-service-ju9r.onrender.com`
- **Fraud Service**: `https://payvost-fraud-service-v5hs.onrender.com`
- **Core Banking Service**: `https://payvost-core-banking-service-6vod.onrender.com`
- **Webhook Service**: `https://payvost-web-hook-services-4jm5.onrender.com`
- **Rate Alert Service**: `https://payvost-rate-alert-service-wh6e.onrender.com`

## Files Updated

### 1. Frontend Files
- ✅ `src/lib/notification-webhook.ts` - Updated notification service URL
- ✅ `src/app/api/auth/track-login/route.ts` - Added login notification functionality
- ✅ `src/app/api/generate-invoice-pdf/route.ts` - Updated PDF service URL
- ✅ `src/app/api/admin/dashboard/stats/route.ts` - Updated admin stats service URL
- ✅ `src/app/api/admin/dashboard/transactions/route.ts` - Updated admin stats service URL
- ✅ `src/app/api/admin/dashboard/volume-over-time/route.ts` - Updated admin stats service URL
- ✅ `src/app/api/admin/dashboard/currency-distribution/route.ts` - Updated admin stats service URL

### 2. Backend Files
- ✅ `backend/services/notification-service/src/index.ts` - Updated email service URL

### 3. Configuration Files
- ✅ `render.yaml` - Updated email service URL for notification service

## Login Notification Fix

The login notification functionality has been re-added to `/api/auth/track-login`. Now when users log in:

1. Login is tracked (IP, device, timestamp)
2. Login notification is sent via the notification service (non-blocking)
3. Notification service calls the email service
4. Email is sent using Mailgun template `login-notification`

## Environment Variables

These can be set in Vercel/your deployment platform, but defaults are now configured:

```env
# Optional - defaults are set in code
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://payvost-notification-service-xrk6.onrender.com
ADMIN_STATS_SERVICE_URL=https://payvost-admin-stat-service-00u8.onrender.com
PDF_SERVICE_URL=https://payvost-pdf-generator-45c7.onrender.com
```

## Testing

### Test Login Notification
1. Log in to your application
2. Check your email for login notification
3. Check notification service logs: `https://payvost-notification-service-xrk6.onrender.com/health`

### Test Notification Service Directly
```bash
curl -X POST https://payvost-notification-service-xrk6.onrender.com/notify/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "deviceInfo": "Chrome Browser",
    "location": "New York, US",
    "ipAddress": "192.168.1.1"
  }'
```

### Test Email Service
```bash
curl https://payvost-email-service-3vnx.onrender.com/health
```

## Service Health Checks

All services should be accessible at their `/health` endpoints:

- Notification: `https://payvost-notification-service-xrk6.onrender.com/health`
- Email: `https://payvost-email-service-3vnx.onrender.com/health`
- PDF: `https://payvost-pdf-generator-45c7.onrender.com/health`
- Admin Stats: `https://payvost-admin-stat-service-00u8.onrender.com/health`
- Currency: `https://payvost-currency-service-ju9r.onrender.com/health`
- Fraud: `https://payvost-fraud-service-v5hs.onrender.com/health`
- Core Banking: `https://payvost-core-banking-service-6vod.onrender.com/health`
- Webhook: `https://payvost-web-hook-services-4jm5.onrender.com/health`
- Rate Alert: `https://payvost-rate-alert-service-wh6e.onrender.com/health`

## Next Steps

1. ✅ All URLs updated
2. ✅ Login notifications re-enabled
3. ⏳ Deploy to production
4. ⏳ Test login notifications end-to-end
5. ⏳ Verify all services are accessible

## Notes

- All service URLs use the new workspace deployment
- Defaults are hardcoded in the code, so environment variables are optional
- Login notifications are non-blocking (won't delay login if they fail)
- All services should be accessible from your Vercel deployment

