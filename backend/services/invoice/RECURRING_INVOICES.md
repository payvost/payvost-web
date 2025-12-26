# Recurring Invoice System

## Overview

The recurring invoice system automatically generates new invoices from recurring templates at specified intervals (daily, weekly, or monthly). This feature is available for business users and helps automate the invoicing process for subscriptions, retainers, and ongoing services.

## Architecture

### Components

1. **RecurringInvoiceProcessor** (`recurring-invoice-processor.ts`)
   - Core logic for processing recurring invoices
   - Checks if invoices are due for generation
   - Creates new invoices based on templates
   - Manages generation timestamps and end dates

2. **Scheduler** (`scheduler.ts`)
   - Manages the scheduling of recurring invoice processing
   - Can run automatically on an interval or be triggered manually
   - Prevents concurrent processing
   - Tracks last processing timestamp

3. **API Endpoints** (in `routes.ts`)
   - `POST /api/invoices/recurring/process` - Process all due recurring invoices
   - `GET /api/invoices/recurring/stats` - Get statistics on recurring invoices
   - `GET /api/invoices/recurring/scheduler/status` - Get current scheduler status
   - `POST /api/invoices/recurring/scheduler/trigger` - Manually trigger processing

## Database Schema

### Firestore `businessInvoices` Collection

Extended fields for recurring invoices:

```typescript
{
  // ... existing invoice fields ...
  
  // Recurring fields
  isRecurring: boolean;              // Is this a recurring template
  recurringFrequency: 'daily' | 'weekly' | 'monthly';  // How often to generate
  recurringEndDate?: Timestamp;      // Optional: when to stop recurring
  lastGeneratedAt?: Timestamp;       // When the last invoice was generated
}
```

## How It Works

### 1. User Creates a Recurring Invoice

In the business invoice form, users:
1. Fill out all invoice details
2. Check "Make this a recurring invoice"
3. Select frequency: Daily, Weekly, or Monthly
4. Optionally set an end date
5. Save the invoice

The invoice is saved with `isRecurring: true` and stored as a template.

### 2. Automatic Invoice Generation

#### Option A: Scheduled Processing (Recommended for Render)

Set up a scheduled job in Render to call the processing endpoint daily:

```bash
# In Render dashboard, create a cron job:
POST /api/invoices/recurring/process
Header: x-api-key: YOUR_INTERNAL_API_SECRET
Frequency: Daily at 2:00 AM UTC
```

Or use an external cron service (EasyCron, Cron-job.org):

```
curl -X POST https://your-backend.onrender.com/api/invoices/recurring/process \
  -H "x-api-key: YOUR_INTERNAL_API_SECRET"
```

#### Option B: Manual Triggering

Trigger processing manually when needed:

```bash
curl -X POST http://localhost:3001/api/invoices/recurring/process \
  -H "x-api-key: YOUR_INTERNAL_API_SECRET"
```

### 3. Processing Logic

When the scheduler runs:

1. Fetches all active recurring invoices from Firestore
2. For each recurring invoice:
   - Checks if enough time has passed since last generation
   - Verifies the recurring period hasn't ended
   - Calculates next issue and due dates
   - Creates a new invoice from the template
   - Triggers PDF generation for the new invoice
   - Updates `lastGeneratedAt` timestamp
3. Returns list of generated invoices

### 4. Generated Invoice Details

New invoices inherit from the template:
- Same items and amounts
- Same `from` details
- Same `to` (customer) details
- New dates (issue date + due date based on frequency)
- New invoice number (incremented)
- Status: `PENDING` (same as template)
- **Generated invoices are NOT recurring** - they're standalone

## Configuration

### Environment Variables

```bash
# Required for production
INTERNAL_API_SECRET=your-secret-key-here

# Optional (defaults shown)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BASE_URL=http://localhost:3000
```

### Setting Up the Scheduler

#### On Render

1. Go to your Render dashboard
2. Create a new Cron Job
3. Configure:
   - **Command**: `curl -X POST https://your-backend.onrender.com/api/invoices/recurring/process -H "x-api-key: YOUR_INTERNAL_API_SECRET"`
   - **Schedule**: `0 2 * * *` (daily at 2 AM UTC)
   - **Notifications**: Configure email alerts if job fails

#### Using External Cron Service

1. Sign up for EasyCron.com or Cron-job.org
2. Create a new cron job
3. Set URL: `https://your-backend.onrender.com/api/invoices/recurring/process`
4. Add header: `x-api-key: YOUR_INTERNAL_API_SECRET`
5. Set frequency: Daily

#### In Code (Alternative)

In `backend/index.ts` or service startup:

```typescript
import { startRecurringInvoiceScheduler } from './services/invoice/src/scheduler';

// Start the scheduler on backend startup
if (process.env.ENABLE_RECURRING_SCHEDULER === 'true') {
  startRecurringInvoiceScheduler(24 * 60 * 60 * 1000); // Run daily
}
```

## API Examples

### Process Recurring Invoices

```bash
curl -X POST http://localhost:3001/api/invoices/recurring/process \
  -H "x-api-key: your-secret-key" \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "success": true,
  "message": "Processed recurring invoices. Generated 5 new invoices.",
  "data": [
    {
      "originalInvoiceId": "recurring-template-123",
      "newInvoiceNumber": "INV-2025-001",
      "newInvoiceId": "generated-invoice-456",
      "generatedAt": "2025-01-01T02:00:00.000Z"
    }
  ]
}
```

### Get Scheduler Status

```bash
curl http://localhost:3001/api/invoices/recurring/scheduler/status
```

Response:

```json
{
  "isProcessing": false,
  "lastProcessedAt": "2025-01-01T02:00:00.000Z"
}
```

### Get Recurring Invoice Statistics

```bash
curl http://localhost:3001/api/invoices/recurring/stats
```

Response:

```json
{
  "totalRecurringInvoices": 25,
  "byFrequency": {
    "daily": 2,
    "weekly": 8,
    "monthly": 15
  },
  "byStatus": {
    "active": 22,
    "paused": 3
  }
}
```

## Features

### ✅ Implemented

- [x] Create recurring invoices with frequency selection
- [x] Automatic invoice generation based on schedule
- [x] Support for daily, weekly, and monthly frequency
- [x] Optional end dates for finite recurring series
- [x] Automatic PDF generation for created invoices
- [x] Processing status tracking
- [x] API endpoints for monitoring and triggering

### 🔄 In Progress

- [ ] UI for managing recurring invoice schedules
- [ ] Notifications when invoices are auto-generated
- [ ] Pause/resume functionality
- [ ] Edit recurring invoice template

### 📋 Future Enhancements

- [ ] Multiple recurrence patterns (every 2 weeks, quarterly, etc.)
- [ ] Custom recurrence rules (e.g., 1st of month only)
- [ ] Automatic payment collection on generation
- [ ] Analytics dashboard for recurring revenue
- [ ] Webhook notifications for integrations

## Troubleshooting

### Invoices Not Being Generated

1. Check that `isRecurring: true` is set in Firestore
2. Verify `recurringFrequency` is set to 'daily', 'weekly', or 'monthly'
3. Check that scheduler is running and not stuck processing
4. Verify `INTERNAL_API_SECRET` matches between frontend call and backend verification
5. Check backend logs for errors in the processing function

### Performance Considerations

- Processing large numbers of recurring invoices may take time
- Use `lastGeneratedAt` timestamp to avoid duplicate generation
- Consider batching if you have >100 recurring invoices
- Monitor API timeout settings on Render (default 30 minutes for cron jobs)

### Security Notes

- Always use `INTERNAL_API_SECRET` in production
- Never expose API keys in frontend code
- Use HTTPS for all API calls
- Consider IP whitelisting for cron job sources
- Regularly rotate `INTERNAL_API_SECRET`

## Testing

### Local Testing

```bash
# Start backend
npm run dev:server

# Process recurring invoices
curl -X POST http://localhost:3001/api/invoices/recurring/process \
  -H "x-api-key: default-secret"

# Check status
curl http://localhost:3001/api/invoices/recurring/scheduler/status

# Get stats
curl http://localhost:3001/api/invoices/recurring/stats
```

### Test Data Setup

1. Create a business invoice with:
   - Status: "Pending"
   - Check "Make this a recurring invoice"
   - Select "Daily" frequency (for quick testing)
   - Don't set an end date

2. Call the process endpoint manually

3. Verify a new invoice was created with incremented invoice number

## Support

For issues or questions about the recurring invoice system, check:
1. Backend logs in Render dashboard
2. This README and code comments
3. Firestore console for invoice data structure
4. Test the API endpoints directly with curl
