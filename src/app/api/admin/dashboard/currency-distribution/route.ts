import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('🔍 Fetching currency distribution...');

    // Default to all time if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : null;
    
    // Convert dates to Firestore Timestamps
    const endTimestamp = Timestamp.fromDate(end);
    const startTimestamp = start ? Timestamp.fromDate(start) : null;

    const currencyTotals: Record<string, number> = {};

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    // Collect transactions from all users
    for (const userDoc of usersSnapshot.docs) {
      try {
        let transactionsQuery = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions');

        if (startTimestamp) {
          transactionsQuery = transactionsQuery
            .where('createdAt', '>=', startTimestamp)
            .where('createdAt', '<=', endTimestamp);
        } else {
          transactionsQuery = transactionsQuery.where('createdAt', '<=', endTimestamp);
        }

        const transactionsSnapshot = await transactionsQuery.get();

        transactionsSnapshot.forEach((txDoc) => {
          const tx = txDoc.data();
          const amount = parseFloat(tx.amount || 0);
          const currency = (tx.currency || 'USD').toUpperCase();

          if (!currencyTotals[currency]) {
            currencyTotals[currency] = 0;
          }
          currencyTotals[currency] += amount;
        });
      } catch (err) {
        console.log(`No transactions for user ${userDoc.id}`);
      }
    }

    // Format data for chart - get top currencies and group others
    const sortedCurrencies = Object.entries(currencyTotals)
      .sort(([, a], [, b]) => b - a);

    const topCurrencies = sortedCurrencies.slice(0, 4);
    const otherTotal = sortedCurrencies.slice(4).reduce((sum, [, amount]) => sum + amount, 0);

    const chartData = topCurrencies.map(([currency, value]) => ({
      name: currency,
      value: Math.round(value),
    }));

    if (otherTotal > 0) {
      chartData.push({
        name: 'OTHER',
        value: Math.round(otherTotal),
      });
    }

    console.log('✅ Currency distribution calculated successfully');

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    console.error('❌ Error fetching currency distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency distribution', details: error.message },
      { status: 500 }
    );
  }
}

