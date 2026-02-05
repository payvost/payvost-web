import { apiClient } from '@/services/apiClient';
import type { CreateVirtualCardInput, VirtualCardData } from '@/types/virtual-card';

export interface CardsResponse {
  cards: VirtualCardData[];
}

export interface CreateCardResponse {
  card: VirtualCardData;
}

export interface RevealCardResponse {
  cardId: string;
  last4: string;
  maskedNumber?: string;
  expiry?: string;
  fullNumber?: string;
  cvv?: string;
}

export interface UpdateCardStatusResponse {
  status: 'active' | 'frozen' | 'terminated';
}

export interface SyncCardsResponse {
  scope: 'me' | 'all';
  synced: number;
  failed: number;
}

export async function fetchCards(): Promise<CardsResponse> {
  return apiClient.get<CardsResponse>('/api/cards');
}

export async function createCard(data: CreateVirtualCardInput): Promise<CreateCardResponse> {
  return apiClient.post<CreateCardResponse>('/api/cards', data);
}

export async function revealCard(cardId: string): Promise<RevealCardResponse> {
  return apiClient.post<RevealCardResponse>(`/api/cards/${cardId}/reveal`);
}

export async function updateCardStatus(cardId: string, action: 'freeze' | 'unfreeze'): Promise<UpdateCardStatusResponse> {
  return apiClient.patch<UpdateCardStatusResponse>(`/api/cards/${cardId}/status`, { action });
}

export async function syncCards(scope: 'me' | 'all' = 'me'): Promise<SyncCardsResponse> {
  const query = scope === 'all' ? '?scope=all' : '';
  return apiClient.post<SyncCardsResponse>(`/api/cards/sync${query}`);
}
