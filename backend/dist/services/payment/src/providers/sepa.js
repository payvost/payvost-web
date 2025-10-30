"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEPAProvider = void 0;
const interfaces_1 = require("../interfaces");
class SEPAProvider {
    constructor() {
        this.name = 'sepa';
        this.supportedCurrencies = ['EUR'];
        this.supportedCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'PT', 'AT', 'FI', 'IE'];
        this.minimumAmount = { EUR: 0.01 };
        this.maximumAmount = { EUR: 100000 };
    }
    async createPaymentIntent(request) {
        // SEPA Direct Debit implementation
        // This would integrate with your SEPA-enabled bank's API
        return {
            id: `sepa_${Date.now()}`,
            amount: request.amount,
            currency: request.currency,
            status: interfaces_1.PaymentStatus.PENDING,
            provider: this.name,
            createdAt: new Date(),
            metadata: {
                iban: request.metadata?.iban,
                mandateId: `MANDATE_${Date.now()}`
            }
        };
    }
    async getPaymentStatus(paymentId) {
        // Implement SEPA payment status check
        return interfaces_1.PaymentStatus.PENDING;
    }
    async refundPayment(paymentId, amount) {
        // For demonstration, using EUR and status as 'COMPLETED'
        return {
            id: `refund_${Date.now()}`,
            currency: 'EUR',
            status: interfaces_1.PaymentStatus.COMPLETED,
            createdAt: new Date(),
            paymentIntentId: paymentId,
            amount: amount ?? 0
        };
    }
    async validatePaymentMethod(method) {
        return {
            isValid: method === interfaces_1.PaymentMethod.SEPA,
            errors: method === interfaces_1.PaymentMethod.SEPA ? undefined : ['Unsupported payment method']
        };
    }
    getRequiredFields() {
        return ['iban', 'account_holder_name', 'mandate_acceptance'];
    }
}
exports.SEPAProvider = SEPAProvider;
