import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { uid } = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);

    const items = await prisma.paymentTemplate.findMany({
      where: {
        userId: uid,
        ...(type ? { type: type as any } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/payment-templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

