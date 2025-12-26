# Recurring Invoice System - Setup Guide

## Quick Start

The recurring invoice system is now fully implemented and ready to use. Here's how to get it running on your Render deployment.

## Step 1: Set Environment Variable

### On Render Dashboard

1. Go to your Render backend service (the Express.js gateway service)
2. Navigate to **Settings** → **Environment**
3. Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `ENABLE_RECURRING_SCHEDULER` | `true` | Yes (to enable auto-processing) |
| `INTERNAL_API_SECRET` | Your secure random string (e.g., `abc123xyz789`) | Yes (for API security) |

**Example**: Generate a secure secret:
```bash
# On your local machine
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Use that value in INTERNAL_API_SECRET
```

4. Save and the service will automatically restart

### In Your Code (Optional - Alternative Method)

If you prefer to set the environment variable programmatically:

In `backend/.env`:
```bash
ENABLE_RECURRING_SCHEDULER=true
INTERNAL_API_SECRET=your-secret-key-here
```

## Step 2: How Recurring Invoices Work

### Creating a Recurring Invoice

1. **Navigate to** Invoice Creation page
2. **Fill out** all invoice details (customer, items, amounts, etc.)
3. **Check** "Make this a recurring invoice"
4. **Select** frequency:
   - **Daily**: New invoice every day
   - **Weekly**: New invoice every 7 days
   - **Monthly**: New invoice every 30 days
5. **Optional**: Set an end date to stop recurring after a date
6. **Save** - Invoice is saved as a template in Firestore

### Automatic Generation

Once enabled, the system will:

**Option A: Automatic Scheduler (Recommended)**
- Runs automatically every 24 hours
- Checks all recurring invoice templates
- Generates new invoices for those due
- Automatically creates PDFs
- Stores generated invoices with incremented invoice numbers

**Option B: Manual Trigger**
- Call the endpoint manually via curl or Render cron job
- Useful for testing or custom scheduling

## Step 3: Configure Auto-Processing

Choose one of these methods to automatically process recurring invoices:

### Method A: Render Cron Job (Recommended for Render)

1. Go to Render Dashboard
2. Create a new **Cron Job** resource:
   - **Name**: `payvost-recurring-invoices`
   - **Language**: `Docker`
   - **Image URL**: Leave blank
   - **Build Command**: Leave blank
   - **Start Command**: Leave blank

Actually, Render Cron Jobs don't work the way we need. Instead, use **Method B**.

### Method B: External Cron Service (Recommended Alternative)

Use a free cron service like **EasyCron** or **Cron-job.org**:

#### Using EasyCron.com:

1. Sign up at [easycron.com](https://www.easycron.com)
2. Create a new cron job:
   - **URL**: `https://your-backend.onrender.com/api/invoices/recurring/process`
   - **HTTP Request Headers**: Add custom header:
     ```
     x-api-key: YOUR_INTERNAL_API_SECRET
     ```
   - **Cron Expression**: `0 2 * * *` (Daily at 2 AM UTC)
   - **Execution Log**: Enable for debugging

#### Using Cron-job.org:

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://your-backend.onrender.com/api/invoices/recurring/process`
   - **Headers** section:
     ```
     x-api-key: YOUR_INTERNAL_API_SECRET
     ```
   - **Schedule**: Daily at 02:00 UTC
   - **Timezone**: UTC

#### Using curl (Local Testing):

```bash
curl -X POST http://localhost:3001/api/invoices/recurring/process \
  -H "x-api-key: your-secret-key" \
  -H "Content-Type: application/json"
```

### Method C: In-Process Scheduler (Development Only)

If you set `ENABLE_RECURRING_SCHEDULER=true`, the scheduler will run automatically in-process. This is useful for development but NOT recommended for production on Render because:
- Doesn't survive service restarts
- Only runs on one instance (if scaled)
- Blocks the main event loop if many invoices

**For production on Render, use Methods A or B above.**

## Step 4: Monitor Recurring Invoice Processing

### Check Scheduler Status

```bash
curl https://your-backend.onrender.com/api/invoices/recurring/scheduler/status
```

Response:
```json
{
  "isProcessing": false,
  "lastProcessedAt": "2025-01-15T02:00:00.000Z"
}
```

### Get Statistics

```bash
curl https://your-backend.onrender.com/api/invoices/recurring/stats
```

Response:
```json
{
  "totalRecurringInvoices": 15,
  "byFrequency": {
    "daily": 2,
    "weekly": 5,
    "monthly": 8
  },
  "byStatus": {
    "active": 14,
    "paused": 1
  }
}
```

### Check Backend Logs

In Render Dashboard:
1. Go to your backend service
2. Click **Logs**
3. Search for "Recurring invoice" or "scheduler"
4. Look for entries like:
   ```
   Processed recurring invoices. Generated 3 new invoices.
   ```

## Step 5: Testing

### Local Testing

```bash
# 1. Start backend with scheduler enabled
export ENABLE_RECURRING_SCHEDULER=true
export INTERNAL_API_SECRET=test-secret
npm run dev:server

# 2. Create a test recurring invoice:
# - Go to http://localhost:3000
# - Create a business invoice
# - Check "Make this a recurring invoice"
# - Set frequency to "Daily"
# - Save

# 3. Trigger processing manually
curl -X POST http://localhost:3001/api/invoices/recurring/process \
  -H "x-api-key: test-secret"

# 4. Check logs for output
# Expected: "Generated 1 new invoice"
```

### Production Testing (On Render)

1. Create a recurring invoice with frequency = "Daily"
2. Wait for the cron job to run (or trigger manually)
3. Check the generated invoice in Firestore console
4. Verify invoice number was incremented
5. Check that PDF was generated

## Step 6: Understanding the Data

### Firestore Structure

Recurring invoices are stored in the `businessInvoices` collection with these fields:

```json
{
  "invoiceNumber": "INV-001",
  "status": "Pending",
  "isRecurring": true,
  "recurringFrequency": "monthly",
  "recurringEndDate": Timestamp(2025-12-31),
  "lastGeneratedAt": Timestamp(2025-01-15),
  "from": { /* business details */ },
  "to": { /* customer details */ },
  "items": [ /* invoice items */ ],
  "notes": "Monthly retainer service"
}
```

### Generated Invoices

When the processor runs, it creates new invoices:

```json
{
  "invoiceNumber": "INV-002",           // Incremented
  "status": "Pending",                   // Same as template
  "isRecurring": false,                  // Generated invoices are NOT recurring
  "issueDate": Timestamp(2025-02-15),    // Updated automatically
  "dueDate": Timestamp(2025-03-15),      // Updated automatically
  "from": { /* same as template */ },
  "to": { /* same as template */ },
  "items": [ /* same as template */ ],
  "createdAt": Timestamp(2025-01-15),
  "generatedFrom": "invoiceId123"        // Reference to template
}
```

## Step 7: Troubleshooting

### "No invoices being generated"

**Check 1**: Verify environment variable is set
```bash
# In Render logs, you should see:
# "Recurring invoice scheduler initialized"
# OR
# "Recurring invoice scheduler disabled"
```

**Check 2**: Verify Firestore has recurring invoices
```
Go to Firestore Console → businessInvoices collection
Look for documents with isRecurring: true
```

**Check 3**: Check `lastGeneratedAt` timestamp
- If `lastGeneratedAt` is recent, the processor ran
- If it's old, the invoice may not be due for generation yet

**Check 4**: Verify `recurringEndDate`
- If end date is in the past, recurring stops automatically
- Check: `recurringEndDate.toDate() > new Date()`

### "Cron job not triggering"

**For EasyCron**:
1. Check the "Execution Log" on their dashboard
2. Look for HTTP status codes (should be 200)
3. Verify the header `x-api-key` is being sent

**For Cron-job.org**:
1. Check "Execution Results" section
2. Look for last execution time
3. If showing errors, click on the execution to see details

### "Getting 401 Unauthorized"

**Check**: INTERNAL_API_SECRET mismatch
```bash
# The x-api-key header value must match exactly
# Error: "Invalid API key"
# Solution: Double-check INTERNAL_API_SECRET in Render env vars
```

### "PDF not being generated for new invoices"

**Check 1**: PDF service is running
```bash
curl https://your-backend.onrender.com/api/pdf/health
# Should return: { "status": "ok" }
```

**Check 2**: Invoice was created successfully
```
Check Firestore console for the generated invoice
Verify it has all required fields
```

**Check 3**: PDF trigger is queued
- PDFs are generated async
- May take 1-2 minutes to appear in Storage
- Check backend logs for "Triggering PDF generation"

## Step 8: Security Considerations

1. **INTERNAL_API_SECRET** should be:
   - Strong and random (at least 32 characters)
   - Different from other API keys
   - Rotated periodically
   - Never committed to git

2. **API Key Exposure**:
   - Only use in cron job configuration
   - Don't expose in frontend code
   - Use HTTPS only

3. **Rate Limiting**:
   - The processor prevents concurrent execution
   - Safe to trigger multiple times
   - Won't create duplicate invoices

## Step 9: Next Steps

### Implement Notifications (Coming Soon)

When recurring invoices are auto-generated, users should be notified:
- Email notification with invoice details
- In-app notification
- SMS notification (optional)

### Recurring Invoice Management UI

Build a page where users can:
- View all their recurring invoice templates
- Edit recurring invoice settings
- Pause/resume recurring invoices
- Cancel recurring invoices with confirmation
- View history of generated invoices

### Advanced Features

- Multiple recurrence patterns (every 2 weeks, quarterly, etc.)
- Custom recurrence rules (first of month only, etc.)
- Automatic payment collection on generation
- Analytics dashboard for recurring revenue

## Configuration Reference

### Environment Variables

```bash
# Enable/disable the in-process scheduler
ENABLE_RECURRING_SCHEDULER=true|false

# Secret key for API authentication
INTERNAL_API_SECRET=your-secret-here

# Backend base URL (for PDF generation callbacks)
BASE_URL=https://your-backend.onrender.com

# Frontend base URL (for redirect URLs in emails)
NEXT_PUBLIC_BASE_URL=https://your-frontend.com
```

### Scheduler Configuration

Edit `backend/services/invoice/src/scheduler.ts` to change:
- Interval between processing runs
- Concurrency limits
- Retry logic

Default: Processes every 24 hours (86,400,000 ms)

## Support & Debugging

### Enable Debug Logging

In `backend/common/logger.ts`, set:
```typescript
const DEBUG_MODE = true;
```

Then look for detailed logs in Render console for:
- `[DEBUG] Checking invoice...`
- `[DEBUG] Generated invoice...`
- `[DEBUG] Triggering PDF...`

### View Raw Data

Use Firestore console to inspect:
1. Navigate to `businessInvoices` collection
2. Find a recurring invoice
3. Check `lastGeneratedAt` field
4. Verify it's newer than the frequency interval

### Contact Support

If you need help:
1. Check the `RECURRING_INVOICES.md` for technical details
2. Review this setup guide for common issues
3. Check backend logs in Render dashboard
4. Check Firestore console for data integrity

## Checklist: Deployment

- [ ] Set `ENABLE_RECURRING_SCHEDULER=true` in Render
- [ ] Set `INTERNAL_API_SECRET` to a secure random value
- [ ] Configure cron job (EasyCron or Cron-job.org)
- [ ] Test with a sample recurring invoice
- [ ] Monitor first run via Render logs
- [ ] Verify generated invoice appears in Firestore
- [ ] Confirm PDF was created in Storage
- [ ] Set up monitoring/alerts for cron job failures
- [ ] Document the cron job schedule for team

## Success Criteria

Your recurring invoice system is working correctly when:

✅ Recurring invoice template is created without errors
✅ Cron job runs daily at scheduled time
✅ Backend logs show "Generated X new invoices"
✅ New invoices appear in Firestore with incremented numbers
✅ PDFs are automatically generated for new invoices
✅ `lastGeneratedAt` timestamp updates after each run
✅ No duplicate invoices are created
✅ Invoices stop generating after `recurringEndDate`
