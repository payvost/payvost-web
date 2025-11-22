/**
 * Integration Partners Configuration
 * 
 * Centralized configuration for all external service providers and APIs.
 * This file contains endpoint URLs, API versions, and integration metadata
 * for all partners integrated with Payvost.
 * 
 * @note Credentials should be stored in environment variables, not here
 */

/**
 * Reloadly API Configuration
 * Services: Airtime, Data Bundles, Gift Cards, Utility Bills
 * Documentation: https://docs.reloadly.com/
 */
export const RELOADLY = {
  // Base URLs
  SANDBOX_BASE_URL: 'https://topups-sandbox.reloadly.com',
  PRODUCTION_BASE_URL: 'https://topups.reloadly.com',
  
  GIFTCARDS_SANDBOX_URL: 'https://giftcards-sandbox.reloadly.com',
  GIFTCARDS_PRODUCTION_URL: 'https://giftcards.reloadly.com',
  
  UTILITIES_SANDBOX_URL: 'https://utilities-sandbox.reloadly.com',
  UTILITIES_PRODUCTION_URL: 'https://utilities.reloadly.com',
  
  // Authentication
  AUTH_URL: 'https://auth.reloadly.com/oauth/token',
  
  // Airtime & Data Endpoints
  AIRTIME: {
    COUNTRIES: '/countries',
    OPERATORS: '/operators',
    OPERATORS_BY_COUNTRY: '/operators/countries',
    AUTO_DETECT: '/operators/auto-detect/phone',
    FX_RATE: '/operators/fx-rate',
    TOPUP: '/topups',
    TOPUP_ASYNC: '/topups/async',
    TRANSACTIONS: '/topups/reports/transactions',
  },
  
  // Gift Cards Endpoints
  GIFTCARDS: {
    PRODUCTS: '/products',
    PRODUCT_BY_ID: '/products/:productId',
    COUNTRIES: '/countries',
    DISCOUNT: '/products/:productId/discounts',
    ORDER: '/orders',
    ORDER_BY_ID: '/orders/:transactionId',
    REDEEM_INSTRUCTIONS: '/orders/:transactionId/cards',
  },
  
  // Utilities Bills Endpoints
  UTILITIES: {
    BILLERS: '/billers',
    BILLER_BY_ID: '/billers/:billerId',
    BILLERS_BY_COUNTRY: '/billers/:countryCode',
    BILL_PAYMENT: '/pay',
    TRANSACTION: '/transactions/:transactionId',
    BALANCE: '/accounts/balance',
  },
  
  // Webhook Events
  WEBHOOKS: {
    TOPUP_SUCCESS: 'topup.success',
    TOPUP_FAILED: 'topup.failed',
    GIFTCARD_ORDER_SUCCESS: 'giftcard.order.success',
    GIFTCARD_ORDER_FAILED: 'giftcard.order.failed',
    BILL_PAYMENT_SUCCESS: 'bill.payment.success',
    BILL_PAYMENT_FAILED: 'bill.payment.failed',
  },
} as const;

/**
 * Backend Internal Services
 * Microservices architecture endpoints
 */
export const BACKEND_SERVICES = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Wallet Service
  WALLET: {
    ACCOUNTS: '/api/wallet/accounts',
    ACCOUNT_BY_ID: '/api/wallet/accounts/:id',
    FUND: '/api/wallet/fund',
    WITHDRAW: '/api/wallet/withdraw',
    BALANCE: '/api/wallet/balance/:accountId',
  },
  
  // Transaction Service
  TRANSACTION: {
    CREATE: '/api/transaction/create',
    GET: '/api/transaction/:id',
    LIST: '/api/transaction',
    USER_TRANSACTIONS: '/api/transaction/user',
    UPDATE_STATUS: '/api/transaction/:id/status',
    CANCEL: '/api/transaction/:id/cancel',
  },
  
  // Currency Service
  CURRENCY: {
    RATES: '/api/currency/rates',
    CONVERT: '/api/currency/convert',
    SUPPORTED: '/api/currency/supported',
    HISTORY: '/api/currency/history',
  },
  
  // User Service
  USER: {
    PROFILE: '/api/user/profile',
    KYC: '/api/user/kyc',
    VERIFY: '/api/user/verify',
    BUSINESS: '/api/user/business',
  },
  
  // Fraud Detection Service
  FRAUD: {
    CHECK: '/api/fraud/check',
    REPORT: '/api/fraud/report',
    RISK_SCORE: '/api/fraud/risk-score/:userId',
  },
  
  // Payment Service
  PAYMENT: {
    INITIATE: '/api/payment/initiate',
    VERIFY: '/api/payment/verify',
    WEBHOOKS: '/api/payment/webhooks',
  },
  
  // Notification Service
  NOTIFICATION: {
    SEND: '/api/notification/send',
    PREFERENCES: '/api/notification/preferences',
    HISTORY: '/api/notification/history',
  },
} as const;

/**
 * Firebase Services
 * Authentication, Cloud Functions, Firestore
 */
export const FIREBASE = {
  // Cloud Functions
  FUNCTIONS: {
    SEND_EMAIL: 'sendEmail',
    SEND_VERIFICATION: 'sendVerificationEmail',
    SEND_BUSINESS_APPROVAL: 'sendBusinessApprovalEmail',
    SEND_TRANSACTION_NOTIFICATION: 'sendTransactionNotification',
    PROCESS_DISPUTE: 'processDispute',
  },
  
  // Firestore Collections
  COLLECTIONS: {
    USERS: 'users',
    TRANSACTIONS: 'transactions',
    WALLETS: 'wallets',
    NOTIFICATIONS: 'notifications',
    KYC: 'kyc',
    DISPUTES: 'disputes',
  },
} as const;

/**
 * Payment Gateway Providers
 * Card processing, bank transfers, mobile money
 */
export const PAYMENT_GATEWAYS = {
  // Paystack (Nigerian payments)
  PAYSTACK: {
    BASE_URL: 'https://api.paystack.co',
    INITIALIZE: '/transaction/initialize',
    VERIFY: '/transaction/verify/:reference',
    BANKS: '/bank',
    RESOLVE_ACCOUNT: '/bank/resolve',
    TRANSFER: '/transfer',
  },
  
  // Flutterwave (Multi-country)
  FLUTTERWAVE: {
    BASE_URL: 'https://api.flutterwave.com/v3',
    CHARGE: '/charges',
    VERIFY: '/transactions/:id/verify',
    BANKS: '/banks/:country',
    TRANSFER: '/transfers',
  },
  
  // Stripe (International)
  STRIPE: {
    BASE_URL: 'https://api.stripe.com/v1',
    PAYMENT_INTENTS: '/payment_intents',
    CHARGES: '/charges',
    CUSTOMERS: '/customers',
    REFUNDS: '/refunds',
  },
  
  // Rapyd (Global fintech platform)
  RAPYD: {
    SANDBOX_BASE_URL: 'https://sandboxapi.rapyd.net',
    PRODUCTION_BASE_URL: 'https://api.rapyd.net',
    
    // Payment Methods
    PAYMENT_METHODS: '/v1/payment_methods/country',
    REQUIRED_FIELDS: '/v1/payment_methods/required_fields/:type',
    
    // Payments
    PAYMENTS: '/v1/payments',
    PAYMENT_BY_ID: '/v1/payments/:paymentId',
    CANCEL_PAYMENT: '/v1/payments/:paymentId',
    
    // Customers
    CUSTOMERS: '/v1/customers',
    CUSTOMER_BY_ID: '/v1/customers/:customerId',
    
    // Checkout
    CHECKOUT: '/v1/checkout',
    CHECKOUT_BY_ID: '/v1/checkout/:checkoutId',
    
    // Virtual Accounts (Collect)
    VIRTUAL_ACCOUNTS: '/v1/virtual_accounts',
    VIRTUAL_ACCOUNT_BY_ID: '/v1/virtual_accounts/:virtualAccountId',
    SIMULATE_BANK_TRANSFER: '/v1/virtual_accounts/transactions',
    
    // Payouts (Disburse)
    PAYOUTS: '/v1/payouts',
    PAYOUT_BY_ID: '/v1/payouts/:payoutId',
    BENEFICIARIES: '/v1/payouts/beneficiary',
    BENEFICIARY_BY_ID: '/v1/payouts/beneficiary/:beneficiaryId',
    SENDER: '/v1/payouts/sender',
    
    // Wallets
    WALLETS: '/v1/user',
    WALLET_BY_ID: '/v1/user/:walletId',
    WALLET_CONTACTS: '/v1/user/:walletId/contacts',
    WALLET_TRANSACTIONS: '/v1/user/:walletId/transactions',
    TRANSFER_BETWEEN_WALLETS: '/v1/account/transfer',
    SET_FUNDS_TRANSFER: '/v1/account/transfer/response',
    
    // Card Issuing
    ISSUED_CARDS: '/v1/issuing/cards',
    CARD_BY_ID: '/v1/issuing/cards/:cardId',
    ACTIVATE_CARD: '/v1/issuing/cards/:cardId/activate',
    
    // FX
    RATES: '/v1/rates/daily',
    
    // Webhooks
    WEBHOOKS: '/v1/webhooks',
    WEBHOOK_BY_ID: '/v1/webhooks/:webhookId',
    
    // Webhook Event Types
    WEBHOOK_EVENTS: {
      PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
      PAYMENT_FAILED: 'PAYMENT_FAILED',
      PAYOUT_COMPLETED: 'PAYOUT_COMPLETED',
      PAYOUT_FAILED: 'PAYOUT_FAILED',
      TRANSFER_COMPLETED: 'TRANSFER_COMPLETED',
      VIRTUAL_ACCOUNT_DEPOSIT: 'CREATED_VIRTUAL_ACCOUNT_TRANSACTION',
    },
  },
} as const;

/**
 * KYC/Verification Providers
 */
export const KYC_PROVIDERS = {
  // Smile Identity
  SMILE_ID: {
    BASE_URL: 'https://api.smileidentity.com/v1',
    ID_VERIFICATION: '/id_verification',
    DOCUMENT_VERIFICATION: '/document_verification',
    BIOMETRIC: '/biometric_kyc',
  },
  
  // Onfido
  ONFIDO: {
    BASE_URL: 'https://api.onfido.com/v3',
    APPLICANTS: '/applicants',
    DOCUMENTS: '/documents',
    CHECKS: '/checks',
    REPORTS: '/reports',
  },
} as const;

/**
 * Email Service Providers
 */
export const EMAIL_PROVIDERS = {
  // SendGrid
  SENDGRID: {
    BASE_URL: 'https://api.sendgrid.com/v3',
    SEND: '/mail/send',
    TEMPLATES: '/templates',
  },
  
  // AWS SES
  AWS_SES: {
    REGIONS: {
      US_EAST_1: 'email.us-east-1.amazonaws.com',
      EU_WEST_1: 'email.eu-west-1.amazonaws.com',
    },
  },
} as const;

/**
 * SMS/Communication Providers
 */
export const SMS_PROVIDERS = {
  // Twilio
  TWILIO: {
    BASE_URL: 'https://api.twilio.com/2010-04-01',
    MESSAGES: '/Accounts/:accountSid/Messages.json',
    VERIFY: '/Verify/Services/:serviceSid/Verifications',
  },
  
  // Africa's Talking
  AFRICAS_TALKING: {
    BASE_URL: 'https://api.africastalking.com/version1',
    SMS: '/messaging',
    AIRTIME: '/airtime/send',
  },
} as const;

/**
 * Push Notification Services
 */
export const PUSH_NOTIFICATION = {
  // Firebase Cloud Messaging
  FCM: {
    BASE_URL: 'https://fcm.googleapis.com/fcm',
    SEND: '/send',
    TOPIC: '/topics/:topic',
  },
} as const;

/**
 * Exchange Rate Providers
 */
export const EXCHANGE_RATE_PROVIDERS = {
  // Fixer.io
  FIXER: {
    BASE_URL: 'https://api.fixer.io',
    LATEST: '/latest',
    HISTORICAL: '/:date',
    CONVERT: '/convert',
  },
  
  // ExchangeRate-API
  EXCHANGERATE_API: {
    BASE_URL: 'https://v6.exchangerate-api.com/v6',
    LATEST: '/:apiKey/latest/:base',
    PAIR: '/:apiKey/pair/:from/:to',
  },
  
  // Open Exchange Rates
  OPEN_EXCHANGE: {
    BASE_URL: 'https://openexchangerates.org/api',
    LATEST: '/latest.json',
    HISTORICAL: '/historical/:date.json',
    CURRENCIES: '/currencies.json',
  },
} as const;

/**
 * Compliance & AML Services
 */
export const COMPLIANCE = {
  // ComplyAdvantage
  COMPLY_ADVANTAGE: {
    BASE_URL: 'https://api.complyadvantage.com',
    SEARCHES: '/searches',
    MONITORING: '/monitoring',
    ALERTS: '/alerts',
  },
} as const;

/**
 * Analytics & Monitoring
 */
export const ANALYTICS = {
  // Google Analytics
  GOOGLE_ANALYTICS: {
    MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
  
  // Mixpanel
  MIXPANEL: {
    BASE_URL: 'https://api.mixpanel.com',
    TRACK: '/track',
    ENGAGE: '/engage',
  },
} as const;

/**
 * Environment Configuration
 */
export const ENV_VARIABLES = {
  // Reloadly
  RELOADLY_CLIENT_ID: process.env.RELOADLY_CLIENT_ID,
  RELOADLY_CLIENT_SECRET: process.env.RELOADLY_CLIENT_SECRET,
  RELOADLY_WEBHOOK_SECRET: process.env.RELOADLY_WEBHOOK_SECRET,
  RELOADLY_ENV: process.env.RELOADLY_ENV || 'sandbox', // 'sandbox' | 'production'
  
  // Backend
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  
  // Firebase
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  
  // Payment Gateways
  PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  
  // Rapyd
  RAPYD_ACCESS_KEY: process.env.RAPYD_ACCESS_KEY,
  RAPYD_SECRET_KEY: process.env.RAPYD_SECRET_KEY,
  RAPYD_ENV: process.env.RAPYD_ENV || 'sandbox', // 'sandbox' | 'production'
  
  // Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  
  // SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  
  // Push Notifications (FCM)
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
  FCM_VAPID_KEY: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
  
  // Exchange Rates
  EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
  
  // KYC Verification Providers
  // Sumsub - Free tier: 100 verifications/month
  // Sign up: https://sumsub.com
  SUMSUB_SECRET_KEY: process.env.SUMSUB_SECRET_KEY,
  SUMSUB_APP_TOKEN: process.env.SUMSUB_APP_TOKEN,
  SUMSUB_API_URL: process.env.SUMSUB_API_URL || 'https://api.sumsub.com',
  
  // Dojah - Free tier available for African countries
  // Sign up: https://dojah.io
  DOJAH_API_KEY: process.env.DOJAH_API_KEY,
  DOJAH_APP_ID: process.env.DOJAH_APP_ID,
  DOJAH_API_URL: process.env.DOJAH_API_URL || 'https://api.dojah.io',
  
  // ComplyAdvantage - Free tier for AML screening
  // Sign up: https://complyadvantage.com
  COMPLYADVANTAGE_API_KEY: process.env.COMPLYADVANTAGE_API_KEY,
  COMPLYADVANTAGE_API_URL: process.env.COMPLYADVANTAGE_API_URL || 'https://api.complyadvantage.com',
  
  // Twilio Verify - For phone OTP verification
  // Free tier: $15.50 credit for new accounts
  // Sign up: https://twilio.com
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,
} as const;

/**
 * Helper function to get the appropriate base URL based on environment
 */
export function getReloadlyBaseUrl(service: 'airtime' | 'giftcards' | 'utilities'): string {
  const isProduction = ENV_VARIABLES.RELOADLY_ENV === 'production';
  
  switch (service) {
    case 'airtime':
      return isProduction ? RELOADLY.PRODUCTION_BASE_URL : RELOADLY.SANDBOX_BASE_URL;
    case 'giftcards':
      return isProduction ? RELOADLY.GIFTCARDS_PRODUCTION_URL : RELOADLY.GIFTCARDS_SANDBOX_URL;
    case 'utilities':
      return isProduction ? RELOADLY.UTILITIES_PRODUCTION_URL : RELOADLY.UTILITIES_SANDBOX_URL;
    default:
      return RELOADLY.SANDBOX_BASE_URL;
  }
}

/**
 * Helper function to get Rapyd base URL based on environment
 */
export function getRapydBaseUrl(): string {
  const isProduction = ENV_VARIABLES.RAPYD_ENV === 'production';
  return isProduction ? PAYMENT_GATEWAYS.RAPYD.PRODUCTION_BASE_URL : PAYMENT_GATEWAYS.RAPYD.SANDBOX_BASE_URL;
}

/**
 * Helper function to replace URL parameters
 */
export function replaceUrlParams(url: string, params: Record<string, string>): string {
  let result = url;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, encodeURIComponent(value));
  });
  return result;
}

export default {
  RELOADLY,
  BACKEND_SERVICES,
  FIREBASE,
  PAYMENT_GATEWAYS,
  KYC_PROVIDERS,
  EMAIL_PROVIDERS,
  SMS_PROVIDERS,
  PUSH_NOTIFICATION,
  EXCHANGE_RATE_PROVIDERS,
  COMPLIANCE,
  ANALYTICS,
  ENV_VARIABLES,
  getReloadlyBaseUrl,
  getRapydBaseUrl,
  replaceUrlParams,
};
