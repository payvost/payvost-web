/**
 * Payments Service (client-safe)
 *
 * Wraps Next.js API routes for the new PaymentOrder-based outbound payments system.
 */

import { apiClient, ApiError } from './apiClient';

export type PaymentOrderType = 'REMITTANCE' | 'BILL_PAYMENT' | 'GIFT_CARD' | 'BULK_ITEM';
export type PaymentOrderStatus =
  | 'DRAFT'
  | 'QUOTED'
  | 'AUTHORIZED'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PaymentQuoteInput {
  type: PaymentOrderType;
  sourceAccountId: string;
  targetAmount: number;
  targetCurrency: string;
  userTier?: string;
}

export interface PaymentQuote {
  type: PaymentOrderType;
  userId: string;
  sourceAccountId: string;
  sourceCurrency: string;
  sourceAmount: number;
  targetCurrency: string;
  targetAmount: number;
  feeCurrency: string;
  feeAmount: number;
  fxRate: number | null;
  needsConversion: boolean;
  expiresAt: string;
}

export interface PaymentSubmitInput {
  type: 'BILL_PAYMENT' | 'GIFT_CARD';
  idempotencyKey: string;
  sourceAccountId: string;
  targetAmount: number;
  targetCurrency: string;
  userTier?: string;
  details: Record<string, unknown>;
  schedule?: { enabled: boolean; frequency: 'weekly' | 'monthly' | 'yearly'; timezone?: string };
}

export interface PaymentOrder {
  id: string;
  userId: string;
  sourceAccountId: string;
  type: PaymentOrderType;
  status: PaymentOrderStatus;
  idempotencyKey: string;
  sourceAmount: string | number;
  sourceCurrency: string;
  targetAmount: string | number;
  targetCurrency: string;
  feeAmount: string | number;
  feeCurrency: string;
  fxRate?: string | number | null;
  provider?: string | null;
  providerRef?: string | null;
  externalTxId?: string | null;
  metadata?: unknown;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  completedAt?: string | null;
}

class PaymentsService {
  async quote(input: PaymentQuoteInput): Promise<PaymentQuote> {
    try {
      const res = await apiClient.post<{ quote: PaymentQuote }>('/api/payments/quote', input);
      return res.quote;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw error;
    }
  }

  async submit(input: PaymentSubmitInput): Promise<PaymentOrder> {
    try {
      const res = await apiClient.post<{ paymentOrder: PaymentOrder }>('/api/payments/submit', input);
      return res.paymentOrder;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw error;
    }
  }

  async activity(params?: { type?: PaymentOrderType; status?: PaymentOrderStatus; limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiClient.get<{ items: PaymentOrder[]; pagination: { limit: number; offset: number } }>(
      `/api/payments/activity${suffix}`
    );
  }

  async getById(id: string) {
    return apiClient.get<{ paymentOrder: PaymentOrder; externalTransaction: unknown }>(
      `/api/payments/${encodeURIComponent(id)}`
    );
  }

  async listBillers(country: string) {
    return apiClient.get<{ billers: unknown[] }>(`/api/billers?country=${encodeURIComponent(country)}`);
  }

  async giftCardCatalog(countryCode?: string) {
    const suffix = countryCode ? `?countryCode=${encodeURIComponent(countryCode)}` : '';
    return apiClient.get<{ products: unknown[] }>(`/api/gift-cards/catalog${suffix}`);
  }

  async templates(type?: 'BILL_PAYMENT' | 'GIFT_CARD') {
    const suffix = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiClient.get<{ items: unknown[] }>(`/api/payment-templates${suffix}`);
  }

  async deleteTemplate(id: string) {
    return apiClient.delete<{ success: boolean }>(`/api/payment-templates/${encodeURIComponent(id)}`);
  }

  async schedules(params?: { status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED'; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiClient.get<{ items: unknown[] }>(`/api/payment-schedules${suffix}`);
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
