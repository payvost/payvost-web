import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
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
    console.error('GET /api/external-transactions/stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
