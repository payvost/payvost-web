"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackProvider = void 0;
const interfaces_1 = require("../interfaces");
const axios_1 = __importDefault(require("axios"));
class PaystackProvider {
    constructor(secretKey) {
        this.name = 'paystack';
        this.supportedCurrencies = ['NGN', 'GHS', 'USD', 'ZAR'];
        this.supportedCountries = ['NG', 'GH', 'ZA', 'KE'];
        this.minimumAmount = {
            NGN: 100, // Minimum amount in kobo
            GHS: 0.5,
            USD: 1,
            ZAR: 20
        };
        this.maximumAmount = {
            NGN: 30000000,
            GHS: 50000,
            USD: 50000,
            ZAR: 500000
        };
        this.secretKey = secretKey;
        this.client = axios_1.default.create({
            baseURL: 'https://api.paystack.co',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    async createPaymentIntent(request) {
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
                status: interfaces_1.PaymentStatus.PENDING,
                clientSecret: response.data.data.access_code,
                provider: this.name,
                createdAt: new Date(),
                metadata: {
                    authorization_url: response.data.data.authorization_url,
                    ...request.metadata
                }
            };
        }
        catch (error) {
            console.error('Paystack payment creation failed:', error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Payment initialization failed');
            }
            throw new Error('Payment initialization failed');
        }
    }
    async getPaymentStatus(paymentId) {
        try {
            const response = await this.client.get(`/transaction/verify/${paymentId}`);
            if (!response.data.status) {
                throw new Error(response.data.message);
            }
            const status = response.data.data.status;
            return this.mapPaystackStatus(status);
        }
        catch (error) {
            console.error('Paystack status check failed:', error);
            throw new Error('Payment status check failed');
        }
    }
    mapPaystackStatus(status) {
        const statusMap = {
            'success': interfaces_1.PaymentStatus.SUCCEEDED,
            'failed': interfaces_1.PaymentStatus.FAILED,
            'pending': interfaces_1.PaymentStatus.PENDING,
            'abandoned': interfaces_1.PaymentStatus.EXPIRED
        };
        return statusMap[status.toLowerCase()] || interfaces_1.PaymentStatus.PENDING;
    }
    async refundPayment(paymentId, amount) {
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
        }
        catch (error) {
            console.error('Paystack refund failed:', error);
            throw new Error('Refund failed');
        }
    }
    async validatePaymentMethod(method) {
        const isValid = [interfaces_1.PaymentMethod.CARD, interfaces_1.PaymentMethod.BANK_TRANSFER].includes(method);
        return {
            isValid,
            errors: isValid ? undefined : ['unsupported_payment_method']
        };
    }
    getRequiredFields() {
        return ['email', 'amount', 'currency'];
    }
    // Webhook handling
    async handleWebhook(payload, signature) {
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
    verifyWebhookSignature(payload, signature) {
        // Implement Paystack signature verification
        // https://paystack.com/docs/payments/webhooks#verifying-webhook-requests
        return true; // TODO: Implement actual verification
    }
}
exports.PaystackProvider = PaystackProvider;
