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

import { POST } from './route';

describe('POST /api/payouts', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('proxies to backend and forwards Authorization', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/payouts');
      expect(init?.method).toBe('POST');
      expect(init?.cache).toBe('no-store');
      expect(init?.headers?.Authorization).toBe('Bearer test-token');
      expect(init?.headers?.['Content-Type']).toBe('application/json');
      expect(JSON.parse(String(init?.body))).toEqual({ amount: 10 });
      return new Response(JSON.stringify({ payout: { id: 'po_1' } }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/payouts', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ payout: { id: 'po_1' } });
  });
});
