import type { CardIssuerProvider, IssuerProviderName } from './types';
import { rapydIssuerProvider } from './rapyd';

export function getIssuerProvider(): CardIssuerProvider {
  const raw = String(process.env.CARD_ISSUER_PROVIDER || 'RAPYD').toUpperCase() as IssuerProviderName;
  if (raw === 'RAPYD') return rapydIssuerProvider;
  return rapydIssuerProvider;
}

