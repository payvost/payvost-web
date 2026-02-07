import { apiClient } from '@/services/apiClient';
import type {
  CardControls,
  ListCardEventsResponse,
  CardSummary,
  CreateCardRequest,
  CreateCardResponse,
  ListCardTransactionsResponse,
  ListCardsResponse,
  RevealCardResponse,
} from '@/types/cards-v2';

export async function fetchCards(params?: { workspaceId?: string; workspaceType?: 'PERSONAL' | 'BUSINESS'; status?: string; limit?: number }): Promise<ListCardsResponse> {
  const query = new URLSearchParams();
  if (params?.workspaceId) query.set('workspaceId', params.workspaceId);
  if (params?.workspaceType) query.set('workspaceType', params.workspaceType);
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient.get<ListCardsResponse>(`/api/v1/cards${suffix}`);
}

export async function createCard(data: CreateCardRequest, opts?: { idempotencyKey?: string }): Promise<CreateCardResponse> {
  const options = opts?.idempotencyKey ? ({ headers: { 'Idempotency-Key': opts.idempotencyKey } } as const) : undefined;
  return apiClient.post<CreateCardResponse>('/api/v1/cards', data, options as any);
}

export async function getCard(cardId: string): Promise<{ card: CardSummary }> {
  return apiClient.get<{ card: CardSummary }>(`/api/v1/cards/${encodeURIComponent(cardId)}`);
}

export async function revealCard(cardId: string, payload?: { reason?: string }): Promise<RevealCardResponse> {
  return apiClient.post<RevealCardResponse>(`/api/v1/cards/${encodeURIComponent(cardId)}/reveal`, payload || {});
}

export async function freezeCard(cardId: string): Promise<{ status: string }> {
  return apiClient.post<{ status: string }>(`/api/v1/cards/${encodeURIComponent(cardId)}/freeze`);
}

export async function unfreezeCard(cardId: string): Promise<{ status: string }> {
  return apiClient.post<{ status: string }>(`/api/v1/cards/${encodeURIComponent(cardId)}/unfreeze`);
}

export async function terminateCard(cardId: string): Promise<{ status: string }> {
  return apiClient.post<{ status: string }>(`/api/v1/cards/${encodeURIComponent(cardId)}/terminate`);
}

export async function updateCardControls(cardId: string, patch: Record<string, unknown>): Promise<{ controls: CardControls }> {
  return apiClient.patch<{ controls: CardControls }>(`/api/v1/cards/${encodeURIComponent(cardId)}/controls`, patch);
}

export async function fetchCardTransactions(cardId: string, params?: { limit?: number }): Promise<ListCardTransactionsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient.get<ListCardTransactionsResponse>(`/api/v1/cards/${encodeURIComponent(cardId)}/transactions${suffix}`);
}

export async function fetchCardEvents(cardId: string, params?: { limit?: number }): Promise<ListCardEventsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient.get<ListCardEventsResponse>(`/api/v1/cards/${encodeURIComponent(cardId)}/events${suffix}`);
}
