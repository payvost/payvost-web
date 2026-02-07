import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  return {
    requireAuth: vi.fn(async () => ({ uid: 'user_1', claims: {} })),
    findMany: vi.fn(),
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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    paymentOrder: {
      findMany: mocks.findMany,
    },
  },
}));

import { GET } from './route';

describe('GET /api/payments/activity', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const setNodeEnv = (value: string | undefined) => {
    (process.env as any).NODE_ENV = value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setNodeEnv('test');
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  it('returns items + pagination on success', async () => {
    mocks.findMany.mockResolvedValueOnce([]);
    const req = new NextRequest('http://localhost/api/payments/activity?limit=25', {
      headers: { authorization: 'Bearer test' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ items: [], pagination: { limit: 25, offset: 0 } });
  });

  it('returns 503 on prisma connectivity errors', async () => {
    mocks.findMany.mockRejectedValueOnce({ name: 'PrismaClientInitializationError', message: 'db down' });
    const req = new NextRequest('http://localhost/api/payments/activity?limit=25', {
      headers: { authorization: 'Bearer test' },
    });

    const res = await GET(req);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'Service temporarily unavailable' });
  });

  it('returns migration-pending message in non-prod when schema is missing', async () => {
    mocks.findMany.mockRejectedValueOnce({
      name: 'PrismaClientKnownRequestError',
      code: 'P2021',
      message: 'Table `PaymentOrder` does not exist',
    });
    const req = new NextRequest('http://localhost/api/payments/activity?limit=25', {
      headers: { authorization: 'Bearer test' },
    });

    const res = await GET(req);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'Payments activity unavailable (migration pending)' });
  });

  it('does not leak migration-pending message in production', async () => {
    setNodeEnv('production');
    mocks.findMany.mockRejectedValueOnce({
      name: 'PrismaClientKnownRequestError',
      code: 'P2021',
      message: 'Table `PaymentOrder` does not exist',
    });

    const req = new NextRequest('http://localhost/api/payments/activity?limit=25', {
      headers: { authorization: 'Bearer test' },
    });

    const res = await GET(req);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'Service temporarily unavailable' });
  });
});
