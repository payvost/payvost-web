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

import { GET, POST } from './route';

describe('GET/POST /api/recipient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('GET proxies to backend and forwards Authorization', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/recipient');
      expect(init?.method).toBe('GET');
      expect(init?.cache).toBe('no-store');
      expect(init?.headers?.Authorization).toBe('Bearer test-token');
      return new Response(JSON.stringify({ recipients: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/recipient', {
      headers: { authorization: 'Bearer test-token' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ recipients: [] });
  });

  it('POST proxies to backend, forwards Authorization, and passes JSON body', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/recipient');
      expect(init?.method).toBe('POST');
      expect(init?.cache).toBe('no-store');
      expect(init?.headers?.Authorization).toBe('Bearer test-token');
      expect(init?.headers?.['Content-Type']).toBe('application/json');
      expect(JSON.parse(String(init?.body))).toEqual({ name: 'Jane' });
      return new Response(JSON.stringify({ recipient: { id: 'rec_1' } }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/recipient', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: JSON.stringify({ name: 'Jane' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ recipient: { id: 'rec_1' } });
  });
});
