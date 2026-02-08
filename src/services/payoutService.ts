import { apiClient, ApiError } from './apiClient';

export interface CreatePayoutDto {
  fromAccountId: string;
  recipientId: string;
  amount: number;
  currency: string;
  description?: string;
  idempotencyKey?: string;
}

export interface PayoutResponse {
  payout: {
    id: string;
    externalTransactionId?: string;
    status: string;
  };
}

class PayoutService {
  private generateIdempotencyKey(): string {
    const globalCrypto = (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined) as
      | { randomUUID?: () => string; getRandomValues?: (buffer: Uint8Array) => Uint8Array }
      | undefined;

    if (globalCrypto?.randomUUID) {
      return globalCrypto.randomUUID();
    }

    const buffer = new Uint8Array(16);
    if (globalCrypto?.getRandomValues) {
      globalCrypto.getRandomValues(buffer);
    } else {
      for (let i = 0; i < buffer.length; i += 1) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
    }

    buffer[6] = (buffer[6] & 0x0f) | 0x40;
    buffer[8] = (buffer[8] & 0x3f) | 0x80;

    const hex = Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
  }

  async create(data: CreatePayoutDto): Promise<PayoutResponse['payout']> {
    try {
      const idempotencyKey = data.idempotencyKey || this.generateIdempotencyKey();
      const response = await apiClient.post<PayoutResponse>('/api/payouts', { ...data, idempotencyKey });
      return response.payout;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to create payout: ${error.message}`);
      }
      throw error;
    }
  }
}

export const payoutService = new PayoutService();
export default payoutService;

