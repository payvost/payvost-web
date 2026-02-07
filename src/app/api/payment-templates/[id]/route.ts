import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(req);
    const id = String(params?.id || '');

    const template = await prisma.paymentTemplate.findUnique({ where: { id } });
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (template.userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.paymentTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('DELETE /api/payment-templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

