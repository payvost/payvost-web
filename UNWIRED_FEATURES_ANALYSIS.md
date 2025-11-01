# Payvost Web - Unwired Features Analysis

## Executive Summary
This document provides a comprehensive analysis of features in the Payvost Web application that need to be wired up to backend services. The analysis was conducted on November 1, 2025.

## 1. Payment & Transfer Operations (CRITICAL)

### 1.1 Remittance/Money Transfer (`src/components/Payvost.tsx`)
**Current State:** Simulated API call with 2-second timeout
```typescript
const handleSendMoney = async () => {
  setIsLoading(true);
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000));
  setIsLoading(false);
};
```

**Backend Service Available:** 
- `/api/transaction` routes exist in `backend/services/transaction/`
- Transaction service has full CRUD operations

**Required Integration:**
1. Create transaction via backend API
2. Validate balance before transfer
3. Update wallet balances atomically
4. Record ledger entries
5. Trigger notifications
6. Handle fraud checks

**Proposed Implementation:**
```typescript
const handleSendMoney = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/transaction/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromAccountId: wallets.find(w => w.currency === fromWallet)?.id,
        toBeneficiaryId: selectedBeneficiary,
        amount: parseFloat(sendAmount),
        currency: fromWallet,
        recipientCurrency: receiveCurrency,
        type: 'REMITTANCE'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      toast({ title: "Transfer Successful", description: `Sent ${sendAmount} ${fromWallet}` });
    }
  } catch (error) {
    toast({ title: "Transfer Failed", description: error.message, variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};
```

### 1.2 Bill Payments (`src/app/dashboard/payments/page.tsx`)
**Current State:** Simulated API call
```typescript
const handleBillPayment = async () => {
  setIsLoading(true);
  // Simulate API call for bill payment
  await new Promise(resolve => setTimeout(resolve, 2000));
  setIsLoading(false);
};
```

**Backend Service Needed:**
- Biller integration service (not yet implemented)
- Payment service can be extended

**Required Actions:**
1. Create biller integration service in backend
2. Integrate with bill payment providers (e.g., QuickTeller, Paystack Bills)
3. Implement balance validation
4. Add transaction recording
5. Implement receipt generation

---

## 2. Form Components Without Submission Logic

### 2.1 Send to Bank Form (`src/components/send-to-bank-form.tsx`)
**Current State:** UI-only component with no submission handler

**Required Integration:**
- Add form submission handler
- Validate bank account via backend
- Create bank transfer transaction
- Handle different transfer types (ACH, Wire, SEPA, etc.)

### 2.2 Send to User Form (`src/components/send-to-user-form.tsx`)
**Current State:** UI-only component

**Required Actions:**
1. Add user lookup by username/email
2. Validate recipient exists
3. Create P2P transfer transaction
4. Notify recipient

---

## 3. Backend Services Not Connected to Frontend

### 3.1 Wallet Service
**Location:** `backend/services/wallet/routes.ts`

**Available Endpoints:**
- `GET /api/wallet/accounts` - Get user accounts
- `POST /api/wallet/accounts` - Create account
- `GET /api/wallet/accounts/:id` - Get account details
- `POST /api/wallet/fund` - Fund account
- `POST /api/wallet/withdraw` - Withdraw from account

**Current Frontend Behavior:**
- Directly uses Firebase Firestore: `onSnapshot(doc(db, 'users', user.uid))`
- Wallets stored in user document: `userData.wallets`

**Required Changes:**
1. Create API service layer: `src/services/walletService.ts`
2. Replace Firebase calls with backend API calls
3. Implement proper error handling
4. Add loading states

**Example Service Layer:**
```typescript
// src/services/walletService.ts
export const walletService = {
  async getAccounts(userId: string) {
    const response = await fetch(`/api/wallet/accounts`, {
      headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
    });
    return response.json();
  },
  
  async createAccount(currency: string) {
    const response = await fetch('/api/wallet/accounts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ currency })
    });
    return response.json();
  },
  
  async fundAccount(accountId: string, amount: number, method: string) {
    const response = await fetch('/api/wallet/fund', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ accountId, amount, method })
    });
    return response.json();
  }
};
```

### 3.2 Transaction Service
**Location:** `backend/services/transaction/routes.ts`

**Available Endpoints:**
- Transaction creation, retrieval, listing
- Using Prisma with PostgreSQL

**Current Frontend Behavior:**
- Transactions stored in Firebase user documents
- No integration with backend transaction service

**Required Integration:**
- Replace Firebase transaction storage with backend API calls
- Migrate existing transactions to PostgreSQL
- Update transaction viewing components

### 3.3 Currency Exchange Service
**Location:** `backend/services/currency/routes.ts`

**Current Frontend Behavior:**
- Hardcoded exchange rates in components:
```typescript
const exchangeRates: Record<string, Record<string, number>> = {
  USD: { NGN: 1450.5, GHS: 14.5, KES: 130.25 },
  EUR: { NGN: 1600.2, GHS: 16.0, KES: 143.5 },
  // ...
};
```

**Required Integration:**
1. Connect to real-time exchange rate API (e.g., ExchangeRate-API, Fixer.io)
2. Cache rates with TTL
3. Replace hardcoded rates with API calls
4. Add rate history tracking

### 3.4 Fraud Detection Service
**Location:** `backend/services/fraud/routes.ts`

**Current State:** Service exists but not integrated in payment flows

**Required Integration:**
1. Add fraud check before transaction processing
2. Implement risk scoring
3. Add transaction monitoring
4. Implement automated flagging/blocking

**Example Integration Point:**
```typescript
// In transaction creation flow
const fraudCheck = await fetch('/api/fraud/check', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    amount,
    currency,
    recipientCountry,
    deviceFingerprint
  })
});

const { riskScore, shouldBlock } = await fraudCheck.json();

if (shouldBlock) {
  throw new Error('Transaction blocked due to security concerns');
}
```

---

## 4. Missing/Incomplete Features

### 4.1 Terminal/POS Feature
**Location:** `src/app/dashboard/terminal/page.tsx`
**Status:** Coming Soon page only

**Required Implementation:**
1. Design POS terminal interface
2. Integrate with payment processors
3. Implement QR code generation
4. Add receipt printing
5. Create transaction recording
6. Build merchant dashboard

### 4.2 Bulk Transfer
**Location:** `src/app/dashboard/payments/page.tsx` (TabsContent bulk-transfer)
**Status:** UI only, no file processing

**Required Implementation:**
1. CSV file upload handler
2. File parsing and validation
3. Batch transaction creation
4. Progress tracking
5. Error reporting per row
6. Summary report generation

### 4.3 Scheduled Transfers
**Location:** `src/app/dashboard/payments/page.tsx` (TabsContent scheduled)
**Status:** Empty state only

**Required Implementation:**
1. Create scheduling interface
2. Backend cron job service
3. Recurring payment logic
4. Schedule management (view/edit/cancel)
5. Payment execution tracking

### 4.4 Split Payment
**Location:** `src/app/dashboard/payments/page.tsx` (TabsContent split-payment)
**Status:** Basic UI, no logic

**Required Implementation:**
1. Participant management
2. Amount calculation/distribution
3. Payment collection tracking
4. Reminder system
5. Partial payment handling

### 4.5 Gift Cards
**Location:** `src/app/dashboard/payments/page.tsx` (TabsContent gift-cards)
**Status:** Placeholder with sample images

**Required Implementation:**
1. Gift card provider integration
2. Brand catalog
3. Denomination selection
4. Delivery method (email/SMS)
5. Balance checking
6. Redemption tracking

---

## 5. Email Notification System

### Missing Email Service Functions
**Location:** `src/app/dashboard/page.tsx`
```typescript
import { sendVerificationWelcomeEmail, sendBusinessApprovalEmail } from '@/services/emailService';
```

**Error:** Module has no exported members

**Required Implementation:**
1. Create `src/services/emailService.ts`
2. Integrate with email provider (SendGrid, AWS SES, etc.)
3. Implement email templates
4. Add functions:
   - `sendVerificationWelcomeEmail`
   - `sendBusinessApprovalEmail`
   - `sendTransactionNotification`
   - `sendDisputeNotification`
   - etc.

**Firebase Functions Available:**
- Email service exists in `functions/src/emailservice.ts`
- Notification triggers in `functions/src/notificationTriggers.ts`

**Required Integration:**
- Wire frontend to call Firebase Functions
- Or migrate email logic to Next.js API routes

---

## 6. Webhook Management

### Current State
**Location:** `src/app/dashboard/integrations/page.tsx`
- Shows webhook UI with mock data
- No actual webhook management

**Required Implementation:**
1. Create webhook CRUD API
2. Implement webhook signing/verification
3. Add webhook event log storage
4. Create retry mechanism
5. Add webhook testing interface
6. Implement event filtering

---

## 7. Investment Features

### Investment Modal
**Location:** `src/components/investment/invest-now-modal.tsx`
**Status:** Simulated API call

**Required Integration:**
1. Investment provider API integration
2. KYC verification check
3. Risk assessment
4. Portfolio tracking
5. Returns calculation
6. Withdrawal handling

---

## 8. TypeScript Errors to Fix

### 8.1 AI Support Chat Flow
```
src/ai/flows/support-chat-flow.ts(24,20): error TS2339: Property 'getGenerator' does not exist on type 'Genkit'.
```
**Fix:** Update to correct Genkit API method

### 8.2 Dashboard Email Imports
```
src/app/dashboard/page.tsx(30,10): error TS2305: Module '"@/services/emailService"' has no exported member 'sendVerificationWelcomeEmail'.
```
**Fix:** Create email service or remove imports

### 8.3 Profile Page setValue
```
src/app/dashboard/profile/page.tsx(307,21): error TS2304: Cannot find name 'setValue'.
```
**Fix:** Import from react-hook-form

### 8.4 Request Payment setRequest Typo
```
src/app/dashboard/request-payment/[id]/page.tsx(51,21): error TS2552: Cannot find name 'setRequest'.
```
**Fix:** Define state or fix typo

---

## 9. Data Architecture Issues

### Current Architecture
- **Frontend:** Direct Firebase Firestore access
- **Backend:** PostgreSQL with Prisma ORM
- **Problem:** Dual data storage without sync

### Issues:
1. User data in Firebase (Firestore)
2. Wallet/Transaction data should be in PostgreSQL
3. No data migration strategy
4. Inconsistent data sources

### Recommended Approach:
1. **Keep Firebase for:** Authentication, real-time notifications
2. **Use PostgreSQL for:** Wallets, transactions, KYC, business data
3. **Create sync layer** or migrate completely to one source

---

## 10. Integration Priority Matrix

| Feature | Priority | Effort | Impact | Dependencies |
|---------|----------|--------|--------|--------------|
| Payment/Transfer API | Critical | High | High | Wallet Service, Transaction Service |
| Wallet Service Integration | Critical | Medium | High | None |
| Currency Exchange API | High | Low | High | External API |
| Email Notifications | High | Medium | Medium | Email Provider |
| Fraud Detection | High | Medium | High | Transaction Service |
| Bill Payments | Medium | High | Medium | Biller Provider |
| Bulk Transfer | Medium | Medium | Medium | Transaction Service |
| Split Payments | Medium | Medium | Low | Transaction Service |
| Scheduled Transfers | Medium | High | Medium | Cron Service |
| Terminal/POS | Low | Very High | Medium | Payment Processors |
| Gift Cards | Low | High | Low | Gift Card Provider |
| Webhooks | Low | Medium | Medium | None |

---

## 11. Recommended Implementation Steps

### Phase 1: Core Infrastructure (Week 1-2)
1. Create API service layer (`src/services/`)
2. Fix TypeScript errors
3. Set up proper error handling
4. Implement authentication flow with backend

### Phase 2: Critical Features (Week 3-4)
1. Wire up wallet operations to backend
2. Connect payment/transfer flows
3. Implement transaction service integration
4. Add currency exchange API

### Phase 3: Essential Features (Week 5-6)
1. Fraud detection integration
2. Email notification system
3. Bill payment integration
4. Complete form handlers

### Phase 4: Advanced Features (Week 7-8)
1. Bulk transfer processing
2. Scheduled transfers
3. Split payments
4. Webhook management

### Phase 5: Additional Features (Week 9+)
1. Terminal/POS feature
2. Gift cards
3. Advanced investment features
4. Analytics and reporting

---

## 12. Code Examples for API Service Layer

### Base API Client
```typescript
// src/services/apiClient.ts
import { auth } from '@/lib/firebase';

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

### Transaction Service
```typescript
// src/services/transactionService.ts
import { apiClient } from './apiClient';

export interface CreateTransactionDto {
  fromAccountId: string;
  toAccountId?: string;
  toBeneficiaryId?: string;
  amount: number;
  currency: string;
  type: 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT';
  description?: string;
}

export const transactionService = {
  async create(data: CreateTransactionDto) {
    return apiClient.post('/api/transaction/create', data);
  },

  async get(transactionId: string) {
    return apiClient.get(`/api/transaction/${transactionId}`);
  },

  async list(accountId: string, limit = 50, offset = 0) {
    return apiClient.get(`/api/transaction?accountId=${accountId}&limit=${limit}&offset=${offset}`);
  },

  async getByUser(limit = 50, offset = 0) {
    return apiClient.get(`/api/transaction/user?limit=${limit}&offset=${offset}`);
  }
};
```

---

## Conclusion

The Payvost Web application has a solid foundation with:
- ✅ Complete UI/UX implementation
- ✅ Backend microservices architecture
- ✅ Firebase authentication
- ✅ Component library

**Key Gaps:**
- ❌ Frontend-backend integration
- ❌ Real API calls (mostly simulated)
- ❌ Service layer architecture
- ❌ Data synchronization strategy

**Next Steps:**
1. Prioritize core payment/transfer functionality
2. Build out API service layer
3. Wire up existing backend services
4. Implement real-time features
5. Complete incomplete features

**Estimated Effort:**
- Full integration: 8-12 weeks
- MVP (core features): 4-6 weeks
