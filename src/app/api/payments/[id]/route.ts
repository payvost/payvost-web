import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { uid, claims } = await requireAuth(req);
    const id = String(params?.id || '');

    const order = await prisma.paymentOrder.findUnique({
      where: { id },
      include: { attempts: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isAdmin =
      typeof claims?.role === 'string' && ['admin', 'super-admin'].includes((claims.role as string).toLowerCase());
    if (order.userId !== uid && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const externalTransaction = order.externalTxId
      ? await prisma.externalTransaction.findUnique({ where: { id: order.externalTxId } })
      : null;

    return NextResponse.json({ paymentOrder: order, externalTransaction });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/payments/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

