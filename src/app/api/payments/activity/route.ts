import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { uid, claims } = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const requestedUserId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    const isAdmin =
      typeof claims?.role === 'string' && ['admin', 'super-admin'].includes((claims.role as string).toLowerCase());
    const userId = requestedUserId || uid;

    if (requestedUserId && requestedUserId !== uid && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.paymentOrder.findMany({
      where: {
        userId,
        ...(type ? { type: type as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { attempts: true },
    });

    return NextResponse.json({ items, pagination: { limit, offset } });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/payments/activity error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

