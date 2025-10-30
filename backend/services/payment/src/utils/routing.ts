import { PaymentRequestDTO, PaymentProvider } from '../interfaces';
import { PaymentProviderRegistry } from '../providers/registry';

interface ProviderScore {
  provider: PaymentProvider;
  score: number;
}

export async function determineOptimalProvider(request: PaymentRequestDTO): Promise<PaymentProvider> {
  const { currency, amount, sourceCountry, destinationCountry, paymentMethod } = request;
  
  // Get all providers that support this currency
  const eligibleProviders = PaymentProviderRegistry.getProviderForCurrency(currency)
    .filter(provider => {
      // Check amount limits
      const minAmount = provider.minimumAmount[currency] || 0;
      const maxAmount = provider.maximumAmount[currency] || Infinity;
      return amount >= minAmount && amount <= maxAmount;
    })
    .filter(provider => {
      // Check country support
      return provider.supportedCountries.includes(sourceCountry) &&
             provider.supportedCountries.includes(destinationCountry);
    });

  if (eligibleProviders.length === 0) {
    throw new Error('No eligible payment provider found for this transaction');
  }

  // Score providers based on various factors
  const scoredProviders: ProviderScore[] = await Promise.all(
    eligibleProviders.map(async provider => {
      let score = 0;

      // Prefer local providers for domestic transactions
      if (sourceCountry === destinationCountry) {
        if (
          (sourceCountry === 'NG' && ['paystack', 'flutterwave'].includes(provider.name)) ||
          (sourceCountry === 'US' && provider.name === 'fednow') ||
          (sourceCountry.match(/^(DE|FR|IT|ES)$/) && provider.name === 'sepa')
        ) {
          score += 10;
        }
      }

      // Check payment method support
      const methodSupport = await provider.validatePaymentMethod(paymentMethod);
      if (methodSupport.isValid) {
        score += 5;
      }

      // Add provider-specific scoring
      switch (provider.name) {
        case 'paystack':
          if (currency === 'NGN') score += 8;
          if (['NG', 'GH'].includes(sourceCountry)) score += 5;
          break;
        case 'flutterwave':
          if (['NGN', 'KES', 'GHS'].includes(currency)) score += 8;
          if (['NG', 'KE', 'GH', 'ZA'].includes(sourceCountry)) score += 5;
          break;
        case 'stripe':
          if (['USD', 'EUR', 'GBP'].includes(currency)) score += 8;
          if (paymentMethod === 'CARD') score += 5;
          break;
        case 'sepa':
          if (currency === 'EUR' && sourceCountry.match(/^(DE|FR|IT|ES)$/)) score += 15;
          break;
      }

      return { provider, score };
    })
  );

  // Sort by score and return the highest scoring provider
  scoredProviders.sort((a, b) => b.score - a.score);
  return scoredProviders[0].provider;
}