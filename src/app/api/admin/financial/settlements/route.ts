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

    console.log('🔍 Fetching settlements...');

    // Try to get settlements from Firestore
    let settlementsQuery: any = db.collection('settlements');

    // Apply filters
    if (status && status !== 'all') {
      settlementsQuery = settlementsQuery.where('status', '==', status);
    }

    if (startDate && endDate) {
      const start = Timestamp.fromDate(new Date(startDate));
      const end = Timestamp.fromDate(new Date(endDate));
      settlementsQuery = settlementsQuery
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end);
    }

    settlementsQuery = settlementsQuery.orderBy('createdAt', 'desc').limit(limit);

    const snapshot = await settlementsQuery.get();
    const settlements = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString(),
    }));

    // Calculate summary stats
    const totalSettled = settlements
      .filter((s: any) => s.status === 'Completed')
      .reduce((sum: number, s: any) => sum + (parseFloat(s.amount) || 0), 0);

    const pendingAmount = settlements
      .filter((s: any) => s.status === 'Pending' || s.status === 'In Progress')
      .reduce((sum: number, s: any) => sum + (parseFloat(s.amount) || 0), 0);

    const failedCount = settlements.filter((s: any) => s.status === 'Failed').length;

    return NextResponse.json({
      settlements,
      summary: {
        totalSettled,
        pendingAmount,
        failedCount,
        totalCount: settlements.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching settlements:', error);
    // Return mock data if Firestore query fails (for development)
    return NextResponse.json({
      settlements: [],
      summary: {
        totalSettled: 0,
        pendingAmount: 0,
        failedCount: 0,
        totalCount: 0,
      },
    });
  }
}

