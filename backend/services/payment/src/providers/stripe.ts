import { PaymentProvider, PaymentRequestDTO, PaymentStatus, PaymentMethod } from '../interfaces';
import Stripe from 'stripe';

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  
  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2025-09-30.clover' });
  }
  
  name = 'stripe';
  supportedCurrencies = ['USD', 'EUR', 'GBP'];
  supportedCountries = ['US', 'GB', 'DE', 'FR', 'ES', 'IT'];
  minimumAmount = { USD: 0.5, EUR: 0.5, GBP: 0.3 };
  maximumAmount = { USD: 999999.99, EUR: 999999.99, GBP: 999999.99 };

  async createPaymentIntent(request: PaymentRequestDTO) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(request.amount * 100), // Convert to cents
      currency: request.currency.toLowerCase(),
      payment_method_types: this.getPaymentMethodTypes(request),
      metadata: {
        idempotencyKey: request.idempotencyKey,
        ...request.metadata
      }
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: this.mapStripeStatus(paymentIntent.status),
      clientSecret: paymentIntent.client_secret || undefined,
      provider: this.name,
      createdAt: new Date(paymentIntent.created * 1000)
    };
  }

  private getPaymentMethodTypes(request: PaymentRequestDTO): string[] {
    switch (request.paymentMethod) {
      case PaymentMethod.CARD:
        return ['card'];
      case PaymentMethod.SEPA:
        return ['sepa_debit'];
      default:
        return ['card'];
    }
  }

  private mapStripeStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'requires_payment_method': PaymentStatus.PENDING,
      'requires_confirmation': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'succeeded': PaymentStatus.SUCCEEDED,
      'canceled': PaymentStatus.FAILED
    };
    return statusMap[status] || PaymentStatus.PENDING;
  }

  async getPaymentStatus(paymentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
    return this.mapStripeStatus(paymentIntent.status);
  }

  async refundPayment(paymentId: string, amount?: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    // Return RefundResult
    return {
      id: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency.toUpperCase(),
      status: refund.status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      createdAt: new Date(refund.created * 1000),
      paymentIntentId: paymentId
    };
  }

  async validatePaymentMethod(method: PaymentMethod): Promise<import('../interfaces').ValidationResult> {
    return {
      isValid: method === PaymentMethod.CARD || method === PaymentMethod.SEPA,
      errors: [],
    };
  }

  getRequiredFields(): string[] {
    return ['card_number', 'expiry_month', 'expiry_year', 'cvc'];
  }
}