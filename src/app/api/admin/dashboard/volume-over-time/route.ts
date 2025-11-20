import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const currency = searchParams.get('currency');

    console.log('🔍 Fetching transaction volume over time...');

    // Default to last 6 months if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      return date;
    })();

    // Group transactions by month
    const monthlyData: Record<string, { volume: number; payouts: number }> = {};

    // Generate months based on date range
    const months = [];
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    let currentMonth = new Date(startMonth);
    while (currentMonth <= endMonth) {
      const monthKey = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push({ month: monthKey, date: new Date(currentMonth) });
      monthlyData[monthKey] = { volume: 0, payouts: 0 };
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    // Convert dates to Firestore Timestamps
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    // Collect transactions from all users
    for (const userDoc of usersSnapshot.docs) {
      try {
        let transactionsQuery = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions')
          .where('createdAt', '>=', startTimestamp)
          .where('createdAt', '<=', endTimestamp);

        const transactionsSnapshot = await transactionsQuery.get();

        transactionsSnapshot.forEach((txDoc) => {
          const tx = txDoc.data();
          const amount = parseFloat(tx.amount || 0);
          const txCurrency = tx.currency || 'USD';
          const txDate = tx.createdAt?.toDate?.() || 
                        (tx.createdAt?._seconds ? new Date(tx.createdAt._seconds * 1000) : null) ||
                        (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : null);

          // Filter by currency if specified
          if (currency && currency !== 'ALL' && txCurrency !== currency) {
            return;
          }

          if (txDate) {
            const monthKey = txDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            
            if (monthlyData[monthKey]) {
              monthlyData[monthKey].volume += amount;
              
              // Count payouts (outgoing transactions)
              if (tx.type === 'payout' || tx.type === 'withdrawal' || tx.status === 'sent') {
                monthlyData[monthKey].payouts += amount;
              }
            }
          }
        });
      } catch (err) {
        console.log(`No transactions for user ${userDoc.id}`);
      }
    }

    // Format data for chart
    const chartData = months.map(({ month }) => ({
      month,
      volume: Math.round(monthlyData[month].volume),
      payouts: Math.round(monthlyData[month].payouts),
    }));

    console.log('✅ Transaction volume data calculated successfully');

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    console.error('❌ Error fetching volume over time:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume over time data', details: error.message },
      { status: 500 }
    );
  }
}

