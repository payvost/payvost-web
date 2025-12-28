/**
 * Services Index
 * 
 * Central export point for all service modules.
 */

// API Client
export { apiClient, ApiError } from './apiClient';
export type { default as ApiClient } from './apiClient';

// Wallet Service
export { walletService, WalletServiceError } from './walletService';
export type {
  Account,
  CreateAccountDto,
  FundAccountDto,
  WithdrawDto,
} from './walletService';

// Transaction Service
export { transactionService } from './transactionService';
export type {
  Transaction,
  TransactionType,
  TransactionStatus,
  CreateTransactionDto,
  TransactionListParams,
} from './transactionService';

// Currency Service
export { currencyService } from './currencyService';
export type {
  ExchangeRate,
  ConversionResult,
} from './currencyService';

// Email Service (existing) - Server-side only, import directly from './emailService' in API routes
// export * from './emailService';

// Notification Service (existing) - Server-side only, import directly from './notificationService' in API routes
// export * from './notificationService';

// Reloadly Service
export { reloadlyService, ReloadlyError } from './reloadlyService';
export type {
  Operator,
  TopupRequest,
  TopupResponse,
  GiftCardProduct,
  GiftCardOrderRequest,
  GiftCardOrderResponse,
  Biller,
  BillPaymentRequest,
  BillPaymentResponse,
} from './reloadlyService';

// Rapyd Service
export { rapydService, RapydError } from './rapydService';
export type {
  PaymentMethod,
  CreatePaymentRequest,
  Payment,
  CreateCustomerRequest,
  Customer,
  CreatePayoutRequest,
  Payout,
  CreateVirtualAccountRequest,
  VirtualAccount,
  CreateWalletRequest,
  Wallet,
} from './rapydService';

// External Transaction Service
export { externalTransactionService } from './externalTransactionService';
export type {
  ExternalProvider,
  ExternalTransactionType,
  ExternalTransactionStatus,
  CreateExternalTransactionDto,
  UpdateExternalTransactionDto,
} from './externalTransactionService';

// User Service
export { userService } from './userService';
export type { UserProfile } from './userService';

// Recipient Service
export { recipientService } from './recipientService';
export type {
  Recipient,
  CreateRecipientDto,
} from './recipientService';