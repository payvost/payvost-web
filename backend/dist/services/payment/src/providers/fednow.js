"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FedNowProvider = void 0;
const interfaces_1 = require("../interfaces");
class FedNowProvider {
    constructor() {
        this.name = 'fednow';
        this.supportedCurrencies = ['USD'];
        this.supportedCountries = ['US'];
        this.minimumAmount = { USD: 0.01 };
        this.maximumAmount = { USD: 500000 };
    }
    async createPaymentIntent(request) {
        // FedNow implementation would go here
        // This would integrate with the FedNow API when it becomes available
        throw new Error('FedNow integration coming soon');
    }
    async getPaymentStatus(paymentId) {
        throw new Error('FedNow integration coming soon');
    }
    async refundPayment(paymentId, amount) {
        throw new Error('FedNow integration coming soon');
    }
    async validatePaymentMethod(method) {
        const isValid = method === interfaces_1.PaymentMethod.BANK_TRANSFER;
        return {
            isValid,
            errors: isValid ? undefined : ['unsupported_payment_method']
        };
    }
    getRequiredFields() {
        return ['routing_number', 'account_number', 'account_type', 'account_holder_name'];
    }
}
exports.FedNowProvider = FedNowProvider;
