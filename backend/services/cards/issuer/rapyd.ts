import type { CardIssuerProvider } from './types';
import { rapydService, type CreateIssuedCardRequest, type IssuedCard, type UpdateIssuedCardStatusRequest } from '../../rapyd';

export const rapydIssuerProvider: CardIssuerProvider = {
  name: 'RAPYD',
  createIssuedCard: (input: CreateIssuedCardRequest): Promise<IssuedCard> => rapydService.createIssuedCard(input),
  getIssuedCard: (providerCardId: string): Promise<IssuedCard> => rapydService.getIssuedCard(providerCardId),
  updateIssuedCardStatus: (input: UpdateIssuedCardStatusRequest) => rapydService.updateIssuedCardStatus(input),
};

