# Notification Processor Service

Email notification processor with cron jobs for invoice reminders.

## Overview

The notification processor handles:
- 📧 Sending email notifications via Mailgun
- 🕐 Scheduling invoice reminders (cron jobs)
- 📊 Logging all sent notifications to database

## Setup

### 1. Environment Variables

Create `.env` file:

```bash
# Server
PORT=3006
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:5432/payvost_prod
DIRECT_URL=postgresql://user:password@host:5432/payvost_prod

# Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=notifications@payvost.com

# Service Authentication
INTERNAL_SERVICE_TOKEN=your-internal-token

# Cron Jobs
INVOICE_REMINDER_ENABLED=true
INVOICE_REMINDER_SCHEDULE=0 9 * * *  # 9 AM UTC daily
TIMEZONE=UTC
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build

```bash
npm run build
```

### 4. Start

```bash
npm start
```

## API Endpoints

### POST /send

Send a notification email.

**Request:**
```json
{
  "type": "invoice_reminder",
  "email": "customer@example.com",
  "subject": "Payment Reminder",
  "template": "invoice-reminder",
  "variables": {
    "customerName": "John Doe",
    "invoiceNumber": "INV-001",
    "amount": "1000",
    "currency": "USD",
    "dueDate": "2025-12-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message-id-from-mailgun",
  "message": "Notification sent successfully"
}
```

### GET /health

Check service health.

**Response:**
```json
{
  "status": "healthy",
  "service": "notification-processor",
  "timestamp": "2025-12-27T01:30:00.000Z"
}
```

### GET /

Get service information.

**Response:**
```json
{
  "service": "Payvost Notification Processor",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "send": "POST /send",
    "test": "GET /test"
  }
}
```

## Cron Jobs

### Invoice Reminder Job

Runs daily at 9 AM UTC (configurable).

**What it does:**
1. Finds all pending invoices due within next 3 days
2. Sends reminder email to customer
3. Marks `reminderSentAt` timestamp
4. Logs to `SentNotification` table

**Configuration:**
```bash
INVOICE_REMINDER_ENABLED=true
INVOICE_REMINDER_SCHEDULE=0 9 * * *
```

## Database Schema

### SentNotification Table

```sql
CREATE TABLE "SentNotification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50),
  email VARCHAR(255),
  recipientName VARCHAR(255),
  status VARCHAR(50),
  sentAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Development

### Run in Development Mode

```bash
npm run dev
```

### Build TypeScript

```bash
npm run build
```

### Test

```bash
npm test
```

## Production Deployment

### On Render

1. Create new web service
2. Connect to GitHub (payvost/payvost-web)
3. Configure:
   - **Root Directory**: `backend/services/notification-processor`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables
5. Deploy

### Monitoring

- Check service health: `GET /health`
- View logs in Render dashboard
- Monitor cron job execution in logs

## Troubleshooting

### Email not sending
- Check `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`
- Verify sender domain in Mailgun
- Check recipient email validity

### Cron job not running
- Verify `INVOICE_REMINDER_ENABLED=true`
- Check cron schedule format (5-part cron syntax)
- View logs for job execution

### Database connection error
- Verify `DATABASE_URL` format
- Check database is accessible from service
- Ensure Prisma client is generated

## Architecture

```
┌─────────────────────────────────────┐
│    Notification Processor           │
├─────────────────────────────────────┤
│                                     │
│  Routes                             │
│  ├── POST /send                     │
│  ├── GET /health                    │
│  └── GET /                          │
│                                     │
│  Services                           │
│  ├── Mailgun (Email delivery)       │
│  ├── Cron (Job scheduling)          │
│  └── Prisma (Database ORM)          │
│                                     │
└─────────────────────────────────────┘
         ↓            ↓            ↓
    Mailgun       PostgreSQL   Render
```

## Support

For issues or questions, check the main project documentation or create an issue in the GitHub repository.
