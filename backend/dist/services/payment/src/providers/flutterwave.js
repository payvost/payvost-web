"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveProvider = void 0;
const interfaces_1 = require("../interfaces");
const axios_1 = __importDefault(require("axios"));
class FlutterwaveProvider {
    constructor(secretKey, publicKey) {
        this.name = 'flutterwave';
        this.supportedCurrencies = ['NGN', 'USD', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR'];
        this.supportedCountries = ['NG', 'GH', 'KE', 'UG', 'TZ', 'ZA'];
        this.minimumAmount = {
            NGN: 100,
            USD: 1,
            GHS: 1,
            KES: 100,
            UGX: 1000,
            TZS: 1000,
            ZAR: 10
        };
        this.maximumAmount = {
            NGN: 100000000,
            USD: 100000,
            GHS: 100000,
            KES: 10000000,
            UGX: 100000000,
            TZS: 100000000,
            ZAR: 1000000
        };
        this.secretKey = secretKey;
        this.publicKey = publicKey;
        this.client = axios_1.default.create({
            baseURL: 'https://api.flutterwave.com/v3',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    async createPaymentIntent(request) {
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
                status: interfaces_1.PaymentStatus.PENDING,
                clientSecret: response.data.data.link,
                provider: this.name,
                createdAt: new Date(),
                metadata: {
                    flw_ref: response.data.data.flw_ref,
                    checkout_url: response.data.data.link,
                    ...request.metadata
                }
            };
        }
        catch (error) {
            console.error('Flutterwave payment creation failed:', error);
            const axiosError = error;
            throw new Error(axiosError.response?.data?.message || 'Payment initialization failed');
        }
    }
    getPaymentOptions(method) {
        switch (method) {
            case interfaces_1.PaymentMethod.CARD:
                return 'card';
            case interfaces_1.PaymentMethod.BANK_TRANSFER:
                return 'banktransfer';
            default:
                return 'card,banktransfer,ussd';
        }
    }
    async getPaymentStatus(paymentId) {
        try {
            const response = await this.client.get(`/transactions/${paymentId}/verify`);
            if (response.data.status !== 'success') {
                throw new Error(response.data.message);
            }
            return this.mapFlutterwaveStatus(response.data.data.status);
        }
        catch (error) {
            console.error('Flutterwave status check failed:', error);
            throw new Error('Payment status check failed');
        }
    }
    mapFlutterwaveStatus(status) {
        const statusMap = {
            'successful': interfaces_1.PaymentStatus.SUCCEEDED,
            'failed': interfaces_1.PaymentStatus.FAILED,
            'pending': interfaces_1.PaymentStatus.PENDING,
            'cancelled': interfaces_1.PaymentStatus.FAILED
        };
        return statusMap[status.toLowerCase()] || interfaces_1.PaymentStatus.PENDING;
    }
    async refundPayment(paymentId, amount) {
        try {
            const response = await this.client.post('/transactions/refund', {
                id: paymentId,
                amount: amount
            });
            return {
                id: response.data.data.id.toString(),
                amount: response.data.data.amount,
                currency: response.data.data.currency,
                status: response.data.status === 'success' ? interfaces_1.PaymentStatus.SUCCEEDED : interfaces_1.PaymentStatus.FAILED,
                createdAt: new Date(),
                paymentIntentId: paymentId
            };
        }
        catch (error) {
            console.error('Flutterwave refund failed:', error);
            throw new Error('Refund failed');
        }
    }
    async validatePaymentMethod(method) {
        return {
            isValid: [interfaces_1.PaymentMethod.CARD, interfaces_1.PaymentMethod.BANK_TRANSFER].includes(method),
            errors: [interfaces_1.PaymentMethod.CARD, interfaces_1.PaymentMethod.BANK_TRANSFER].includes(method) ? undefined : ['Unsupported payment method']
        };
    }
    getRequiredFields() {
        return ['email', 'amount', 'currency', 'tx_ref'];
    }
    // Webhook handling
    async handleWebhook(payload, signature) {
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
    verifyWebhookSignature(payload, signature) {
        // Implement Flutterwave signature verification
        // https://developer.flutterwave.com/docs/integration-guides/webhooks
        return true; // TODO: Implement actual verification
    }
}
exports.FlutterwaveProvider = FlutterwaveProvider;
