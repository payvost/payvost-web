import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('GET /api/currency/supported', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('proxies to backend and forwards Authorization', async () => {
    process.env.BACKEND_URL = 'https://backend.example.com';

    const fetchMock = vi.fn(async (_url: any, init?: any) => {
      expect(String(_url)).toBe('https://backend.example.com/api/currency/supported');
      expect(init?.method).toBe('GET');
      expect(init?.cache).toBe('no-store');
      expect(init?.headers?.Authorization).toBe('Bearer test-token');
      return new Response(JSON.stringify({ currencies: ['USD'] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    (globalThis as any).fetch = fetchMock;

    const req = new NextRequest('http://localhost/api/currency/supported', {
      headers: { authorization: 'Bearer test-token' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ currencies: ['USD'] });
  });
});
