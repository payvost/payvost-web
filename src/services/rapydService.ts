/**
 * Rapyd Service
 * 
 * Service for integrating with Rapyd API
 * Services: Payments, Payouts, Virtual Accounts, Wallets, Card Issuing
 * Documentation: https://docs.rapyd.net/
 */

import { createHmac } from 'crypto';
import { PAYMENT_GATEWAYS, ENV_VARIABLES, getRapydBaseUrl, replaceUrlParams } from '@/config/integration-partners';

/**
 * Rapyd API Error
 */
export class RapydError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'RapydError';
  }
}

/**
 * Payment types
 */
export interface PaymentMethod {
  type: string;
  name: string;
  category: string;
  image: string;
  country: string;
  payment_flow_type: string;
  currencies: string[];
  status: number;
  is_restricted: boolean;
  minimum_expiration_seconds?: number;
  maximum_expiration_seconds?: number;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  payment_method: string;
  description?: string;
  customer?: string;
  metadata?: Record<string, any>;
  complete_payment_url?: string;
  error_payment_url?: string;
  ewallets?: Array<{
    ewallet: string;
    percentage?: number;
    amount?: number;
  }>;
}

export interface Payment {
  id: string;
  amount: number;
  original_amount: number;
  currency_code: string;
  country_code: string;
  status: string;
  description: string;
  merchant_reference_id: string;
  customer_token: string;
  payment_method: string;
  payment_method_data: any;
  expiration: number;
  captured: boolean;
  refunded: boolean;
  refunded_amount: number;
  receipt_email: string;
  redirect_url: string;
  complete_payment_url: string;
  error_payment_url: string;
  receipt_number: string;
  flow_type: string;
  address: any;
  statement_descriptor: string;
  transaction_id: string;
  created_at: number;
  metadata: Record<string, any>;
  failure_code: string;
  failure_message: string;
  paid: boolean;
  paid_at: number;
  dispute: any;
  refunds: any;
  order: any;
  outcome: any;
  visual_codes: any;
  textual_codes: any;
  instructions: any;
  ewallet_id: string;
  ewallets: any[];
  payment_method_options: any;
  next_action: string;
  save_payment_method: boolean;
  payment_method_type: string;
  payment_method_type_category: string;
  fx_rate: number;
  merchant_requested_currency: string;
  merchant_requested_amount: number;
  fixed_side: string;
  payment_fees: any;
  invoice: string;
  escrow: any;
  group_payment: string;
  cancel_reason: string;
  initiation_type: string;
  mid: string;
  next_action_data: any;
}

/**
 * Customer types
 */
export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone_number?: string;
  metadata?: Record<string, any>;
  payment_method?: {
    type: string;
    fields?: Record<string, any>;
  };
}

export interface Customer {
  id: string;
  delinquent: boolean;
  discount: any;
  name: string;
  default_payment_method: string;
  description: string;
  email: string;
  phone_number: string;
  invoice_prefix: string;
  addresses: any[];
  payment_methods: any;
  subscriptions: any[];
  created_at: number;
  metadata: Record<string, any>;
  business_vat_id: string;
  ewallet: string;
}

/**
 * Payout types
 */
export interface CreatePayoutRequest {
  beneficiary: string;
  sender: string;
  sender_country: string;
  sender_currency: string;
  sender_entity_type: string;
  sender_amount: number;
  payout_method_type: string;
  description?: string;
  metadata?: Record<string, any>;
  ewallet?: string;
}

export interface Payout {
  id: string;
  payout_type: string;
  payout_method_type: string;
  amount: number;
  payout_currency: string;
  sender_amount: number;
  sender_currency: string;
  status: string;
  description: string;
  statement_descriptor: string;
  merchant_reference_id: string;
  created_at: number;
  metadata: Record<string, any>;
  beneficiary: any;
  sender: any;
  fx_rate: number;
  instructions: any[];
  ewallets: any[];
  error: any;
  paid_at: number;
  payout_fees: any;
  expiration: number;
  estimated_time_of_arrival: string;
  identifier_type: string;
  identifier_value: string;
  gc_error_code: string;
  paid_amount: number;
  error_code: string;
}

/**
 * Virtual Account types
 */
export interface CreateVirtualAccountRequest {
  currency: string;
  country: string;
  description?: string;
  ewallet?: string;
  merchant_reference_id?: string;
  metadata?: Record<string, any>;
}

export interface VirtualAccount {
  id: string;
  merchant_reference_id: string;
  ewallet: string;
  bank_account: {
    beneficiary_name: string;
    bank_name: string;
    account_number: string;
    routing_number: string;
    bic_swift: string;
    iban: string;
  };
  metadata: Record<string, any>;
  status: string;
  description: string;
  funding_instructions: any;
  currency: string;
  transactions: any[];
}

/**
 * Wallet types
 */
export interface CreateWalletRequest {
  first_name: string;
  last_name: string;
  email: string;
  ewallet_reference_id?: string;
  metadata?: Record<string, any>;
  type?: 'person' | 'company';
  contact?: {
    phone_number?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    mothers_name?: string;
    contact_type?: string;
    address?: any;
    identification_type?: string;
    identification_number?: string;
    date_of_birth?: string;
    country?: string;
    nationality?: string;
    metadata?: Record<string, any>;
  };
}

export interface Wallet {
  id: string;
  type: string;
  status: string;
  accounts: Array<{
    id: string;
    currency: string;
    alias: string;
    balance: number;
    received_balance: number;
    on_hold_balance: number;
    reserve_balance: number;
    limits: any;
  }>;
  contacts: any;
  verification_status: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  metadata: Record<string, any>;
  ewallet_reference_id: string;
}

/**
 * Rapyd Service Class
 */
class RapydService {
  private baseUrl: string;
  private accessKey: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = getRapydBaseUrl();
    this.accessKey = ENV_VARIABLES.RAPYD_ACCESS_KEY || '';
    this.secretKey = ENV_VARIABLES.RAPYD_SECRET_KEY || '';
  }

  /**
   * Generate HMAC signature for Rapyd API authentication
   * Rapyd uses a specific signature algorithm with salt and timestamp
   */
  private generateSignature(
    httpMethod: string,
    urlPath: string,
    salt: string,
    timestamp: string,
    body: string = ''
  ): string {
    try {
      // Build the string to sign
      const toSign = `${httpMethod}${urlPath}${salt}${timestamp}${this.accessKey}${this.secretKey}${body}`;
      
      // Create HMAC SHA-256 hash
      const hash = createHmac('sha256', this.secretKey)
        .update(toSign)
        .digest('hex');
      
      // Encode to base64
      return Buffer.from(hash).toString('base64');
    } catch (error) {
      throw new RapydError('Failed to generate signature');
    }
  }

  /**
   * Generate authentication headers for Rapyd API
   */
  private getAuthHeaders(
    httpMethod: string,
    urlPath: string,
    body: string = ''
  ): Record<string, string> {
    const salt = this.generateRandomString(12);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(httpMethod, urlPath, salt, timestamp, body);

    return {
      'access_key': this.accessKey,
      'salt': salt,
      'timestamp': timestamp,
      'signature': signature,
    };
  }

  /**
   * Generate random string for salt
   */
  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Make authenticated request to Rapyd API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    if (!this.accessKey || !this.secretKey) {
      throw new RapydError('Rapyd credentials not configured');
    }

    const body = data ? JSON.stringify(data) : '';
    const urlPath = endpoint;
    const authHeaders = this.getAuthHeaders(method, urlPath, body);

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: method !== 'GET' ? body : undefined,
      });

      const result = await response.json();

      // Rapyd returns status in the body
      if (result.status?.status !== 'SUCCESS') {
        throw new RapydError(
          result.status?.message || 'Rapyd API request failed',
          response.status,
          result
        );
      }

      return result.data as T;
    } catch (error) {
      if (error instanceof RapydError) {
        throw error;
      }
      throw new RapydError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  // ============= Payment Methods =============

  /**
   * Get payment methods by country
   */
  async getPaymentMethodsByCountry(countryCode: string): Promise<PaymentMethod[]> {
    try {
      return await this.request<PaymentMethod[]>(
        'GET',
        `${PAYMENT_GATEWAYS.RAPYD.PAYMENT_METHODS}?country=${countryCode}`
      );
    } catch (error) {
      throw new RapydError(
        `Failed to get payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get required fields for payment method
   */
  async getRequiredFields(paymentMethodType: string): Promise<any> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.REQUIRED_FIELDS,
        { type: paymentMethodType }
      );
      return await this.request<any>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get required fields: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Payments =============

  /**
   * Create a payment
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    try {
      return await this.request<Payment>(
        'POST',
        PAYMENT_GATEWAYS.RAPYD.PAYMENTS,
        paymentData
      );
    } catch (error) {
      throw new RapydError(
        `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.PAYMENT_BY_ID,
        { paymentId }
      );
      return await this.request<Payment>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string): Promise<Payment> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.CANCEL_PAYMENT,
        { paymentId }
      );
      return await this.request<Payment>('DELETE', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to cancel payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Customers =============

  /**
   * Create a customer
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      return await this.request<Customer>(
        'POST',
        PAYMENT_GATEWAYS.RAPYD.CUSTOMERS,
        customerData
      );
    } catch (error) {
      throw new RapydError(
        `Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.CUSTOMER_BY_ID,
        { customerId }
      );
      return await this.request<Customer>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Payouts =============

  /**
   * Create a payout
   */
  async createPayout(payoutData: CreatePayoutRequest): Promise<Payout> {
    try {
      return await this.request<Payout>(
        'POST',
        PAYMENT_GATEWAYS.RAPYD.PAYOUTS,
        payoutData
      );
    } catch (error) {
      throw new RapydError(
        `Failed to create payout: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string): Promise<Payout> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.PAYOUT_BY_ID,
        { payoutId }
      );
      return await this.request<Payout>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get payout: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Virtual Accounts =============

  /**
   * Create a virtual account
   */
  async createVirtualAccount(accountData: CreateVirtualAccountRequest): Promise<VirtualAccount> {
    try {
      return await this.request<VirtualAccount>(
        'POST',
        PAYMENT_GATEWAYS.RAPYD.VIRTUAL_ACCOUNTS,
        accountData
      );
    } catch (error) {
      throw new RapydError(
        `Failed to create virtual account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(virtualAccountId: string): Promise<VirtualAccount> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.VIRTUAL_ACCOUNT_BY_ID,
        { virtualAccountId }
      );
      return await this.request<VirtualAccount>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get virtual account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Wallets =============

  /**
   * Create a wallet
   */
  async createWallet(walletData: CreateWalletRequest): Promise<Wallet> {
    try {
      return await this.request<Wallet>(
        'POST',
        PAYMENT_GATEWAYS.RAPYD.WALLETS,
        walletData
      );
    } catch (error) {
      throw new RapydError(
        `Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<Wallet> {
    try {
      const endpoint = replaceUrlParams(
        PAYMENT_GATEWAYS.RAPYD.WALLET_BY_ID,
        { walletId }
      );
      return await this.request<Wallet>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Transfer between wallets
   */
  async transferBetweenWallets(data: {
    source_ewallet: string;
    destination_ewallet: string;
    amount: number;
    currency: string;
    description?: string;
  }): Promise<any> {
    try {
      return await this.request<any>(
        'POST',
        PAYMENT_GATEWAYS.RAPYD.TRANSFER_BETWEEN_WALLETS,
        data
      );
    } catch (error) {
      throw new RapydError(
        `Failed to transfer between wallets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Exchange Rates =============

  /**
   * Get exchange rates
   */
  async getExchangeRates(
    actionType: 'payment' | 'payout',
    buyCurrency: string,
    sellCurrency: string,
    amount?: number
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        action_type: actionType,
        buy_currency: buyCurrency,
        sell_currency: sellCurrency,
        ...(amount && { amount: amount.toString() }),
      });

      return await this.request<any>(
        'GET',
        `${PAYMENT_GATEWAYS.RAPYD.RATES}?${params}`
      );
    } catch (error) {
      throw new RapydError(
        `Failed to get exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const rapydService = new RapydService();

// Export default
export default rapydService;
