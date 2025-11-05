import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, HttpError } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    const { uid, claims } = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const isAdmin = typeof claims?.role === 'string' && ['admin', 'super-admin'].includes((claims.role as string).toLowerCase());
    const userId = requestedUserId || uid;

    if (requestedUserId && requestedUserId !== uid && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [total, completed, pending, failed] = await Promise.all([
      prisma.externalTransaction.count({ where: { userId } }),
      prisma.externalTransaction.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.externalTransaction.count({ where: { userId, status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.externalTransaction.count({ where: { userId, status: 'FAILED' } }),
    ]);

    const totalAmountAgg = await prisma.externalTransaction.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      total,
      completed,
      pending,
      failed,
      totalAmount: Number(totalAmountAgg._sum.amount || 0),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('GET /api/external-transactions/stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
