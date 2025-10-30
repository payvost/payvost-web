"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProviderRegistry = void 0;
const stripe_1 = require("./stripe");
const fednow_1 = require("./fednow");
const sepa_1 = require("./sepa");
const paystack_1 = require("./paystack");
const flutterwave_1 = require("./flutterwave");
class PaymentProviderRegistryClass {
    constructor() {
        this.providers = new Map();
        // Initialize with default providers
        if (process.env.STRIPE_SECRET_KEY) {
            this.register(new stripe_1.StripeProvider(process.env.STRIPE_SECRET_KEY));
        }
        if (process.env.PAYSTACK_SECRET_KEY) {
            this.register(new paystack_1.PaystackProvider(process.env.PAYSTACK_SECRET_KEY));
        }
        if (process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_PUBLIC_KEY) {
            this.register(new flutterwave_1.FlutterwaveProvider(process.env.FLUTTERWAVE_SECRET_KEY, process.env.FLUTTERWAVE_PUBLIC_KEY));
        }
        this.register(new fednow_1.FedNowProvider());
        this.register(new sepa_1.SEPAProvider());
    }
    register(provider) {
        this.providers.set(provider.name, provider);
    }
    get(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Payment provider ${providerName} not found`);
        }
        return provider;
    }
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    getProviderForCurrency(currency) {
        return this.getAllProviders().filter(provider => provider.supportedCurrencies.includes(currency));
    }
    getProviderForCountry(country) {
        return this.getAllProviders().filter(provider => provider.supportedCountries.includes(country));
    }
}
exports.PaymentProviderRegistry = new PaymentProviderRegistryClass();
