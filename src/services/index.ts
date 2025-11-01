/**
 * Services Index
 * 
 * Central export point for all service modules.
 */

// API Client
export { apiClient, ApiError } from './apiClient';
export type { default as ApiClient } from './apiClient';

// Wallet Service
export { walletService } from './walletService';
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

// Email Service (existing)
export * from './emailService';

// Notification Service (existing)
export * from './notificationService';

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
