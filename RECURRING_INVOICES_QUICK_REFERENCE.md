# Recurring Invoices - Quick Reference

## 🚀 Quick Setup (5 minutes)

### 1. Set Environment Variables (Render Dashboard)

| Variable | Example Value |
|----------|---------------|
| `ENABLE_RECURRING_SCHEDULER` | `true` |
| `INTERNAL_API_SECRET` | `abc123xyz789def` |

**Generate secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Set Up Cron Job

Use **EasyCron.com** or **Cron-job.org**:

```
URL: https://your-backend.onrender.com/api/invoices/recurring/process
Method: POST
Header: x-api-key: YOUR_INTERNAL_API_SECRET
Schedule: 0 2 * * * (Daily at 2 AM UTC)
```

That's it! ✅

---

## 📋 How It Works

### User Creates Recurring Invoice
1. Fill invoice details
2. Check "Make this a recurring invoice"
3. Select frequency: Daily/Weekly/Monthly
4. Set optional end date
5. Save ✅

### System Auto-Generates
- Cron job runs daily at 2 AM UTC
- Processor checks all recurring invoices
- Generates new ones if due
- Creates PDF automatically ✅

---

## 🔍 Monitor

### Check Status
```bash
curl https://your-backend.onrender.com/api/invoices/recurring/scheduler/status
```

### Get Stats
```bash
curl https://your-backend.onrender.com/api/invoices/recurring/stats
```

### View Logs
- Render Dashboard → Logs
- Search: "Recurring invoice" or "scheduler"

---

## 🧪 Local Testing

```bash
# 1. Enable and start backend
export ENABLE_RECURRING_SCHEDULER=true
export INTERNAL_API_SECRET=test-secret
npm run dev:server

# 2. Create recurring invoice (Daily frequency)

# 3. Trigger processing
curl -X POST http://localhost:3001/api/invoices/recurring/process \
  -H "x-api-key: test-secret"

# 4. Check Firestore console
# Look for new invoice with incremented number
```

---

## 📁 Files & Documentation

| File | Purpose |
|------|---------|
| `backend/services/invoice/src/recurring-invoice-processor.ts` | Core processor logic |
| `backend/services/invoice/src/scheduler.ts` | Scheduling & timing |
| `backend/services/invoice/RECURRING_INVOICES.md` | Technical docs |
| `docs/RECURRING_INVOICES_SETUP.md` | Detailed setup guide |
| `docs/RECURRING_INVOICES_IMPLEMENTATION.md` | Implementation summary |

---

## 🎯 API Endpoints

### Process Invoices
```bash
POST /api/invoices/recurring/process
Header: x-api-key: YOUR_SECRET
```

### Get Status
```bash
GET /api/invoices/recurring/scheduler/status
```

### Get Statistics
```bash
GET /api/invoices/recurring/stats
```

---

## ❓ Troubleshooting

### "No invoices being generated"
1. Check `ENABLE_RECURRING_SCHEDULER=true` is set
2. Verify `lastGeneratedAt` timestamp in Firestore
3. Check cron job execution logs
4. Ensure `recurringFrequency` is daily/weekly/monthly

### "Getting 401 Unauthorized"
1. Verify `INTERNAL_API_SECRET` matches between:
   - Render environment variable
   - Cron job header
2. Check no typos in header name: `x-api-key`

### "PDF not generated"
1. Check PDF service is healthy:
   ```bash
   curl https://your-backend.onrender.com/api/pdf/health
   ```
2. PDFs may take 1-2 minutes to appear
3. Check backend logs for errors

---

## 📊 Firestore Fields

```typescript
// Recurring invoice template
{
  isRecurring: true,
  recurringFrequency: 'monthly',        // 'daily' | 'weekly' | 'monthly'
  recurringEndDate: Timestamp,          // Optional: stop date
  lastGeneratedAt: Timestamp,           // When last invoice was generated
  // ... other invoice fields
}

// Generated invoice (NOT recurring)
{
  isRecurring: false,                   // Important!
  generatedFrom: 'invoiceId123',        // Reference to template
  issueDate: Timestamp,                 // Updated
  dueDate: Timestamp,                   // Updated
  invoiceNumber: 'INV-002'              // Incremented
  // ... other invoice fields
}
```

---

## ⚡ Key Points

✅ **Automatic**: Set up cron job → invoices generate daily
✅ **Safe**: Prevents duplicate invoices with `lastGeneratedAt` check
✅ **Smart**: Only generates if enough time has passed
✅ **Smart PDFs**: Auto-generates PDFs for new invoices
✅ **Numbers**: Preserves invoice number padding (INV-001 → INV-002)
✅ **Secure**: Uses API key authentication (`INTERNAL_API_SECRET`)
✅ **No Recursion**: Generated invoices are NOT recurring themselves

---

## 🔒 Security

- Use strong `INTERNAL_API_SECRET` (32+ characters)
- Rotate it periodically
- Only use HTTPS (no plain HTTP in production)
- Never commit secrets to git
- Keep cron job credentials safe

---

## 📚 More Help

**Technical Questions**:
→ Read `backend/services/invoice/RECURRING_INVOICES.md`

**Setup Issues**:
→ Read `docs/RECURRING_INVOICES_SETUP.md`

**Complete Overview**:
→ Read `docs/RECURRING_INVOICES_IMPLEMENTATION.md`

---

## ✅ Deployment Checklist

- [ ] Set environment variables in Render
- [ ] Create cron job (EasyCron or Cron-job.org)
- [ ] Test with sample recurring invoice
- [ ] Verify cron job runs
- [ ] Check generated invoice appears
- [ ] Confirm PDF created
- [ ] Monitor logs for 48 hours
- [ ] Document for team

---

**Questions?** Check the detailed documentation files listed above.
