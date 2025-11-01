# Integration Partners Quick Reference

This document provides a quick reference for all integration partner endpoints available in the Payvost Web application.

## Accessing Endpoints

All partner endpoints are centralized in `/src/config/integration-partners.ts`:

```typescript
import { 
  RELOADLY, 
  BACKEND_SERVICES, 
  PAYMENT_GATEWAYS,
  // ... other imports
} from '@/config/integration-partners';
```

---

## Reloadly API

### Base URLs
- **Sandbox**: `https://topups-sandbox.reloadly.com`
- **Production**: `https://topups.reloadly.com`
- **Auth**: `https://auth.reloadly.com/oauth/token`

### Airtime Endpoints
```typescript
RELOADLY.AIRTIME.COUNTRIES           // GET /countries
RELOADLY.AIRTIME.OPERATORS           // GET /operators
RELOADLY.AIRTIME.OPERATORS_BY_COUNTRY // GET /operators/countries/{code}
RELOADLY.AIRTIME.AUTO_DETECT         // GET /operators/auto-detect/phone/{number}/countries/{code}
RELOADLY.AIRTIME.FX_RATE             // GET /operators/fx-rate
RELOADLY.AIRTIME.TOPUP               // POST /topups
RELOADLY.AIRTIME.TRANSACTIONS        // GET /topups/reports/transactions
```

### Gift Cards Endpoints
```typescript
RELOADLY.GIFTCARDS.PRODUCTS          // GET /products
RELOADLY.GIFTCARDS.PRODUCT_BY_ID     // GET /products/:productId
RELOADLY.GIFTCARDS.COUNTRIES         // GET /countries
RELOADLY.GIFTCARDS.ORDER             // POST /orders
RELOADLY.GIFTCARDS.ORDER_BY_ID       // GET /orders/:transactionId
RELOADLY.GIFTCARDS.REDEEM_INSTRUCTIONS // GET /orders/:transactionId/cards
```

### Utilities Endpoints
```typescript
RELOADLY.UTILITIES.BILLERS           // GET /billers
RELOADLY.UTILITIES.BILLER_BY_ID      // GET /billers/:billerId
RELOADLY.UTILITIES.BILLERS_BY_COUNTRY // GET /billers/countries/:countryCode
RELOADLY.UTILITIES.BILL_PAYMENT      // POST /pay
RELOADLY.UTILITIES.TRANSACTION       // GET /transactions/:transactionId
RELOADLY.UTILITIES.BALANCE           // GET /accounts/balance
```

---

## Backend Services (Internal)

### Base URL
- **Local**: `http://localhost:3001`
- **Production**: Set via `NEXT_PUBLIC_API_URL`

### Wallet Service
```typescript
BACKEND_SERVICES.WALLET.ACCOUNTS        // GET/POST /api/wallet/accounts
BACKEND_SERVICES.WALLET.ACCOUNT_BY_ID   // GET /api/wallet/accounts/:id
BACKEND_SERVICES.WALLET.FUND            // POST /api/wallet/fund
BACKEND_SERVICES.WALLET.WITHDRAW        // POST /api/wallet/withdraw
BACKEND_SERVICES.WALLET.BALANCE         // GET /api/wallet/balance/:accountId
```

### Transaction Service
```typescript
BACKEND_SERVICES.TRANSACTION.CREATE     // POST /api/transaction/create
BACKEND_SERVICES.TRANSACTION.GET        // GET /api/transaction/:id
BACKEND_SERVICES.TRANSACTION.LIST       // GET /api/transaction
BACKEND_SERVICES.TRANSACTION.USER_TRANSACTIONS  // GET /api/transaction/user
BACKEND_SERVICES.TRANSACTION.UPDATE_STATUS      // PATCH /api/transaction/:id/status
BACKEND_SERVICES.TRANSACTION.CANCEL     // POST /api/transaction/:id/cancel
```

### Currency Service
```typescript
BACKEND_SERVICES.CURRENCY.RATES         // GET /api/currency/rates
BACKEND_SERVICES.CURRENCY.CONVERT       // POST /api/currency/convert
BACKEND_SERVICES.CURRENCY.SUPPORTED     // GET /api/currency/supported
BACKEND_SERVICES.CURRENCY.HISTORY       // GET /api/currency/history
```

### User Service
```typescript
BACKEND_SERVICES.USER.PROFILE           // GET/PUT /api/user/profile
BACKEND_SERVICES.USER.KYC               // POST /api/user/kyc
BACKEND_SERVICES.USER.VERIFY            // POST /api/user/verify
BACKEND_SERVICES.USER.BUSINESS          // GET/POST /api/user/business
```

### Fraud Detection Service
```typescript
BACKEND_SERVICES.FRAUD.CHECK            // POST /api/fraud/check
BACKEND_SERVICES.FRAUD.REPORT           // POST /api/fraud/report
BACKEND_SERVICES.FRAUD.RISK_SCORE       // GET /api/fraud/risk-score/:userId
```

---

## Payment Gateways

### Paystack (Nigeria)
**Base URL**: `https://api.paystack.co`
```typescript
PAYMENT_GATEWAYS.PAYSTACK.INITIALIZE    // POST /transaction/initialize
PAYMENT_GATEWAYS.PAYSTACK.VERIFY        // GET /transaction/verify/:reference
PAYMENT_GATEWAYS.PAYSTACK.BANKS         // GET /bank
PAYMENT_GATEWAYS.PAYSTACK.RESOLVE_ACCOUNT // POST /bank/resolve
PAYMENT_GATEWAYS.PAYSTACK.TRANSFER      // POST /transfer
```

### Flutterwave (Multi-country)
**Base URL**: `https://api.flutterwave.com/v3`
```typescript
PAYMENT_GATEWAYS.FLUTTERWAVE.CHARGE     // POST /charges
PAYMENT_GATEWAYS.FLUTTERWAVE.VERIFY     // GET /transactions/:id/verify
PAYMENT_GATEWAYS.FLUTTERWAVE.BANKS      // GET /banks/:country
PAYMENT_GATEWAYS.FLUTTERWAVE.TRANSFER   // POST /transfers
```

### Stripe (International)
**Base URL**: `https://api.stripe.com/v1`
```typescript
PAYMENT_GATEWAYS.STRIPE.PAYMENT_INTENTS // POST /payment_intents
PAYMENT_GATEWAYS.STRIPE.CHARGES         // POST /charges
PAYMENT_GATEWAYS.STRIPE.CUSTOMERS       // POST /customers
PAYMENT_GATEWAYS.STRIPE.REFUNDS         // POST /refunds
```

### Rapyd (Global Fintech Platform)
**Base URLs**:
- **Sandbox**: `https://sandboxapi.rapyd.net`
- **Production**: `https://api.rapyd.net`

**Payment Methods**
```typescript
PAYMENT_GATEWAYS.RAPYD.PAYMENT_METHODS  // GET /v1/payment_methods/country
PAYMENT_GATEWAYS.RAPYD.REQUIRED_FIELDS  // GET /v1/payment_methods/required_fields/:type
```

**Payments**
```typescript
PAYMENT_GATEWAYS.RAPYD.PAYMENTS         // POST /v1/payments
PAYMENT_GATEWAYS.RAPYD.PAYMENT_BY_ID    // GET /v1/payments/:paymentId
PAYMENT_GATEWAYS.RAPYD.CANCEL_PAYMENT   // DELETE /v1/payments/:paymentId
```

**Customers**
```typescript
PAYMENT_GATEWAYS.RAPYD.CUSTOMERS        // POST /v1/customers
PAYMENT_GATEWAYS.RAPYD.CUSTOMER_BY_ID   // GET /v1/customers/:customerId
```

**Checkout**
```typescript
PAYMENT_GATEWAYS.RAPYD.CHECKOUT         // POST /v1/checkout
PAYMENT_GATEWAYS.RAPYD.CHECKOUT_BY_ID   // GET /v1/checkout/:checkoutId
```

**Virtual Accounts**
```typescript
PAYMENT_GATEWAYS.RAPYD.VIRTUAL_ACCOUNTS // POST /v1/virtual_accounts
PAYMENT_GATEWAYS.RAPYD.VIRTUAL_ACCOUNT_BY_ID // GET /v1/virtual_accounts/:virtualAccountId
```

**Payouts**
```typescript
PAYMENT_GATEWAYS.RAPYD.PAYOUTS          // POST /v1/payouts
PAYMENT_GATEWAYS.RAPYD.PAYOUT_BY_ID     // GET /v1/payouts/:payoutId
PAYMENT_GATEWAYS.RAPYD.BENEFICIARIES    // POST /v1/payouts/beneficiary
PAYMENT_GATEWAYS.RAPYD.SENDER           // POST /v1/payouts/sender
```

**Wallets**
```typescript
PAYMENT_GATEWAYS.RAPYD.WALLETS          // POST /v1/user
PAYMENT_GATEWAYS.RAPYD.WALLET_BY_ID     // GET /v1/user/:walletId
PAYMENT_GATEWAYS.RAPYD.TRANSFER_BETWEEN_WALLETS // POST /v1/account/transfer
```

**Card Issuing**
```typescript
PAYMENT_GATEWAYS.RAPYD.ISSUED_CARDS     // POST /v1/issuing/cards
PAYMENT_GATEWAYS.RAPYD.CARD_BY_ID       // GET /v1/issuing/cards/:cardId
```

**FX Rates**
```typescript
PAYMENT_GATEWAYS.RAPYD.RATES            // GET /v1/rates/daily
```

---

## KYC/Verification

### Smile Identity
**Base URL**: `https://api.smileidentity.com/v1`
```typescript
KYC_PROVIDERS.SMILE_ID.ID_VERIFICATION  // POST /id_verification
KYC_PROVIDERS.SMILE_ID.DOCUMENT_VERIFICATION // POST /document_verification
KYC_PROVIDERS.SMILE_ID.BIOMETRIC        // POST /biometric_kyc
```

### Onfido
**Base URL**: `https://api.onfido.com/v3`
```typescript
KYC_PROVIDERS.ONFIDO.APPLICANTS         // POST /applicants
KYC_PROVIDERS.ONFIDO.DOCUMENTS          // POST /documents
KYC_PROVIDERS.ONFIDO.CHECKS             // POST /checks
KYC_PROVIDERS.ONFIDO.REPORTS            // GET /reports
```

---

## Communication Services

### Email - SendGrid
**Base URL**: `https://api.sendgrid.com/v3`
```typescript
EMAIL_PROVIDERS.SENDGRID.SEND           // POST /mail/send
EMAIL_PROVIDERS.SENDGRID.TEMPLATES      // GET /templates
```

### SMS - Twilio
**Base URL**: `https://api.twilio.com/2010-04-01`
```typescript
SMS_PROVIDERS.TWILIO.MESSAGES           // POST /Accounts/:accountSid/Messages.json
SMS_PROVIDERS.TWILIO.VERIFY             // POST /Verify/Services/:serviceSid/Verifications
```

### SMS - Africa's Talking
**Base URL**: `https://api.africastalking.com/version1`
```typescript
SMS_PROVIDERS.AFRICAS_TALKING.SMS       // POST /messaging
SMS_PROVIDERS.AFRICAS_TALKING.AIRTIME   // POST /airtime/send
```

### Push Notifications - OneSignal
**Base URL**: `https://onesignal.com/api/v1`
```typescript
PUSH_NOTIFICATION.ONESIGNAL.NOTIFICATIONS // POST /notifications
PUSH_NOTIFICATION.ONESIGNAL.PLAYERS     // POST /players
PUSH_NOTIFICATION.ONESIGNAL.SEGMENTS    // GET /segments
```

---

## Exchange Rates

### Fixer.io
**Base URL**: `https://api.fixer.io`
```typescript
EXCHANGE_RATE_PROVIDERS.FIXER.LATEST    // GET /latest
EXCHANGE_RATE_PROVIDERS.FIXER.HISTORICAL // GET /:date
EXCHANGE_RATE_PROVIDERS.FIXER.CONVERT   // GET /convert
```

### ExchangeRate-API
**Base URL**: `https://v6.exchangerate-api.com/v6`
```typescript
EXCHANGE_RATE_PROVIDERS.EXCHANGERATE_API.LATEST // GET /:apiKey/latest/:base
EXCHANGE_RATE_PROVIDERS.EXCHANGERATE_API.PAIR   // GET /:apiKey/pair/:from/:to
```

### Open Exchange Rates
**Base URL**: `https://openexchangerates.org/api`
```typescript
EXCHANGE_RATE_PROVIDERS.OPEN_EXCHANGE.LATEST    // GET /latest.json
EXCHANGE_RATE_PROVIDERS.OPEN_EXCHANGE.HISTORICAL // GET /historical/:date.json
EXCHANGE_RATE_PROVIDERS.OPEN_EXCHANGE.CURRENCIES // GET /currencies.json
```

---

## Compliance

### ComplyAdvantage
**Base URL**: `https://api.complyadvantage.com`
```typescript
COMPLIANCE.COMPLY_ADVANTAGE.SEARCHES    // POST /searches
COMPLIANCE.COMPLY_ADVANTAGE.MONITORING  // POST /monitoring
COMPLIANCE.COMPLY_ADVANTAGE.ALERTS      // GET /alerts
```

---

## Helper Functions

### Get Reloadly Base URL
```typescript
import { getReloadlyBaseUrl } from '@/config/integration-partners';

// Returns sandbox or production URL based on RELOADLY_ENV
const airtimeUrl = getReloadlyBaseUrl('airtime');
const giftcardsUrl = getReloadlyBaseUrl('giftcards');
const utilitiesUrl = getReloadlyBaseUrl('utilities');
```

### Get Rapyd Base URL
```typescript
import { getRapydBaseUrl } from '@/config/integration-partners';

// Returns sandbox or production URL based on RAPYD_ENV
const rapydUrl = getRapydBaseUrl();
```

### Replace URL Parameters
```typescript
import { replaceUrlParams } from '@/config/integration-partners';

const url = replaceUrlParams('/api/transaction/:id/status', {
  id: '12345'
});
// Result: '/api/transaction/12345/status'
```

---

## Environment Variables Quick Reference

Copy these from `.env.example` to your `.env.local` file:

```bash
# Reloadly
RELOADLY_CLIENT_ID=your_client_id
RELOADLY_CLIENT_SECRET=your_client_secret
RELOADLY_WEBHOOK_SECRET=your_webhook_secret
RELOADLY_ENV=sandbox

# Rapyd
RAPYD_ACCESS_KEY=your_access_key
RAPYD_SECRET_KEY=your_secret_key
RAPYD_ENV=sandbox

# Backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Payment Gateways
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_key
PAYSTACK_SECRET_KEY=your_secret
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key

# Email
SENDGRID_API_KEY=your_key

# SMS
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Push Notifications
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id

# Exchange Rates
EXCHANGE_RATE_API_KEY=your_key
```

---

## Usage Examples

### Making API Calls

```typescript
import { apiClient } from '@/services';
import { BACKEND_SERVICES, replaceUrlParams } from '@/config/integration-partners';

// Get wallet accounts
const accounts = await apiClient.get(BACKEND_SERVICES.WALLET.ACCOUNTS);

// Get specific transaction
const url = replaceUrlParams(BACKEND_SERVICES.TRANSACTION.GET, { id: '123' });
const transaction = await apiClient.get(url);

// Create transaction
const result = await apiClient.post(
  BACKEND_SERVICES.TRANSACTION.CREATE,
  { amount: 100, currency: 'USD' }
);
```

### Using Reloadly Service

```typescript
import { reloadlyService } from '@/services';

// The service handles authentication and base URLs automatically
const operators = await reloadlyService.getOperatorsByCountry('NG');
const topup = await reloadlyService.sendTopup({...});
const giftCards = await reloadlyService.getGiftCardProducts('US');
```

### Using Rapyd Service

```typescript
import { rapydService } from '@/services';

// The service handles HMAC signature authentication automatically
const paymentMethods = await rapydService.getPaymentMethodsByCountry('US');
const payment = await rapydService.createPayment({
  amount: 100,
  currency: 'USD',
  payment_method: 'us_debit_visa_card'
});
const wallet = await rapydService.createWallet({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```
```

---

## Related Documentation

- **Main Documentation**: See `/docs/RELOADLY_INTEGRATION.md` for detailed Reloadly integration guide
- **API Service Layer**: See `/src/services/apiClient.ts` for HTTP client documentation
- **Environment Setup**: See `/.env.example` for all available environment variables
