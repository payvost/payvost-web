# Payvost Web - Architecture & Integration Status

## Current Architecture (Disconnected)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │   Dashboard    │  │   Payments     │  │    Wallets     │   │
│  │   Components   │  │   Components   │  │   Components   │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
│           │                   │                    │            │
│           └───────────────────┴────────────────────┘            │
│                               │                                  │
│                               ▼                                  │
│                    ┌──────────────────────┐                     │
│                    │   Firebase/Firestore │ ◄── Currently Used  │
│                    │   (Direct Access)    │                     │
│                    └──────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ❌ NOT CONNECTED
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Microservices)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Gateway (Express)                        │  │
│  │              Port 3001                                    │  │
│  └────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────┘  │
│       │      │      │      │      │      │      │               │
│       ▼      ▼      ▼      ▼      ▼      ▼      ▼               │
│   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐   │
│   │Wallet││Trans.││Paymnt││ User ││Fraud ││Curr. ││Notif.│   │
│   │ Svc  ││ Svc  ││ Svc  ││ Svc  ││ Svc  ││ Svc  ││ Svc  │   │
│   └──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘   │
│      │       │       │       │       │       │       │         │
│      └───────┴───────┴───────┴───────┴───────┴───────┘         │
│                               │                                  │
│                               ▼                                  │
│                    ┌──────────────────────┐                     │
│                    │   PostgreSQL + Prisma│ ◄── Not Used        │
│                    │   (Ready but Unused) │                     │
│                    └──────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Target Architecture (Fully Wired)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │   Dashboard    │  │   Payments     │  │    Wallets     │   │
│  │   Components   │  │   Components   │  │   Components   │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
│           │                   │                    │            │
│           └───────────────────┴────────────────────┘            │
│                               │                                  │
│                               ▼                                  │
│                    ┌──────────────────────┐                     │
│                    │  API Service Layer   │ ◄── TO BE CREATED   │
│                    │  (apiClient.ts)      │                     │
│                    └──────────┬───────────┘                     │
│                               │                                  │
│  ┌────────────────────────────┴──────────────────────────────┐ │
│  │            Firebase Auth (Token Provider)                  │ │
│  └────────────────────────────┬──────────────────────────────┘ │
│                               │                                  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                │ ✅ FULLY CONNECTED
                                │
┌───────────────────────────────┼──────────────────────────────────┐
│                    BACKEND (Microservices)                       │
│                               │                                  │
│  ┌────────────────────────────┴──────────────────────────────┐  │
│  │              API Gateway (Express)                         │  │
│  │              - JWT Verification                            │  │
│  │              - Rate Limiting                               │  │
│  │              - Request Logging                             │  │
│  │              - Error Handling                              │  │
│  └────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────┘  │
│       │      │      │      │      │      │      │               │
│       ▼      ▼      ▼      ▼      ▼      ▼      ▼               │
│   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐   │
│   │Wallet││Trans.││Paymnt││ User ││Fraud ││Curr. ││Notif.│   │
│   │ Svc  ││ Svc  ││ Svc  ││ Svc  ││ Svc  ││ Svc  ││ Svc  │   │
│   │  ✅  ││  ✅  ││  ✅  ││  ✅  ││  ✅  ││  ✅  ││  ✅  │   │
│   └──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘   │
│      │       │       │       │       │       │       │         │
│      └───────┴───────┴───────┴───────┴───────┴───────┘         │
│                               │                                  │
│                               ▼                                  │
│                    ┌──────────────────────┐                     │
│                    │   PostgreSQL + Prisma│                     │
│                    │   - Users            │                     │
│                    │   - Accounts         │                     │
│                    │   - Transactions     │                     │
│                    │   - Ledger Entries   │                     │
│                    └──────────────────────┘                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            External Integrations                        │    │
│  │  - Stripe/FedNow/SEPA (Payment Providers)             │    │
│  │  - Currency Exchange API                               │    │
│  │  - Email Service (SendGrid/SES)                        │    │
│  │  - Bill Payment Providers                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Current vs Target

### Current: Money Transfer Flow (BROKEN)

```
User clicks "Send Money"
         │
         ▼
   Payvost.tsx
   handleSendMoney()
         │
         ▼
   setTimeout(2000)  ◄── ❌ SIMULATED
         │
         ▼
   Show success message
   (NO ACTUAL TRANSFER)
```

### Target: Money Transfer Flow (CORRECT)

```
User clicks "Send Money"
         │
         ▼
   Payvost.tsx
   handleSendMoney()
         │
         ▼
   apiClient.post('/api/transaction/create')
         │
         ▼
   API Gateway
   - Verify JWT token
   - Check rate limits
         │
         ▼
   Transaction Service
   - Validate balance
   - Check KYC status
         │
         ├──► Fraud Service
         │    - Check risk score
         │    - Detect anomalies
         │
         ├──► Currency Service
         │    - Get exchange rate
         │    - Calculate amount
         │
         ▼
   PostgreSQL Transaction
   - Debit sender account
   - Credit recipient account
   - Create ledger entries
   - Record transaction
         │
         ├──► Notification Service
         │    - Email receipt
         │    - Push notification
         │
         ▼
   Return success response
         │
         ▼
   Update frontend UI
   Show actual transaction details
```

## Service Integration Map

### Wallet Service

```
Frontend Components          Backend Service          Database
─────────────────────────────────────────────────────────────
wallets/page.tsx     ──►  /api/wallet/accounts  ──►  Account
fund-wallet-dialog   ──►  /api/wallet/fund     ──►  LedgerEntry
create-wallet-dialog ──►  /api/wallet/accounts ──►  Account
                          (POST)

Current Status: ❌ Not connected (uses Firebase)
Time to Wire:   3 hours
Priority:       🔴 Critical
```

### Transaction Service

```
Frontend Components          Backend Service              Database
─────────────────────────────────────────────────────────────────
Payvost.tsx          ──►  /api/transaction/create  ──►  Transfer
transactions/page    ──►  /api/transaction/user    ──►  Transfer
transaction/[id]     ──►  /api/transaction/:id     ──►  Transfer

Current Status: ❌ Not connected (simulated)
Time to Wire:   4 hours
Priority:       🔴 Critical
```

### Payment Service

```
Frontend Components          Backend Service              External
─────────────────────────────────────────────────────────────────
payments/page.tsx    ──►  /api/payment/create-intent ──► Stripe
donate/[id]          ──►  /api/payment/status/:id    ──► FedNow
pay/[id]             ──►  /api/payment/webhook       ──► SEPA

Current Status: ⚠️ Partially connected
Time to Wire:   8 hours
Priority:       🔴 Critical
```

### Currency Service

```
Frontend Components          Backend Service          External
────────────────────────────────────────────────────────────
Payvost.tsx          ──►  /api/currency/rates  ──► ExchangeRate-API
wallets/page.tsx     ──►  /api/currency/rates  ──► (Cached)
payments/page.tsx    ──►  /api/currency/convert

Current Status: ❌ Not connected (hardcoded)
Time to Wire:   2 hours
Priority:       🔴 Critical
```

### Fraud Service

```
Transaction Flow             Fraud Service
────────────────────────────────────────────
Before transfer      ──►  /api/fraud/check
  - Amount                 - Risk scoring
  - User history          - Anomaly detection
  - Device info           - Pattern matching
                          - Velocity checks

Current Status: ❌ Not integrated
Time to Wire:   4 hours
Priority:       🟡 High
```

## Component → Service Mapping

### Critical Components (Wire First)

```
┌─────────────────────────────┬───────────────────┬──────────┐
│ Component                    │ Service Needed    │ Priority │
├─────────────────────────────┼───────────────────┼──────────┤
│ Payvost.tsx                  │ Transaction       │ 🔴 Crit  │
│ wallets/page.tsx             │ Wallet            │ 🔴 Crit  │
│ payments/page.tsx            │ Payment           │ 🔴 Crit  │
│ All (exchange rates)         │ Currency          │ 🔴 Crit  │
│ cards/page.tsx               │ Card (new)        │ 🟡 High  │
│ transactions/page.tsx        │ Transaction       │ 🟡 High  │
└─────────────────────────────┴───────────────────┴──────────┘
```

## Integration Dependencies

```
                    API Service Layer
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         Fix TS Errors  Auth Flow   Error Handler
              │            │            │
              └────────────┴────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        Wallet Service          Transaction Service
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                  Currency Service
                           │
                           ▼
                  Fraud Detection
                           │
                           ▼
                  All Other Services
```

## Database Schema Overview

### Current (Firebase)

```
users/{uid}
  ├─ wallets: []
  ├─ cards: []
  ├─ transactions: []
  └─ beneficiaries: []
```

### Target (PostgreSQL)

```
User
  ├─ Account[] (wallets)
  │    └─ LedgerEntry[] (balance changes)
  ├─ Transfer[] (transactions)
  │    └─ TransferStatusUpdate[]
  ├─ Card[]
  │    └─ CardTransaction[]
  └─ Beneficiary[]
```

## File Structure - Before & After

### Before (No Service Layer)

```
src/
├─ components/
│  └─ Payvost.tsx  ──► Firebase directly ❌
├─ app/
│  └─ dashboard/
│     └─ wallets/
│        └─ page.tsx  ──► Firebase directly ❌
```

### After (With Service Layer)

```
src/
├─ services/          ◄── NEW
│  ├─ apiClient.ts    ◄── Base HTTP client
│  ├─ walletService.ts
│  ├─ transactionService.ts
│  ├─ paymentService.ts
│  └─ currencyService.ts
├─ components/
│  └─ Payvost.tsx  ──► transactionService.create() ✅
├─ app/
│  └─ dashboard/
│     └─ wallets/
│        └─ page.tsx  ──► walletService.getAll() ✅
```

## Progress Tracking

### Phase 1: Foundation
```
[ ] Create API service layer
[ ] Fix TypeScript errors
[ ] Set up auth flow
[ ] Implement error handling
```

### Phase 2: Core Services
```
[ ] Wire wallet service (3 hours)
[ ] Wire transaction service (4 hours)
[ ] Integrate currency API (2 hours)
[ ] Connect payment service (8 hours)
```

### Phase 3: Additional Services
```
[ ] Integrate fraud detection (4 hours)
[ ] Set up email service (16 hours)
[ ] Wire notification service (8 hours)
```

### Phase 4: Complete Features
```
[ ] All forms have handlers
[ ] All simulations removed
[ ] All TypeScript errors fixed
[ ] All tests passing
[ ] All documentation updated
```

## Success Metrics

```
Before:
- Simulated APIs: 5
- Backend Connected: 0%
- TS Errors: 35+
- Forms Complete: 45%

After:
- Simulated APIs: 0 ✅
- Backend Connected: 100% ✅
- TS Errors: 0 ✅
- Forms Complete: 100% ✅
```

---

**Next Step:** Create the API service layer → See QUICK_WIRING_GUIDE.md
