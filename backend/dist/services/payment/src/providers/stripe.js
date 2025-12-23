"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeProvider = void 0;
const interfaces_1 = require("../interfaces");
const stripe_1 = __importDefault(require("stripe"));
class StripeProvider {
    constructor(apiKey) {
        this.name = 'stripe';
        this.supportedCurrencies = ['USD', 'EUR', 'GBP'];
        this.supportedCountries = ['US', 'GB', 'DE', 'FR', 'ES', 'IT'];
        this.minimumAmount = { USD: 0.5, EUR: 0.5, GBP: 0.3 };
        this.maximumAmount = { USD: 999999.99, EUR: 999999.99, GBP: 999999.99 };
        this.stripe = new stripe_1.default(apiKey, { apiVersion: '2023-10-16' });
    }
    async createPaymentIntent(request) {
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
    getPaymentMethodTypes(request) {
        switch (request.paymentMethod) {
            case interfaces_1.PaymentMethod.CARD:
                return ['card'];
            case interfaces_1.PaymentMethod.SEPA:
                return ['sepa_debit'];
            default:
                return ['card'];
        }
    }
    mapStripeStatus(status) {
        const statusMap = {
            'requires_payment_method': interfaces_1.PaymentStatus.PENDING,
            'requires_confirmation': interfaces_1.PaymentStatus.PENDING,
            'processing': interfaces_1.PaymentStatus.PROCESSING,
            'succeeded': interfaces_1.PaymentStatus.SUCCEEDED,
            'canceled': interfaces_1.PaymentStatus.FAILED
        };
        return statusMap[status] || interfaces_1.PaymentStatus.PENDING;
    }
    async getPaymentStatus(paymentId) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
        return this.mapStripeStatus(paymentIntent.status);
    }
    async refundPayment(paymentId, amount) {
        const refund = await this.stripe.refunds.create({
            payment_intent: paymentId,
            amount: amount ? Math.round(amount * 100) : undefined
        });
        // Return RefundResult
        return {
            id: refund.id,
            amount: refund.amount / 100,
            currency: refund.currency.toUpperCase(),
            status: refund.status === 'succeeded' ? interfaces_1.PaymentStatus.SUCCEEDED : interfaces_1.PaymentStatus.FAILED,
            createdAt: new Date(refund.created * 1000),
            paymentIntentId: paymentId
        };
    }
    async validatePaymentMethod(method) {
        return {
            isValid: method === interfaces_1.PaymentMethod.CARD || method === interfaces_1.PaymentMethod.SEPA,
            errors: [],
        };
    }
    getRequiredFields() {
        return ['card_number', 'expiry_month', 'expiry_year', 'cvc'];
    }
}
exports.StripeProvider = StripeProvider;
