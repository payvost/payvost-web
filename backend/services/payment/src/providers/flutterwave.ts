import { PaymentProvider, PaymentRequestDTO, PaymentStatus, PaymentMethod, PaymentIntent, ValidationResult } from '../interfaces';
import axios from 'axios';

export class FlutterwaveProvider implements PaymentProvider {
  private client: any;
  private secretKey: string;
  private publicKey: string;

  constructor(secretKey: string, publicKey: string) {
    this.secretKey = secretKey;
    this.publicKey = publicKey;
    this.client = axios.create({
      baseURL: 'https://api.flutterwave.com/v3',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  name = 'flutterwave';
  supportedCurrencies = ['NGN', 'USD', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR'];
  supportedCountries = ['NG', 'GH', 'KE', 'UG', 'TZ', 'ZA'];
  minimumAmount = {
    NGN: 100,
    USD: 1,
    GHS: 1,
    KES: 100,
    UGX: 1000,
    TZS: 1000,
    ZAR: 10
  };
  maximumAmount = {
    NGN: 100000000,
    USD: 100000,
    GHS: 100000,
    KES: 10000000,
    UGX: 100000000,
    TZS: 100000000,
    ZAR: 1000000
  };

  async createPaymentIntent(request: PaymentRequestDTO): Promise<PaymentIntent> {
    try {
      const response = await this.client.post('/payments', {
        tx_ref: request.idempotencyKey,
        amount: request.amount,
        currency: request.currency,
        redirect_url: request.returnUrl,
        payment_options: this.getPaymentOptions(request.paymentMethod),
        customer: {
          email: request.metadata?.email,
          name: request.metadata?.customerName,
          phone_number: request.metadata?.phoneNumber
        },
        customizations: {
          title: request.metadata?.title || 'Payment',
          description: request.description,
          logo: request.metadata?.logo
        },
        meta: request.metadata
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message);
      }

      return {
        id: response.data.data.id.toString(),
        amount: request.amount,
        currency: request.currency,
        status: PaymentStatus.PENDING,
        clientSecret: response.data.data.link,
        provider: this.name,
        createdAt: new Date(),
        metadata: {
          flw_ref: response.data.data.flw_ref,
          checkout_url: response.data.data.link,
          ...request.metadata
        }
      };
    } catch (error) {
      console.error('Flutterwave payment creation failed:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Payment initialization failed');
    }
  }

  private getPaymentOptions(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CARD:
        return 'card';
      case PaymentMethod.BANK_TRANSFER:
        return 'banktransfer';
      default:
        return 'card,banktransfer,ussd';
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get(`/transactions/${paymentId}/verify`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message);
      }

      return this.mapFlutterwaveStatus(response.data.data.status);
    } catch (error) {
      console.error('Flutterwave status check failed:', error);
      throw new Error('Payment status check failed');
    }
  }

  private mapFlutterwaveStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'successful': PaymentStatus.SUCCEEDED,
      'failed': PaymentStatus.FAILED,
      'pending': PaymentStatus.PENDING,
      'cancelled': PaymentStatus.FAILED
    };
    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      const response = await this.client.post('/transactions/refund', {
        id: paymentId,
        amount: amount
      });

      return {
        id: response.data.data.id.toString(),
        amount: response.data.data.amount,
        currency: response.data.data.currency,
        status: response.data.status === 'success' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
        createdAt: new Date(),
        paymentIntentId: paymentId
      };
    } catch (error) {
      console.error('Flutterwave refund failed:', error);
      throw new Error('Refund failed');
    }
  }

  async validatePaymentMethod(method: PaymentMethod): Promise<ValidationResult> {
    return {
      isValid: [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER].includes(method),
      errors: [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER].includes(method) ? undefined : ['Unsupported payment method']
    };
  }

  getRequiredFields(): string[] {
    return ['email', 'amount', 'currency', 'tx_ref'];
  }

  // Webhook handling
  async handleWebhook(payload: any, signature: string) {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    return {
      reference: payload.data.tx_ref,
      status: this.mapFlutterwaveStatus(payload.data.status),
      amount: payload.data.amount,
      currency: payload.data.currency
    };
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implement Flutterwave signature verification
    // https://developer.flutterwave.com/docs/integration-guides/webhooks
    return true; // TODO: Implement actual verification
  }
}