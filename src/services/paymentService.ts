/**
 * Payment Service (client-safe)
 *
 * Wraps Next.js API routes for payment intent creation + status checks.
 */

import { apiClient, ApiError } from './apiClient';

export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'SEPA' | 'FEDNOW' | 'WALLET';

export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  sourceCountry?: string;
  destinationCountry?: string;
}

export interface CreatePaymentIntentOutput {
  paymentId: string;
  clientSecret?: string;
  provider: string;
  requiredFields?: string[];
  message?: string;
}

class PaymentService {
  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentOutput> {
    try {
      // Provide sane defaults expected by backend payment routing.
      const payload = {
        ...input,
        currency: input.currency.toUpperCase(),
        sourceCountry: input.sourceCountry || 'US',
        destinationCountry: input.destinationCountry || 'US',
      };
      return await apiClient.post<CreatePaymentIntentOutput>('/api/payment/create-intent', payload);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to create payment intent: ${error.message}`);
      }
      throw error;
    }
  }

  async getStatus(paymentId: string): Promise<{ status: string }> {
    try {
      return await apiClient.get<{ status: string }>(`/api/payment/status/${encodeURIComponent(paymentId)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch payment status: ${error.message}`);
      }
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;

