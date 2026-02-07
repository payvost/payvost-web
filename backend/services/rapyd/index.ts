/**
 * Rapyd Service for Backend
 * 
 * Service for integrating with Rapyd API from the backend
 * Services: Wallets, Payments, Payouts, Virtual Accounts
 * Documentation: https://docs.rapyd.net/
 */

import { createHmac, randomBytes } from 'crypto';

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
 * Rapyd Wallet Creation Request
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

/**
 * Rapyd Wallet Response
 */
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
 * Rapyd Virtual Account (Collect) types
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
    routing_number?: string;
    bic_swift?: string;
    iban?: string;
  };
  metadata?: Record<string, any>;
  status: string;
  description?: string;
  funding_instructions?: any;
  currency: string;
}

/**
 * Rapyd API Endpoints
 */
const RAPYD_ENDPOINTS = {
  WALLETS: '/v1/user',
  WALLET_BY_ID: '/v1/user/:walletId',
  VIRTUAL_ACCOUNTS: '/v1/virtual_accounts',
  VIRTUAL_ACCOUNT_BY_ID: '/v1/virtual_accounts/:virtualAccountId',
  // Card issuing
  ISSUED_CARDS: '/v1/issuing/cards',
  CARD_BY_ID: '/v1/issuing/cards/:cardId',
  UPDATE_CARD_STATUS: '/v1/issuing/cards/status',
} as const;

/**
 * Card Issuing types
 */
export interface CreateIssuedCardRequest {
  ewallet: string;
  card_program: string;
  country: string;
  currency: string;
  card_type?: string;
  description?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface IssuedCard {
  id: string;
  status?: string;
  card_status?: string;
  last4?: string;
  last_4?: string;
  pan_last_4?: string;
  expiration_date?: string;
  expiry_date?: string;
  exp_date?: string;
  expiration_month?: string | number;
  expiration_year?: string | number;
  masked_number?: string;
  card_number?: string;
  cvv?: string;
  [key: string]: any;
}

export interface UpdateIssuedCardStatusRequest {
  card: string;
  status: 'block' | 'unblock' | string;
}

/**
 * Get Rapyd base URL based on environment
 */
function getRapydBaseUrl(): string {
  const env = process.env.RAPYD_ENV || 'sandbox';
  const isProduction = env === 'production';
  return isProduction 
    ? 'https://api.rapyd.net' 
    : 'https://sandboxapi.rapyd.net';
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
    this.accessKey = process.env.RAPYD_ACCESS_KEY || '';
    this.secretKey = process.env.RAPYD_SECRET_KEY || '';
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
    return randomBytes(length).toString('base64').slice(0, length).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Replace URL parameters
   */
  private replaceUrlParams(url: string, params: Record<string, string>): string {
    let result = url;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`:${key}`, value);
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
      throw new RapydError('Rapyd credentials not configured. Please set RAPYD_ACCESS_KEY and RAPYD_SECRET_KEY environment variables.');
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

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        const text = await response.text();
        throw new RapydError(
          `Expected JSON response but received ${contentType || 'unknown content type'}: ${text.substring(0, 200)}`,
          response.status
        );
      }

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

  /**
   * Create a wallet
   */
  async createWallet(walletData: CreateWalletRequest): Promise<Wallet> {
    try {
      return await this.request<Wallet>(
        'POST',
        RAPYD_ENDPOINTS.WALLETS,
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
      const endpoint = this.replaceUrlParams(RAPYD_ENDPOINTS.WALLET_BY_ID, { walletId });
      return await this.request<Wallet>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a virtual account (collect) for bank transfer funding instructions.
   */
  async createVirtualAccount(payload: CreateVirtualAccountRequest): Promise<VirtualAccount> {
    try {
      return await this.request<VirtualAccount>('POST', RAPYD_ENDPOINTS.VIRTUAL_ACCOUNTS, payload);
    } catch (error) {
      throw new RapydError(
        `Failed to create virtual account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get virtual account by ID.
   */
  async getVirtualAccount(virtualAccountId: string): Promise<VirtualAccount> {
    try {
      const endpoint = this.replaceUrlParams(RAPYD_ENDPOINTS.VIRTUAL_ACCOUNT_BY_ID, { virtualAccountId });
      return await this.request<VirtualAccount>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get virtual account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============= Card Issuing =============

  /**
   * Create an issued card
   */
  async createIssuedCard(cardData: CreateIssuedCardRequest): Promise<IssuedCard> {
    try {
      return await this.request<IssuedCard>(
        'POST',
        RAPYD_ENDPOINTS.ISSUED_CARDS,
        cardData
      );
    } catch (error) {
      throw new RapydError(
        `Failed to create issued card: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get issued card by ID
   */
  async getIssuedCard(cardId: string): Promise<IssuedCard> {
    try {
      const endpoint = this.replaceUrlParams(RAPYD_ENDPOINTS.CARD_BY_ID, { cardId });
      return await this.request<IssuedCard>('GET', endpoint);
    } catch (error) {
      throw new RapydError(
        `Failed to get issued card: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update issued card status (block/unblock; issuer may support additional statuses)
   */
  async updateIssuedCardStatus(payload: UpdateIssuedCardStatusRequest): Promise<IssuedCard> {
    try {
      return await this.request<IssuedCard>(
        'POST',
        RAPYD_ENDPOINTS.UPDATE_CARD_STATUS,
        payload
      );
    } catch (error) {
      throw new RapydError(
        `Failed to update issued card status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const rapydService = new RapydService();
export default rapydService;

