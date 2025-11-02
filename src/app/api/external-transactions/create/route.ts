import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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
    if (userId !== decodedToken.uid) {
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
    console.error('POST /api/external-transactions/create error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
