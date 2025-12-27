# 🚀 Quick Reference - Email & Invoice Reminder System

**Status:** ✅ Production Ready | **Date:** December 27, 2025

---

## One-Minute Summary

✅ **Mailgun:** Working (tested at 13:51 UTC)  
✅ **Test Endpoint:** POST /api/test/mailgun?email=...  
✅ **Invoice Reminder:** POST /api/invoices/{id}/send-reminder  
✅ **Cron Jobs:** Daily at 9 AM UTC on Render  
✅ **Documentation:** Complete  

---

## Quick Tests

### Test Mailgun
```powershell
.\scripts\test-mailgun.ps1 -Email "your@email.com"
```

### Test Invoice Reminder
```bash
curl -X POST http://localhost:3001/api/invoices/{invoiceId}/send-reminder \
  -H "Authorization: Bearer {firebase_token}" \
  -H "Content-Type: application/json"
```

### Check Services
```bash
# Backend health
curl http://localhost:3001/health

# Notification processor
curl https://payvost-notification-processor.onrender.com/health
```

---

## Files You Need to Know About

| File | Purpose | Status |
|------|---------|--------|
| `backend/services/invoice/src/routes.ts` | Send reminder endpoint | ✅ Added today |
| `backend/.env` | Mailgun config | ✅ Configured |
| `src/components/business-invoice-list-view.tsx` | Frontend button handler | ✅ Ready |
| `src/app/api/invoices/[id]/send-reminder/route.ts` | API proxy | ✅ Ready |

---

## API Endpoints

### Send Reminder
```
POST /api/invoices/:id/send-reminder
Authorization: Bearer {firebase_token}

Response (200):
{
  "success": true,
  "message": "Invoice reminder sent to customer@example.com",
  "email": "customer@example.com"
}
```

### Test Mailgun
```
POST /api/test/mailgun?email=test@example.com

Response (200):
{
  "success": true,
  "messageId": "<20251227...@payvost.com>",
  "message": "Test email sent successfully to test@example.com"
}
```

---

## Environment Variables

```env
# backend/.env (see .env file for actual values - DO NOT COMMIT SECRETS)
MAILGUN_API_KEY=<your_api_key_here>
MAILGUN_DOMAIN=payvost.com
MAILGUN_FROM_EMAIL=no-reply@payvost.com
NOTIFICATION_SERVICE_URL=http://localhost:3006
```

---

## Error Solutions

| Error | Fix |
|-------|-----|
| "Customer email not found" | Add email to invoice customer details |
| "Invoice not found" | Verify invoice ID is correct |
| "Unauthorized" | Need valid Firebase token OR must be invoice creator |
| "Failed to send" | Check notification-processor is running on Render |
| Email not received | Check spam folder, verify email address, check Mailgun dashboard |

---

## Monitoring

**Mailgun Dashboard:** https://app.mailgun.com  
**Render Service:** https://dashboard.render.com (notification-processor)  
**Cron Schedule:** 0 9 * * * (9 AM UTC daily)  
**Health Check:** GET /health on both backend and notification-processor  

---

## Last Verified

✅ Backend health: 2025-12-27 13:46 UTC  
✅ Mailgun test: 2025-12-27 13:51 UTC  
✅ Invoice endpoint: 2025-12-27 14:00 UTC  

---

## To Deploy to Production

1. Update MAILGUN_FROM_EMAIL to production domain (if needed)
2. Verify MAILGUN_API_KEY has production restrictions
3. Update NOTIFICATION_SERVICE_URL to production Render URL
4. Deploy backend: `npm run build && npm run start`
5. Monitor logs for 24 hours

---

**Full Documentation:** See `EMAIL_SYSTEM_COMPLETE.md`  
**Detailed Tests:** See `MAILGUN_VERIFICATION_COMPLETE.md`
