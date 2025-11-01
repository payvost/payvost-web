# Quick Wiring Guide - Payvost Web

## 🚀 Top 5 Critical Items to Wire Up

### 1. Money Transfer (Payvost.tsx)
**File:** `src/components/Payvost.tsx`
**Line:** 108-113

**Current:**
```typescript
const handleSendMoney = async () => {
  setIsLoading(true);
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000));
  setIsLoading(false);
};
```

**Wire to:** Backend Transaction Service (`/api/transaction/create`)

---

### 2. Bill Payments
**File:** `src/app/dashboard/payments/page.tsx`
**Line:** 65-70

**Current:**
```typescript
const handleBillPayment = async () => {
  setIsLoading(true);
  // Simulate API call for bill payment
  await new Promise(resolve => setTimeout(resolve, 2000));
  setIsLoading(false);
};
```

**Wire to:** Create bill payment service or extend payment service

---

### 3. Wallet Operations
**File:** `src/app/dashboard/wallets/page.tsx`
**Line:** 63-72

**Current:**
```typescript
const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
  if (doc.exists()) {
    const userData = doc.data();
    setWallets(userData.wallets || []);
    // ...
  }
});
```

**Wire to:** Backend Wallet Service (`/api/wallet/accounts`)

---

### 4. Virtual Cards
**File:** `src/app/dashboard/cards/page.tsx`
**Line:** 39-48

**Current:**
```typescript
const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
  if (doc.exists()) {
    const data = doc.data();
    setCards(data.cards || []);
    setIsKycVerified(data.kycStatus === 'Verified');
  }
});
```

**Wire to:** Create card service endpoint

---

### 5. Currency Exchange Rates
**Files:** Multiple (Payvost.tsx, wallets/page.tsx, etc.)

**Current:**
```typescript
const exchangeRates: Record<string, Record<string, number>> = {
  USD: { NGN: 1450.5, GHS: 14.5, KES: 130.25 },
  EUR: { NGN: 1600.2, GHS: 16.0, KES: 143.5 },
  // Hardcoded rates
};
```

**Wire to:** Backend Currency Service (`/api/currency/rates`) or external API

---

## 📋 Form Handlers Needing Submit Logic

### Send to Bank Form
**File:** `src/components/send-to-bank-form.tsx`
**Status:** ❌ No submission handler
**Action:** Add form onSubmit, connect to transaction API

### Send to User Form
**File:** `src/components/send-to-user-form.tsx`
**Status:** ❌ No submission handler
**Action:** Add form onSubmit, lookup user, create P2P transfer

---

## 🐛 Quick Fixes for TypeScript Errors

### 1. Email Service Imports
**File:** `src/app/dashboard/page.tsx`
**Lines:** 30-31
**Error:** Module has no exported members
**Fix:** Create `src/services/emailService.ts` or remove imports

### 2. Profile Page setValue
**File:** `src/app/dashboard/profile/page.tsx`
**Line:** 307
**Error:** Cannot find name 'setValue'
**Fix:** Import from react-hook-form: `const { setValue } = useForm();`

### 3. Request Payment setRequest
**File:** `src/app/dashboard/request-payment/[id]/page.tsx`
**Line:** 51
**Error:** Cannot find name 'setRequest'
**Fix:** Add state: `const [request, setRequest] = useState(null);`

---

## 🔌 Backend Services Ready to Connect

| Service | Endpoint Base | Status | Frontend Uses |
|---------|---------------|--------|---------------|
| Wallet | `/api/wallet` | ✅ Ready | ❌ Firebase instead |
| Transaction | `/api/transaction` | ✅ Ready | ❌ Firebase instead |
| Payment | `/api/payment` | ✅ Ready | ❌ Simulated |
| User | `/api/user` | ✅ Ready | ❌ Firebase instead |
| Fraud | `/api/fraud` | ✅ Ready | ❌ Not used |
| Currency | `/api/currency` | ✅ Ready | ❌ Hardcoded |
| Notification | `/api/notification` | ✅ Ready | ❌ Not used |

---

## 🎯 One-Day Quick Win Tasks

### Task 1: Create API Service Layer (2-3 hours)
Create `src/services/apiClient.ts` with base HTTP client

### Task 2: Wire Up Wallet List (1-2 hours)
Replace Firebase snapshot with `/api/wallet/accounts` call

### Task 3: Fix TypeScript Errors (1 hour)
Fix the 4-5 critical TS errors blocking builds

### Task 4: Add Real Currency Rates (2 hours)
Integrate with ExchangeRate-API or similar service

### Task 5: Connect One Payment Flow (3-4 hours)
Wire either transfer or bill payment to backend

---

## 📝 Example: Quick API Integration

### Step 1: Create API Client
```typescript
// src/services/apiClient.ts
export const apiClient = {
  async post(endpoint: string, data: any) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }
};
```

### Step 2: Replace Simulated Call
```typescript
// Before
const handleSendMoney = async () => {
  setIsLoading(true);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  setIsLoading(false);
};

// After
const handleSendMoney = async () => {
  setIsLoading(true);
  try {
    await apiClient.post('/api/transaction/create', {
      fromAccountId: wallets[0].id,
      toBeneficiaryId: selectedBeneficiary,
      amount: parseFloat(sendAmount),
      currency: fromWallet,
    });
    toast.success('Transfer successful!');
  } catch (error) {
    toast.error('Transfer failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🔍 Quick Verification Checklist

After wiring each feature:

- [ ] Remove simulation code
- [ ] Add proper error handling
- [ ] Add loading states
- [ ] Add success/error toasts
- [ ] Update TypeScript types
- [ ] Test with real backend
- [ ] Handle edge cases
- [ ] Add proper logging

---

## 📞 Support

For questions about wiring up features:
1. Check backend service README in `backend/services/{service}/`
2. Review API gateway in `backend/gateway/`
3. Check Prisma schema in `backend/prisma/schema.prisma`
4. Review existing API routes in `src/app/api/`
