import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  return {
    requireAuth: vi.fn(async () => ({ token: 'test-token', uid: 'user_1', claims: {} })),
  };
});

vi.mock('@/lib/api/auth', () => ({
  requireAuth: mocks.requireAuth,
  HttpError: class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'HttpError';
    }
  },
}));

import { GET, PATCH, DELETE } from './route';

describe('GET/PATCH/DELETE /api/recipient/:id', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('PATCH proxies to backend and passes JSON body', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/recipient/rec_123');
      expect(init?.method).toBe('PATCH');
      expect(init?.headers?.Authorization).toBe('Bearer test-token');
      expect(init?.headers?.['Content-Type']).toBe('application/json');
      expect(JSON.parse(String(init?.body))).toEqual({ name: 'New Name' });
      return new Response(JSON.stringify({ recipient: { id: 'rec_123', name: 'New Name' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/recipient/rec_123', {
      method: 'PATCH',
      headers: { authorization: 'Bearer test-token' },
      body: JSON.stringify({ name: 'New Name' }),
    });

    const res = await PATCH(req, { params: { id: 'rec_123' } });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ recipient: { id: 'rec_123', name: 'New Name' } });
  });

  it('GET proxies to backend', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/recipient/rec_123');
      expect(init?.method).toBe('GET');
      return new Response(JSON.stringify({ recipient: { id: 'rec_123' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/recipient/rec_123', {
      headers: { authorization: 'Bearer test-token' },
    });

    const res = await GET(req, { params: { id: 'rec_123' } });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ recipient: { id: 'rec_123' } });
  });

  it('DELETE proxies to backend', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/recipient/rec_123');
      expect(init?.method).toBe('DELETE');
      return new Response(null, { status: 204 });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/recipient/rec_123', {
      method: 'DELETE',
      headers: { authorization: 'Bearer test-token' },
    });

    const res = await DELETE(req, { params: { id: 'rec_123' } });
    expect(res.status).toBe(204);
  });
});
