import { buildBackendUrl } from '@/lib/api/backend';

export class BackendFetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public bodyText?: string
  ) {
    super(message);
    this.name = 'BackendFetchError';
  }
}

export async function backendFetchJson<T>(
  token: string | null,
  path: string,
  init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers || {}),
  };
  if (token) {
    headers.Authorization = headers.Authorization || `Bearer ${token}`;
  }
  if (!headers['Content-Type'] && init.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildBackendUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new BackendFetchError(
      `Backend request failed (${response.status}) for ${path}`,
      response.status,
      text
    );
  }

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Best-effort: when backend returns non-JSON, surface it.
    throw new BackendFetchError(
      `Expected JSON response from backend for ${path}`,
      response.status,
      text
    );
  }
}

