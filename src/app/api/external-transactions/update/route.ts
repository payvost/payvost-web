import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function PATCH(req: NextRequest) {
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
      id,
      providerTransactionId: searchByProviderTxId,
      status,
      providerTransactionId,
      errorMessage,
      webhookReceived,
      webhookData,
      completedAt,
    } = body;

    // Must provide either id or providerTransactionId to identify the transaction
    if (!id && !searchByProviderTxId) {
      return NextResponse.json(
        { error: 'Must provide either id or providerTransactionId' },
        { status: 400 }
      );
    }

    // Find the transaction
    const whereClause = id
      ? { id }
      : { providerTransactionId: searchByProviderTxId };

    const existingTransaction = await prisma.externalTransaction.findFirst({
      where: whereClause,
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify the transaction belongs to the authenticated user
    if (existingTransaction.userId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (providerTransactionId !== undefined) updateData.providerTransactionId = providerTransactionId;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (webhookReceived !== undefined) updateData.webhookReceived = webhookReceived;
    if (webhookData !== undefined) updateData.webhookData = webhookData;
    if (completedAt !== undefined) updateData.completedAt = new Date(completedAt);
    
    // Auto-set completedAt if status is COMPLETED and it's not already set
    if (status === 'COMPLETED' && !existingTransaction.completedAt && completedAt === undefined) {
      updateData.completedAt = new Date();
    }

    // Update transaction
    const transaction = await prisma.externalTransaction.update({
      where: { id: existingTransaction.id },
      data: updateData,
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('PATCH /api/external-transactions/update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
