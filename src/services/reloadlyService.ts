/**
 * Reloadly Service
 * 
 * Service for integrating with Reloadly API
 * Services: Airtime top-ups, Data bundles, Gift cards, Bill payments
 * Documentation: https://docs.reloadly.com/
 */

import { RELOADLY, ENV_VARIABLES, getReloadlyBaseUrl, replaceUrlParams } from '@/config/integration-partners';
import { apiClient } from './apiClient';

/**
 * Reloadly API Error
 */
export class ReloadlyError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ReloadlyError';
  }
}

/**
 * Authentication Token Cache
 */
interface TokenCache {
  token: string;
  expiresAt: number;
}

/**
 * Operator/Provider types
 */
export interface Operator {
  operatorId: number;
  operatorName: string;
  country: {
    isoName: string;
    name: string;
  };
  denomination: {
    min: number;
    max: number;
  };
  denominationType: 'FIXED' | 'RANGE';
  fixedAmounts?: number[];
  localAmounts?: number[];
  suggestedAmounts?: number[];
  logoUrls: string[];
  fx: {
    rate: number;
    currencyCode: string;
  };
}

/**
 * Topup types
 */
export interface TopupRequest {
  operatorId: number;
  amount: number;
  recipientPhone: {
    countryCode: string;
    number: string;
  };
  senderPhone?: {
    countryCode: string;
    number: string;
  };
  customIdentifier?: string;
}

export interface TopupResponse {
  transactionId: number;
  operatorTransactionId: string;
  customIdentifier?: string;
  recipientPhone: string;
  senderPhone?: string;
  countryCode: string;
  operatorId: number;
  operatorName: string;
  discount: number;
  discountCurrencyCode: string;
  requestedAmount: number;
  requestedAmountCurrencyCode: string;
  deliveredAmount: number;
  deliveredAmountCurrencyCode: string;
  transactionDate: string;
  balanceInfo?: {
    oldBalance: number;
    newBalance: number;
    currencyCode: string;
    currencyName: string;
  };
}

/**
 * Gift Card types
 */
export interface GiftCardProduct {
  productId: number;
  productName: string;
  countryCode: string;
  denominationType: 'FIXED' | 'RANGE';
  recipientCurrencyCode: string;
  minRecipientDenomination?: number;
  maxRecipientDenomination?: number;
  senderCurrencyCode: string;
  minSenderDenomination?: number;
  maxSenderDenomination?: number;
  fixedRecipientDenominations?: number[];
  fixedSenderDenominations?: number[];
  logoUrls: string[];
  brand: {
    brandId: number;
    brandName: string;
  };
  redeemInstruction?: {
    concise: string;
    verbose: string;
  };
}

export interface GiftCardOrderRequest {
  productId: number;
  countryCode: string;
  quantity: number;
  unitPrice: number;
  customIdentifier?: string;
  senderName?: string;
  recipientEmail?: string;
  recipientPhoneDetails?: {
    countryCode: string;
    phoneNumber: string;
  };
}

export interface GiftCardOrderResponse {
  transactionId: number;
  amount: number;
  discount: number;
  currencyCode: string;
  fee: number;
  smsFee: number;
  recipientEmail?: string;
  customIdentifier?: string;
  transactionCreatedTime: string;
  product: {
    productId: number;
    productName: string;
    countryCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
}

/**
 * Utility Bill types
 */
export interface Biller {
  id: number;
  name: string;
  countryCode: string;
  type: string;
  localTransactionFee: number;
  localTransactionFeeCurrencyCode: string;
  localMinAmount: number;
  localMaxAmount: number;
  serviceCharge: number;
}

export interface BillPaymentRequest {
  billerId: number;
  subscriberAccountNumber: string;
  amount: number;
  customIdentifier?: string;
  referenceId?: string;
}

export interface BillPaymentResponse {
  transactionId: number;
  referenceId: string;
  amount: number;
  fee: number;
  discount: number;
  currencyCode: string;
  billerId: number;
  subscriberAccountNumber: string;
  customIdentifier?: string;
  deliveryStatus: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  transactionDate: string;
  balanceInfo?: {
    oldBalance: number;
    newBalance: number;
    currencyCode: string;
  };
}

/**
 * Reloadly Service Class
 */
class ReloadlyService {
  private tokenCache: Map<string, TokenCache> = new Map();

  private assertServer(): void {
    if (typeof window !== 'undefined') {
      throw new ReloadlyError('ReloadlyService is server-only (use Next.js API routes from the client)');
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(service: 'airtime' | 'giftcards' | 'utilities'): Promise<string> {
    this.assertServer();
    // Check cache
    const cached = this.tokenCache.get(service);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const clientId = ENV_VARIABLES.RELOADLY_CLIENT_ID;
    const clientSecret = ENV_VARIABLES.RELOADLY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ReloadlyError('Reloadly credentials not configured');
    }

    try {
      // Determine audience based on service
      let audience = getReloadlyBaseUrl('airtime');
      if (service === 'giftcards') {
        audience = getReloadlyBaseUrl('giftcards');
      } else if (service === 'utilities') {
        audience = getReloadlyBaseUrl('utilities');
      }

      const response = await fetch(RELOADLY.AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          audience,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ReloadlyError(
          error.message || 'Authentication failed',
          response.status,
          error
        );
      }

      const data = await response.json();

      // Cache token (expires in data.expires_in seconds, we cache for slightly less)
      const expiresIn = (data.expires_in || 3600) * 1000;
      this.tokenCache.set(service, {
        token: data.access_token,
        expiresAt: Date.now() + expiresIn - 60000, // 1 minute buffer
      });

      return data.access_token;
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw error;
      }
      throw new ReloadlyError(
        error instanceof Error ? error.message : 'Failed to authenticate with Reloadly'
      );
    }
  }

  /**
   * Make authenticated request to Reloadly API
   */
  private async request<T>(
    service: 'airtime' | 'giftcards' | 'utilities',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.assertServer();
    const token = await this.getAuthToken(service);
    const baseUrl = getReloadlyBaseUrl(service);

    // Set vendor-specific Accept header required by Reloadly APIs
    const acceptHeader =
      service === 'airtime'
        ? 'application/com.reloadly.topups-v1+json'
        : service === 'giftcards'
          ? 'application/com.reloadly.giftcards-v1+json'
          : 'application/com.reloadly.utilities-v1+json';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': acceptHeader,
        ...options.headers,
      },
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes(acceptHeader);

    if (!response.ok) {
      let error: any = {};
      if (isJson) {
        try {
          error = await response.json();
        } catch {
          const text = await response.text().catch(() => '');
          error = { message: text || `HTTP ${response.status} Error` };
        }
      } else {
        const text = await response.text().catch(() => '');
        error = { message: text || `HTTP ${response.status} Error` };
      }
      const baseMsg = error.message || error.error || 'Reloadly API request failed';
      const envHint = ` (service: ${service}, env: ${ENV_VARIABLES.RELOADLY_ENV}, url: ${baseUrl}${endpoint})`;
      throw new ReloadlyError(baseMsg + envHint, response.status, error);
    }

    if (!isJson) {
      const text = await response.text();
      throw new ReloadlyError(
        `Expected JSON response but received ${contentType || 'unknown content type'}`,
        response.status
      );
    }

    return await response.json();
  }

  // ============= Airtime & Data Methods =============

  /**
   * Get all operators
   */
  async getOperators(
    includeData = true,
    includeBundles = true,
    simplified = false
  ): Promise<Operator[]> {
    try {
      const params = new URLSearchParams({
        includeData: includeData.toString(),
        includeBundles: includeBundles.toString(),
        simplified: simplified.toString(),
      });

      return await this.request<Operator[]>(
        'airtime',
        `${RELOADLY.AIRTIME.OPERATORS}?${params}`
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch operators: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get operators by country code
   */
  async getOperatorsByCountry(countryCode: string): Promise<Operator[]> {
    try {
      return await this.request<Operator[]>(
        'airtime',
        `${RELOADLY.AIRTIME.OPERATORS_BY_COUNTRY}/${countryCode}`
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch operators for ${countryCode}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Auto-detect operator from phone number
   */
  async autoDetectOperator(
    phone: string,
    countryCode: string
  ): Promise<Operator> {
    try {
      const params = new URLSearchParams({
        phone,
        countryCode,
      });

      return await this.request<Operator>(
        'airtime',
        `${RELOADLY.AIRTIME.AUTO_DETECT}/${phone}/countries/${countryCode}`
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to detect operator: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get FX rate for operator
   */
  async getFxRate(operatorId: number, amount: number): Promise<{ fxRate: number; amount: number }> {
    try {
      const params = new URLSearchParams({
        operatorId: operatorId.toString(),
        amount: amount.toString(),
      });

      return await this.request<{ fxRate: number; amount: number }>(
        'airtime',
        `${RELOADLY.AIRTIME.FX_RATE}?${params}`
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch FX rate: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send airtime topup
   */
  async sendTopup(request: TopupRequest): Promise<TopupResponse> {
    try {
      return await this.request<TopupResponse>(
        'airtime',
        RELOADLY.AIRTIME.TOPUP,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to send topup: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get topup transaction by ID
   */
  async getTopupTransaction(transactionId: number): Promise<TopupResponse> {
    try {
      return await this.request<TopupResponse>(
        'airtime',
        `${RELOADLY.AIRTIME.TRANSACTIONS}/${transactionId}`
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch topup transaction: ${error.message}`);
      }
      throw error;
    }
  }

  // ============= Gift Card Methods =============

  /**
   * Get all gift card products
   */
  async getGiftCardProducts(countryCode?: string): Promise<GiftCardProduct[]> {
    try {
      // If running in the browser, use our server API to avoid exposing credentials
      if (typeof window !== 'undefined') {
        const endpoint = `/api/reloadly/giftcards/products${countryCode ? `?countryCode=${encodeURIComponent(countryCode)}` : ''}`;
        const data = await apiClient.get<{ ok: boolean; products: GiftCardProduct[]; error?: string }>(endpoint);
        if (!data.ok) throw new Error(data.error || 'Failed to fetch gift card products');
        return data.products;
      }

      const endpoint = countryCode
        ? `${RELOADLY.GIFTCARDS.PRODUCTS}?countryCode=${countryCode}`
        : RELOADLY.GIFTCARDS.PRODUCTS;

      return await this.request<GiftCardProduct[]>('giftcards', endpoint);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch gift card products: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get gift card product by ID
   */
  async getGiftCardProduct(productId: number): Promise<GiftCardProduct> {
    try {
      const endpoint = replaceUrlParams(RELOADLY.GIFTCARDS.PRODUCT_BY_ID, {
        productId: productId.toString(),
      });

      return await this.request<GiftCardProduct>('giftcards', endpoint);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch gift card product: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Order gift card
   */
  async orderGiftCard(request: GiftCardOrderRequest): Promise<GiftCardOrderResponse> {
    try {
      return await this.request<GiftCardOrderResponse>(
        'giftcards',
        RELOADLY.GIFTCARDS.ORDER,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to order gift card: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get gift card order/transaction by ID
   */
  async getGiftCardOrder(transactionId: number): Promise<GiftCardOrderResponse> {
    try {
      const endpoint = replaceUrlParams(RELOADLY.GIFTCARDS.ORDER_BY_ID, {
        transactionId: transactionId.toString(),
      });

      return await this.request<GiftCardOrderResponse>('giftcards', endpoint);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch gift card order: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get redeem code instructions for gift card
   */
  async getRedeemInstructions(transactionId: number): Promise<any> {
    try {
      const endpoint = replaceUrlParams(RELOADLY.GIFTCARDS.REDEEM_INSTRUCTIONS, {
        transactionId: transactionId.toString(),
      });

      return await this.request<any>('giftcards', endpoint);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch redeem instructions: ${error.message}`);
      }
      throw error;
    }
  }

  // ============= Utility Bill Methods =============

  /**
   * Get all billers
   */
  async getBillers(): Promise<Biller[]> {
    try {
      return await this.request<Biller[]>('utilities', RELOADLY.UTILITIES.BILLERS);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch billers: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get billers by country
   */
  async getBillersByCountry(countryCode: string): Promise<Biller[]> {
    try {
      // Browser calls should go through our API
      if (typeof window !== 'undefined') {
        const endpoint = `/api/reloadly/utilities/billers?countryCode=${encodeURIComponent(countryCode)}`;
        const data = await apiClient.get<{ ok: boolean; billers: Biller[]; error?: string }>(endpoint);
        if (!data.ok) throw new Error(data.error || `Failed to fetch billers for ${countryCode}`);
        return data.billers;
      }

      // Try query param format first (some Reloadly APIs use this)
      const endpointWithQuery = `/billers?iso-code=${countryCode}`;
      
      try {
        return await this.request<Biller[]>('utilities', endpointWithQuery);
      } catch (queryError) {
        // Fallback to path param format
        console.warn('Query param format failed, trying path param:', queryError);
        const endpoint = replaceUrlParams(RELOADLY.UTILITIES.BILLERS_BY_COUNTRY, {
          countryCode,
        });
        return await this.request<Biller[]>('utilities', endpoint);
      }
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch billers for ${countryCode}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get biller by ID
   */
  async getBiller(billerId: number): Promise<Biller> {
    try {
      const endpoint = replaceUrlParams(RELOADLY.UTILITIES.BILLER_BY_ID, {
        billerId: billerId.toString(),
      });

      return await this.request<Biller>('utilities', endpoint);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch biller: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Pay utility bill
   */
  async payBill(request: BillPaymentRequest): Promise<BillPaymentResponse> {
    try {
      // Browser calls should go through our API
      if (typeof window !== 'undefined') {
        const data = await apiClient.post<{ ok: boolean; result: BillPaymentResponse; error?: string }>(
          '/api/reloadly/utilities/pay',
          request
        );
        if (!data.ok) throw new Error(data.error || 'Failed to pay bill');
        return data.result;
      }

      return await this.request<BillPaymentResponse>(
        'utilities',
        RELOADLY.UTILITIES.BILL_PAYMENT,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to pay bill: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get bill payment transaction by ID
   */
  async getBillTransaction(transactionId: number): Promise<BillPaymentResponse> {
    try {
      const endpoint = replaceUrlParams(RELOADLY.UTILITIES.TRANSACTION, {
        transactionId: transactionId.toString(),
      });

      return await this.request<BillPaymentResponse>('utilities', endpoint);
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch bill transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ balance: number; currencyCode: string; currencyName: string }> {
    try {
      return await this.request<{ balance: number; currencyCode: string; currencyName: string }>(
        'utilities',
        RELOADLY.UTILITIES.BALANCE
      );
    } catch (error) {
      if (error instanceof ReloadlyError) {
        throw new Error(`Failed to fetch balance: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Clear token cache (useful for testing or when credentials change)
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}

// Export singleton instance
export const reloadlyService = new ReloadlyService();

// Export default
export default reloadlyService;
