import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, HttpError } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await requireAuth(req);

    const body = await req.json();
    const {
      userId,
      accountId,
      provider,
      providerTransactionId,
      type,
      amount,
      currency,
      recipientDetails,
      metadata,
    } = body;

    // Verify the userId matches the authenticated user
    if (userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    if (!userId || !provider || !type || amount === undefined || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, provider, type, amount, currency' },
        { status: 400 }
      );
    }

    // Create transaction record
    const transaction = await prisma.externalTransaction.create({
      data: {
        userId,
        accountId,
        provider,
        providerTransactionId,
        type,
        amount,
        currency,
        status: 'PENDING',
        recipientDetails: recipientDetails || {},
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('POST /api/external-transactions/create error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
