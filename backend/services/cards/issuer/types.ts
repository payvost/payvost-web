import type { CreateIssuedCardRequest, IssuedCard, UpdateIssuedCardStatusRequest } from '../../rapyd';

export type IssuerProviderName = 'RAPYD';

export interface CardIssuerProvider {
  name: IssuerProviderName;
  createIssuedCard(input: CreateIssuedCardRequest): Promise<IssuedCard>;
  getIssuedCard(providerCardId: string): Promise<IssuedCard>;
  updateIssuedCardStatus(input: UpdateIssuedCardStatusRequest): Promise<{ id?: string; status?: string } | unknown>;
}

