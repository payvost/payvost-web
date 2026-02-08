import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, HttpError } from '@/lib/api/auth';

export async function PATCH(req: NextRequest) {
  try {
    const { uid } = await requireAuth(req);

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
    if (existingTransaction.userId !== uid) {
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

    // Send notification if status changed
    if (status && status !== existingTransaction.status) {
      try {
        if (status === 'COMPLETED') {
          const { notifyTransactionSuccess, notifyDeposit, notifyLargeDeposit } = await import('@/lib/unified-notifications');
          
          // Check if this is a deposit
          if (transaction.type === 'VIRTUAL_ACCOUNT_DEPOSIT') {
            const amount = parseFloat(transaction.amount.toString());
            const currency = transaction.currency;
            
            // Send deposit notification
            await notifyDeposit(transaction.userId, amount, currency, 'External Deposit');
            
            // Check for large deposit (threshold: 1000)
            if (amount >= 1000) {
              await notifyLargeDeposit(transaction.userId, amount, currency, 1000);
            }
          } else {
            // Regular transaction success
            const recipientName = (transaction.recipientDetails as any)?.name || 'Recipient';
            await notifyTransactionSuccess(
              transaction.userId,
              parseFloat(transaction.amount.toString()),
              transaction.currency,
              recipientName,
              transaction.id
            );
          }
        } else if (status === 'FAILED') {
          const { notifyTransactionFailed } = await import('@/lib/unified-notifications');
          await notifyTransactionFailed(
            transaction.userId,
            parseFloat(transaction.amount.toString()),
            transaction.currency,
            transaction.errorMessage || 'Transaction failed',
            transaction.id
          );
        }
      } catch (notifError) {
        console.error('Error sending transaction notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('PATCH /api/external-transactions/update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
