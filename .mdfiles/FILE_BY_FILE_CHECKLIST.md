# File-by-File Wiring Checklist

## Frontend Components That Need Backend Integration

### 💰 Payment & Transfer Components

#### 1. `src/components/Payvost.tsx`
- **Status:** 🔴 Simulated
- **Line 108-113:** `handleSendMoney` function
- **Action:** Replace setTimeout with POST to `/api/transaction/create`
- **Backend:** `backend/services/transaction/routes.ts`
- **Estimated Time:** 2-3 hours

#### 2. `src/components/send-to-bank-form.tsx`
- **Status:** 🟡 UI Only
- **Missing:** Form submission handler
- **Action:** 
  1. Add `onSubmit` handler
  2. Validate bank details
  3. Call transaction API
- **Estimated Time:** 2 hours

#### 3. `src/components/send-to-user-form.tsx`
- **Status:** 🟡 UI Only
- **Missing:** Form submission handler
- **Action:**
  1. Add user lookup
  2. Create P2P transfer
  3. Handle notifications
- **Estimated Time:** 2 hours

#### 4. `src/components/payment-confirmation-dialog.tsx`
- **Status:** ✅ UI Complete
- **Note:** This is a UI component that wraps other actions, no direct wiring needed

---

### 💳 Wallet Components

#### 5. `src/app/dashboard/wallets/page.tsx`
- **Status:** 🔴 Uses Firebase
- **Line 63-72:** Firebase snapshot listener
- **Action:** Replace with API calls
  ```typescript
  // Replace this:
  onSnapshot(doc(db, "users", user.uid), (doc) => {...})
  
  // With this:
  useEffect(() => {
    fetchWallets();
  }, []);
  
  async function fetchWallets() {
    const response = await fetch('/api/wallet/accounts');
    const data = await response.json();
    setWallets(data.accounts);
  }
  ```
- **Backend:** `backend/services/wallet/routes.ts`
- **Estimated Time:** 3 hours

#### 6. `src/components/fund-wallet-dialog.tsx`
- **Status:** 🟡 Partial
- **Missing:** Actual funding logic
- **Action:** Connect to `/api/wallet/fund`
- **Estimated Time:** 2 hours

#### 7. `src/components/create-wallet-dialog.tsx`
- **Status:** 🟡 Partial
- **Missing:** Backend wallet creation
- **Action:** Connect to `/api/wallet/accounts` POST
- **Estimated Time:** 1 hour

---

### 💳 Card Management

#### 8. `src/app/dashboard/cards/page.tsx`
- **Status:** 🔴 Uses Firebase
- **Line 39-48:** Firebase snapshot for cards
- **Action:** Create card management API and connect
- **Backend:** Need to create `backend/services/card/`
- **Estimated Time:** 4-6 hours (including backend service)

#### 9. `src/components/create-virtual-card-form.tsx`
- **Status:** 🔴 Partial
- **Line 51-92:** Card creation with Firebase
- **Action:** Connect to card service API
- **Estimated Time:** 2 hours

#### 10. `src/components/card-details.tsx`
- **Status:** ✅ UI Component
- **Note:** Display component, wiring happens at parent level

---

### 📊 Dashboard & Analytics

#### 11. `src/app/dashboard/page.tsx`
- **Status:** 🔴 Mixed (Firebase + Missing Imports)
- **Line 30-31:** Missing email service imports
- **Line 101-107:** Incorrect transaction aggregation
- **Action:**
  1. Create email service
  2. Fix transaction calculations
  3. Connect to analytics API
- **Estimated Time:** 4 hours

#### 12. `src/app/dashboard/transactions/page.tsx`
- **Status:** 🔴 Uses Firebase
- **Line 17-26:** Firebase snapshot
- **Action:** Connect to `/api/transaction`
- **Estimated Time:** 2 hours

---

### 💵 Payment Features

#### 13. `src/app/dashboard/payments/page.tsx`
- **Status:** 🔴 Multiple Simulated
- **Line 65-70:** `handleBillPayment` - Simulated
- **Line 184-208:** Bulk transfer - UI only
- **Line 210-223:** Scheduled transfers - Empty
- **Line 225-244:** Split payment - Incomplete
- **Line 246-263:** Gift cards - Placeholder
- **Action:**
  1. Wire bill payments to provider
  2. Implement bulk transfer processing
  3. Create scheduled transfer service
  4. Build split payment logic
  5. Integrate gift card provider
- **Estimated Time:** 20+ hours (complex feature)

---

### 💼 Business Features

#### 14. `src/app/dashboard/business/page.tsx`
- **Status:** 🟢 Uses Firebase (OK for now)
- **Note:** Business profiles can stay in Firebase or migrate later

#### 15. `src/components/create-business-invoice-form.tsx`
- **Status:** 🟡 Partial
- **Missing:** Invoice creation API
- **Action:** Create invoice service and connect
- **Estimated Time:** 3 hours

---

### 🔔 Notifications

#### 16. `src/app/dashboard/notifications/page.tsx`
- **Status:** 🟢 Uses Firebase
- **Note:** Notifications work with Firebase Functions, acceptable

---

### 🛡️ Disputes

#### 17. `src/app/dashboard/dispute/page.tsx`
- **Status:** 🟢 Uses Firebase
- **Action:** Could migrate to backend service for better management
- **Estimated Time:** 4 hours (optional)

#### 18. `src/components/raise-dispute-form.tsx`
- **Status:** 🟡 Partial
- **Action:** Connect to dispute service with evidence upload
- **Estimated Time:** 3 hours

---

### 💰 Investment Features

#### 19. `src/app/dashboard/investment/browse/page.tsx`
- **Status:** 🟡 UI with static data
- **Action:** Connect to investment provider API
- **Estimated Time:** 6 hours

#### 20. `src/app/dashboard/investment/portfolio/page.tsx`
- **Status:** 🔴 Uses Firebase
- **Action:** Create investment service in backend
- **Estimated Time:** 8 hours

#### 21. `src/components/investment/invest-now-modal.tsx`
- **Status:** 🔴 Simulated
- **Line 20-22:** Simulated API call
- **Action:** Connect to investment service
- **Estimated Time:** 3 hours

---

### 💾 Savings

#### 22. `src/app/dashboard/savings/page.tsx`
- **Status:** 🟢 Uses Firebase
- **Note:** Can migrate to backend later for better interest calculation

---

### 🔗 Integrations

#### 23. `src/app/dashboard/integrations/page.tsx`
- **Status:** 🟡 Mock data
- **Action:** Create webhook management API
- **Estimated Time:** 8 hours

---

### 🏪 Terminal/POS

#### 24. `src/app/dashboard/terminal/page.tsx`
- **Status:** 🔴 Coming Soon page
- **Action:** Build entire Terminal feature
- **Estimated Time:** 40+ hours

---

### 🎁 Donations

#### 25. `src/app/donate/[id]/page.tsx`
- **Status:** 🔴 Simulated
- **Line 87-89:** Simulated payment processing
- **Action:** Connect to payment service
- **Estimated Time:** 3 hours

---

### 💸 Payment Links

#### 26. `src/app/pay/[id]/page.tsx`
- **Status:** 🟡 Partial
- **Line 122-144:** Manual payment confirmation
- **Action:** Add backend verification
- **Estimated Time:** 4 hours

---

## Backend Services Needing Frontend Connection

### Service: Wallet (`backend/services/wallet/`)
- **Routes Available:** ✅
- **Frontend Connected:** ❌
- **Priority:** 🔴 Critical
- **Files to Update:**
  - `src/app/dashboard/wallets/page.tsx`
  - `src/components/fund-wallet-dialog.tsx`
  - `src/components/create-wallet-dialog.tsx`

### Service: Transaction (`backend/services/transaction/`)
- **Routes Available:** ✅
- **Frontend Connected:** ❌
- **Priority:** 🔴 Critical
- **Files to Update:**
  - `src/components/Payvost.tsx`
  - `src/app/dashboard/transactions/page.tsx`
  - `src/app/dashboard/payments/page.tsx`

### Service: Payment (`backend/services/payment/`)
- **Routes Available:** ✅
- **Frontend Connected:** ⚠️ Partial
- **Priority:** 🔴 Critical
- **Files to Update:**
  - Payment processing components
  - Checkout flows

### Service: User (`backend/services/user/`)
- **Routes Available:** ✅
- **Frontend Connected:** ❌
- **Priority:** 🟡 Medium
- **Note:** Currently using Firebase Auth + Firestore

### Service: Fraud (`backend/services/fraud/`)
- **Routes Available:** ✅
- **Frontend Connected:** ❌
- **Priority:** 🟡 Medium
- **Action:** Add fraud checks before transactions

### Service: Currency (`backend/services/currency/`)
- **Routes Available:** ✅
- **Frontend Connected:** ❌
- **Priority:** 🔴 Critical
- **Files to Update:**
  - All components with hardcoded exchange rates
  - `src/components/Payvost.tsx`
  - `src/app/dashboard/wallets/page.tsx`

### Service: Notification (`backend/services/notification/`)
- **Routes Available:** ✅
- **Frontend Connected:** ⚠️ Via Firebase
- **Priority:** 🟢 Low
- **Note:** Firebase Functions handle this

---

## API Routes Already in Frontend

### Existing Next.js API Routes (`src/app/api/`)

1. ✅ `/api/dashboard/route.ts` - Dashboard stats
2. ✅ `/api/admin/*` - Admin functionality
3. ✅ `/api/wallets/route.ts` - Wallet proxy to backend
4. ✅ `/api/cards/route.ts` - Cards proxy
5. ✅ `/api/transactions/route.ts` - Transactions proxy
6. ✅ `/api/create-payment-intent/route.ts` - Payment intent creation

**Note:** Some of these proxies exist but aren't being called from frontend components!

---

## Priority Matrix

### 🔴 Critical (Do First - Week 1)
1. Wire `Payvost.tsx` to transaction service
2. Connect wallet pages to wallet service
3. Replace hardcoded exchange rates
4. Fix TypeScript errors
5. Create API service layer

### 🟡 High Priority (Week 2-3)
6. Bill payment integration
7. Card management API
8. Transaction history from backend
9. Email notification service
10. Fraud detection integration

### 🟢 Medium Priority (Week 4-6)
11. Bulk transfer processing
12. Scheduled transfers
13. Split payments
14. Investment features
15. Dispute management backend

### ⚪ Low Priority (Week 7+)
16. Terminal/POS
17. Gift cards
18. Webhook management
19. Advanced analytics
20. Data migration

---

## Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Start backend: `npm run dev:server`
- [ ] Start frontend: `npm run dev:client`
- [ ] Fix TypeScript errors
- [ ] Create `src/services/apiClient.ts`
- [ ] Wire one feature end-to-end
- [ ] Test thoroughly
- [ ] Repeat for remaining features

---

## Testing Each Integration

After wiring each component:

1. ✅ Remove simulation code
2. ✅ Test happy path
3. ✅ Test error scenarios
4. ✅ Test loading states
5. ✅ Verify data persistence
6. ✅ Check error messages
7. ✅ Test authentication
8. ✅ Verify KYC checks
9. ✅ Test with multiple users
10. ✅ Check mobile responsiveness
