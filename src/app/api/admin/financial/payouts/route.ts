import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 Fetching payouts...');

    let payoutsQuery: any = db.collection('payouts');

    if (status && status !== 'all') {
      payoutsQuery = payoutsQuery.where('status', '==', status);
    }

    if (startDate && endDate) {
      const start = Timestamp.fromDate(new Date(startDate));
      const end = Timestamp.fromDate(new Date(endDate));
      payoutsQuery = payoutsQuery
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end);
    }

    payoutsQuery = payoutsQuery.orderBy('createdAt', 'desc').limit(limit);

    const snapshot = await payoutsQuery.get();
    const payouts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      scheduledAt: doc.data().scheduledAt?.toDate?.()?.toISOString(),
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString(),
    }));

    // Calculate summary stats
    const totalProcessed = payouts
      .filter((p: any) => p.status === 'Completed')
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

    const pendingAmount = payouts
      .filter((p: any) => p.status === 'Pending' || p.status === 'Scheduled')
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

    const failedCount = payouts.filter((p: any) => p.status === 'Failed').length;
    const scheduledCount = payouts.filter((p: any) => p.status === 'Scheduled').length;

    return NextResponse.json({
      payouts,
      summary: {
        totalProcessed,
        pendingAmount,
        failedCount,
        scheduledCount,
        totalCount: payouts.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({
      payouts: [],
      summary: {
        totalProcessed: 0,
        pendingAmount: 0,
        failedCount: 0,
        scheduledCount: 0,
        totalCount: 0,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, currency, method, scheduledAt, description } = body;

    const payout = {
      userId,
      amount: parseFloat(amount),
      currency,
      method,
      status: scheduledAt ? 'Scheduled' : 'Pending',
      scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
      createdAt: Timestamp.now(),
      description,
    };

    const docRef = await db.collection('payouts').add(payout);

    return NextResponse.json({ success: true, id: docRef.id, payout });
  } catch (error: any) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const updates: any = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    if (updateData.status === 'Completed') {
      updates.completedAt = Timestamp.now();
    }

    await db.collection('payouts').doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating payout:', error);
    return NextResponse.json(
      { error: 'Failed to update payout' },
      { status: 500 }
    );
  }
}

