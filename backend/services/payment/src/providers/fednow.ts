import { PaymentProvider, PaymentRequestDTO, PaymentStatus, PaymentMethod, PaymentIntent, RefundResult, ValidationResult } from '../interfaces';

export class FedNowProvider implements PaymentProvider {
  name = 'fednow';
  supportedCurrencies = ['USD'];
  supportedCountries = ['US'];
  minimumAmount = { USD: 0.01 };
  maximumAmount = { USD: 500000 };

  async createPaymentIntent(request: PaymentRequestDTO): Promise<PaymentIntent> {
    // FedNow implementation would go here
    // This would integrate with the FedNow API when it becomes available
    throw new Error('FedNow integration coming soon');
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    throw new Error('FedNow integration coming soon');
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    throw new Error('FedNow integration coming soon');
  }

  async validatePaymentMethod(method: PaymentMethod): Promise<ValidationResult> {
    const isValid = method === PaymentMethod.BANK_TRANSFER;
    return {
      isValid,
      errors: isValid ? undefined : ['unsupported_payment_method']
    };
  }

  getRequiredFields(): string[] {
    return ['routing_number', 'account_number', 'account_type', 'account_holder_name'];
  }
}