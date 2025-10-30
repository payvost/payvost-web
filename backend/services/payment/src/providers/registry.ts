import { PaymentProvider } from '../interfaces';
import { StripeProvider } from './stripe';
import { FedNowProvider } from './fednow';
import { SEPAProvider } from './sepa';
import { PaystackProvider } from './paystack';
import { FlutterwaveProvider } from './flutterwave';

class PaymentProviderRegistryClass {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    // Initialize with default providers
    if (process.env.STRIPE_SECRET_KEY) {
      this.register(new StripeProvider(process.env.STRIPE_SECRET_KEY));
    }
    if (process.env.PAYSTACK_SECRET_KEY) {
      this.register(new PaystackProvider(process.env.PAYSTACK_SECRET_KEY));
    }
    if (process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_PUBLIC_KEY) {
      this.register(new FlutterwaveProvider(
        process.env.FLUTTERWAVE_SECRET_KEY,
        process.env.FLUTTERWAVE_PUBLIC_KEY
      ));
    }
    this.register(new FedNowProvider());
    this.register(new SEPAProvider());
  }

  register(provider: PaymentProvider) {
    this.providers.set(provider.name, provider);
  }

  get(providerName: string): PaymentProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }
    return provider;
  }

  getAllProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderForCurrency(currency: string): PaymentProvider[] {
    return this.getAllProviders().filter(provider => 
      provider.supportedCurrencies.includes(currency)
    );
  }

  getProviderForCountry(country: string): PaymentProvider[] {
    return this.getAllProviders().filter(provider => 
      provider.supportedCountries.includes(country)
    );
  }
}

export const PaymentProviderRegistry = new PaymentProviderRegistryClass();