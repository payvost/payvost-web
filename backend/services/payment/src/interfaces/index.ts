export interface PaymentProvider {
  name: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  minimumAmount: { [currency: string]: number };
  maximumAmount: { [currency: string]: number };
  
  createPaymentIntent(request: PaymentRequestDTO): Promise<PaymentIntent>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
  validatePaymentMethod(method: PaymentMethod): Promise<ValidationResult>;
  getRequiredFields(): string[];
}

export interface PaymentRequestDTO {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  idempotencyKey: string;
  returnUrl?: string;
  sourceCountry: string;
  destinationCountry: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  clientSecret?: string;
  provider: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
  COMPLETED = "COMPLETED"
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  SEPA = 'SEPA',
  FEDNOW = 'FEDNOW',
  WALLET = 'WALLET'
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN' | string;

export interface RefundResult {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  createdAt: Date;
  paymentIntentId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}