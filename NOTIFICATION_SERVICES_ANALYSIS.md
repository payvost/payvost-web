# Notification Services Analysis: Old vs New

## Executive Summary

You have **TWO DIFFERENT notification services** serving different purposes:

| Aspect | `notification-service` (Old) | `notification-processor` (New) |
|--------|------|--------|
| **Purpose** | Webhook-based email notifications for various events | Email delivery + Automated cron jobs |
| **Architecture** | Proxy/relay to email-service | Direct Mailgun integration |
| **Database** | No direct database access | Direct PostgreSQL via Prisma |
| **Automation** | Manual triggers only | Cron jobs (daily invoice reminders) |
| **Endpoints** | 7 specialized endpoints | 3 generic endpoints |
| **Status** | **STILL NEEDED** | **NEW / REPLACES SOME FUNCTIONS** |

---

## Detailed Comparison

### OLD SERVICE: `notification-service` (Port 3005)
**Location**: `backend/services/notification-service`  
**Currently Deployed**: Yes - `payvost-notification-service-j7g0.onrender.com`

#### Purpose
Acts as a **webhook receiver** for various events and sends formatted emails through the email service.

#### Endpoints (7 total)
1. **POST `/notify/login`** - Send login notification
2. **POST `/notify/kyc`** - Send KYC status updates (approved/rejected)
3. **POST `/notify/business`** - Send business account updates
4. **POST `/notify/transaction`** - Send transaction confirmations
5. **POST `/notify/payment-link`** - Send payment link emails
6. **POST `/notify/invoice`** - Send invoice notifications (generated/reminder/paid)
7. **GET `/health`** - Health check

#### How It Works
```
Gateway calls: POST /notify/login
       ↓
notification-service validates request
       ↓
Calls: POST EMAIL_SERVICE_URL/single (with template + variables)
       ↓
email-service sends via Mailgun
```

#### Dependencies
- `express`: HTTP server
- `axios`: HTTP client to call email-service
- `cors`: Cross-origin support
- No database access
- No Prisma

#### Flow
```typescript
// Example: Login notification
POST /notify/login {
  email: "user@example.com",
  name: "John Doe",
  deviceInfo: "iPhone 14",
  location: "New York, USA",
  ipAddress: "192.168.1.1",
  timestamp: "2025-12-27T03:00:00Z"
}

⬇️

notification-service extracts data
⬇️

Calls email-service with:
{
  to: "user@example.com",
  template: "login-notification",
  templateVariables: {
    name: "John Doe",
    first_name: "John",
    device_info: "iPhone 14",
    location: "New York, USA",
    ip_address: "192.168.1.1",
    timestamp: "December 27, 2025 03:00 AM"
  }
}

⬇️

email-service sends via Mailgun
```

---

### NEW SERVICE: `notification-processor` (Port 3006)
**Location**: `backend/services/notification-processor`  
**Currently Deployed**: YES ✅ - `payvost-notification-processor.onrender.com`

#### Purpose
Direct email delivery service with **automated cron jobs** for scheduled tasks.

#### Endpoints (3 total)
1. **POST `/send`** - Generic email send endpoint
2. **GET `/health`** - Health check
3. **GET `/test`** - Test endpoint

#### How It Works
```
// Two modes of operation:

MODE 1: On-Demand
Gateway calls: POST /send
       ↓
notification-processor sends via Mailgun directly
       ↓
Email delivered

MODE 2: Scheduled (Cron Job)
Daily at 9 AM UTC:
       ↓
Invoice Reminder Cron Job runs
       ↓
Query PostgreSQL: invoices with status=DRAFT, dueDate within 3 days
       ↓
For each invoice: send reminder email via Mailgun
       ↓
Update: reminderSent=true, lastReminderSent=now()
```

#### Dependencies
- `express`: HTTP server
- `mailgun.js`: Direct Mailgun API integration
- `node-cron`: Scheduled job runner
- **`@prisma/client`**: Direct database access
- **`prisma`**: Schema management
- `dotenv`: Environment variables

#### Cron Job Features
```typescript
// Invoice Reminder: 0 9 * * * (9 AM UTC every day)
Query criteria:
- Invoice.status = "DRAFT"
- Invoice.dueDate <= today + 3 days
- Invoice.paidAt = null (not paid)
- Invoice.reminderSent = false (not already sent)

Actions:
1. Extract customer email from toInfo.email
2. Extract invoice details from lineItems, fromInfo
3. Send email via Mailgun template "invoice-reminder"
4. Update: reminderSent = true, lastReminderSent = now()
```

#### Database Integration
```typescript
// Direct access to:
- Invoice model
- User model
- Account model

Can query/update invoice reminder tracking:
- reminderSent (boolean)
- lastReminderSent (DateTime)
- reminderCount (integer)
```

---

## Event Flow: Which Service Gets Called?

### Login Notification
```
1. User logs in
2. Gateway → notification-service POST /notify/login
3. notification-service → email-service → Mailgun
4. Email sent ✓
```

### KYC Status Change
```
1. Admin approves KYC
2. Gateway → notification-service POST /notify/kyc
3. notification-service → email-service → Mailgun
4. Email sent ✓
```

### Invoice Created
```
1. Invoice created in invoice service
2. Gateway → notification-service POST /notify/invoice (type: 'generated')
3. notification-service → email-service → Mailgun
4. Email sent ✓
```

### Invoice Reminder (AUTOMATED)
```
1. Cron job runs daily at 9 AM UTC
2. notification-processor queries PostgreSQL directly
3. Finds invoices due in 3 days
4. notification-processor → Mailgun directly
5. Email sent + database updated ✓
```

### Invoice Paid Notification
```
1. Invoice marked as paid
2. Gateway → notification-service POST /notify/invoice (type: 'paid')
3. notification-service → email-service → Mailgun
4. Email sent ✓
```

---

## Decision: Keep Both or Consolidate?

### Option A: **Keep Both (Recommended - Safest)**

**Pros**:
- ✅ Old service handles all manual/webhook notifications (login, KYC, transactions, etc.)
- ✅ New service handles automated cron jobs (invoice reminders)
- ✅ No service changes needed
- ✅ Low risk of breaking existing features
- ✅ Clear separation of concerns

**Cons**:
- ❌ Running 2 services (costs ~$13/month extra)
- ❌ More complexity to maintain

**Cost**: $550/month (notification-processor) + existing email-service + old notification-service ≈ ~$570/month

---

### Option B: **Consolidate into notification-processor Only**

Would require:
1. ✅ **COPY** all 7 endpoints from old service to new service
2. ✅ **ADD** them as API routes (not cron jobs)
3. ⚠️ Test all 7 event types to ensure they work
4. ✅ Update gateway to call new service instead of old
5. ⚠️ Delete old service
6. ⚠️ Delete old email-service

**Pros**:
- ✅ Single service to maintain
- ✅ Direct Mailgun integration (no relay through email-service)
- ✅ Database access for all operations
- ✅ Save ~$25/month in hosting costs

**Cons**:
- ⚠️ Major refactor required
- ⚠️ Higher risk of breaking existing notifications
- ⚠️ Testing all 7 event types needed

---

### Option C: **Delete Old Service, Keep Both URLs**

The old service (notification-service) was probably a placeholder. If it's not actively being used:

1. **Delete** `backend/services/notification-service` folder
2. **Delete** old Render service `payvost-notification-service`
3. **Keep** `notification-processor` and update gateway accordingly

**Verify first**: Check if gateway is actually calling `/notify/login`, `/notify/kyc`, etc.

---

## What the Gateway Currently Uses

Let me check what endpoints the gateway is calling:

**Current situation**:
- `NOTIFICATION_SERVICE_URL=https://payvost-notification-processor.onrender.com` is already set
- But the old service still exists and is running

**Question for you**:
Are the gateway calls going to:
- A) The old service (notification-service on port 3005)?
- B) The new service (notification-processor on port 3006)?
- C) Both?

---

## My Recommendation

**SHORT TERM (This Week)**:
1. ✅ Keep `notification-processor` running (it's now live and working!)
2. ⚠️ **VERIFY**: Check gateway logs to see which service it's calling
3. ⚠️ **TEST**: Send a login notification and verify it arrives
4. 🔍 Decide if old service is actually being used

**MEDIUM TERM (Next Week)**:
- If old service **IS being used**: Keep both (safest approach)
- If old service **NOT being used**: Delete it and consolidate

**LONG TERM (Next Month)**:
- Consider consolidating if you want to reduce costs
- But only if you've thoroughly tested and are confident in stability

---

## Files to Check

To confirm which service gateway calls, search for:

```bash
# Search in gateway code
grep -r "notification" backend/gateway/src/routes.ts

# Search in API routes
grep -r "NOTIFICATION_SERVICE_URL" src/app/api/

# Check what events trigger notifications
grep -r "/notify/" backend/
```

---

## Summary Table

| Feature | Old Service | New Service | Decision |
|---------|------------|------------|----------|
| Login notifications | ✅ Yes | ❌ No | Keep old |
| KYC notifications | ✅ Yes | ❌ No | Keep old |
| Transaction notifications | ✅ Yes | ❌ No | Keep old |
| Business notifications | ✅ Yes | ❌ No | Keep old |
| Payment link notifications | ✅ Yes | ❌ No | Keep old |
| Invoice on-demand notifications | ✅ Yes | ✅ Yes | Either works |
| **Invoice daily reminders (cron)** | ❌ No | ✅ Yes | **Use NEW** |
| Database integration | ❌ No | ✅ Yes | Use new for cron |
| Direct Mailgun | ❌ No (via email-service relay) | ✅ Yes | New is better |

---

## Next Action

**What should we do?**

1. **Option A**: Keep both services running (safe, working now)
2. **Option B**: Consolidate into notification-processor (costs less, riskier)
3. **Option C**: Delete old service if it's not used

Let me know which you prefer and I can implement it! 🚀
