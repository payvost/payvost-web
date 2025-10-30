import { PaymentProvider, PaymentRequestDTO, PaymentStatus, PaymentMethod, PaymentIntent, ValidationResult, RefundResult } from '../interfaces';

export class SEPAProvider implements PaymentProvider {
  name = 'sepa';
  supportedCurrencies = ['EUR'];
  supportedCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'PT', 'AT', 'FI', 'IE'];
  minimumAmount = { EUR: 0.01 };
  maximumAmount = { EUR: 100000 };

  async createPaymentIntent(request: PaymentRequestDTO): Promise<PaymentIntent> {
    // SEPA Direct Debit implementation
    // This would integrate with your SEPA-enabled bank's API
    return {
      id: `sepa_${Date.now()}`,
      amount: request.amount,
      currency: request.currency,
      status: PaymentStatus.PENDING,
      provider: this.name,
      createdAt: new Date(),
      metadata: {
        iban: request.metadata?.iban,
        mandateId: `MANDATE_${Date.now()}`
      }
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Implement SEPA payment status check
    return PaymentStatus.PENDING;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    // For demonstration, using EUR and status as 'COMPLETED'
    return {
      id: `refund_${Date.now()}`,
      currency: 'EUR',
      status: PaymentStatus.COMPLETED,
      createdAt: new Date(),
      paymentIntentId: paymentId,
      amount: amount ?? 0
    };
  }

  async validatePaymentMethod(method: PaymentMethod): Promise<ValidationResult> {
    return {
      isValid: method === PaymentMethod.SEPA,
      errors: method === PaymentMethod.SEPA ? undefined : ['Unsupported payment method']
    };
  }

  getRequiredFields(): string[] {
    return ['iban', 'account_holder_name', 'mandate_acceptance'];
  }
}