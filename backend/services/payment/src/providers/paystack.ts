import { PaymentProvider, PaymentRequestDTO, PaymentStatus, PaymentMethod, PaymentIntent, ValidationResult } from '../interfaces';
import axios from 'axios';

export class PaystackProvider implements PaymentProvider {
  private client: any;
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  name = 'paystack';
  supportedCurrencies = ['NGN', 'GHS', 'USD', 'ZAR'];
  supportedCountries = ['NG', 'GH', 'ZA', 'KE'];
  minimumAmount = { 
    NGN: 100, // Minimum amount in kobo
    GHS: 0.5,
    USD: 1,
    ZAR: 20
  };
  maximumAmount = {
    NGN: 30000000,
    GHS: 50000,
    USD: 50000,
    ZAR: 500000
  };

  async createPaymentIntent(request: PaymentRequestDTO): Promise<PaymentIntent> {
    try {
      const response = await this.client.post('/transaction/initialize', {
        amount: Math.round(request.amount * 100), // Convert to kobo/pesewas
        currency: request.currency,
        email: request.metadata?.email,
        reference: request.idempotencyKey,
        callback_url: request.returnUrl,
        metadata: {
          custom_fields: request.metadata?.customFields,
          ...request.metadata
        }
      });

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      return {
        id: response.data.data.reference,
        amount: request.amount,
        currency: request.currency,
        status: PaymentStatus.PENDING,
        clientSecret: response.data.data.access_code,
        provider: this.name,
        createdAt: new Date(),
        metadata: {
          authorization_url: response.data.data.authorization_url,
          ...request.metadata
        }
      };
    } catch (error) {
      console.error('Paystack payment creation failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Payment initialization failed');
      }
      throw new Error('Payment initialization failed');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get(`/transaction/verify/${paymentId}`);
      
      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      const status = response.data.data.status;
      return this.mapPaystackStatus(status);
    } catch (error) {
      console.error('Paystack status check failed:', error);
      throw new Error('Payment status check failed');
    }
  }

  private mapPaystackStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'success': PaymentStatus.SUCCEEDED,
      'failed': PaymentStatus.FAILED,
      'pending': PaymentStatus.PENDING,
      'abandoned': PaymentStatus.EXPIRED
    };
    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      const response = await this.client.post('/refund', {
        transaction: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        id: response.data.data.id,
        amount: response.data.data.amount / 100,
        currency: response.data.data.currency,
        status: this.mapPaystackStatus(response.data.data.status),
        createdAt: new Date(response.data.data.createdAt),
        paymentIntentId: paymentId
      };
    } catch (error) {
      console.error('Paystack refund failed:', error);
      throw new Error('Refund failed');
    }
  }

  async validatePaymentMethod(method: PaymentMethod): Promise<ValidationResult> {
    const isValid = [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER].includes(method);
    return {
      isValid,
      errors: isValid ? undefined : ['unsupported_payment_method']
    };
  }

  getRequiredFields(): string[] {
    return ['email', 'amount', 'currency'];
  }

  // Webhook handling
  async handleWebhook(payload: any, signature: string) {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    return {
      reference: payload.data.reference,
      status: this.mapPaystackStatus(payload.data.status),
      amount: payload.data.amount / 100,
      currency: payload.data.currency
    };
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implement Paystack signature verification
    // https://paystack.com/docs/payments/webhooks#verifying-webhook-requests
    return true; // TODO: Implement actual verification
  }
}