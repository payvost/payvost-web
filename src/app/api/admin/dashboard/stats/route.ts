import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const currency = searchParams.get('currency');

    console.log('🔍 Fetching dashboard statistics...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Calculate active users (users with recent activity - logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Date range filtering
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : null;
    
    // Convert dates to Firestore Timestamps
    const endTimestamp = Timestamp.fromDate(end);
    const startTimestamp = start ? Timestamp.fromDate(start) : null;

    let activeUsers = 0;
    let totalVolume = 0;
    let totalPayouts = 0;
    let transactionCount = 0;
    let previousPeriodVolume = 0;
    let previousPeriodActiveUsers = 0;
    let previousPeriodPayouts = 0;
    let previousPeriodTxCount = 0;

    // Calculate previous period for growth comparison
    let previousStart: Date | null = null;
    let previousEnd: Date | null = null;
    if (start && end) {
      const periodLength = end.getTime() - start.getTime();
      previousEnd = new Date(start.getTime() - 1);
      previousStart = new Date(previousEnd.getTime() - periodLength);
    } else {
      // Default to last 30 days, compare with previous 30 days
      previousEnd = new Date();
      previousEnd.setDate(previousEnd.getDate() - 30);
      previousStart = new Date();
      previousStart.setDate(previousStart.getDate() - 60);
    }

    // Iterate through users to calculate stats
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user was active in last 30 days
      const lastActiveDate = userData.lastActive?.toDate?.() || 
                            (userData.lastActive?._seconds ? new Date(userData.lastActive._seconds * 1000) : null) ||
                            (typeof userData.lastActive === 'string' ? new Date(userData.lastActive) : null);
      
      if (lastActiveDate && lastActiveDate >= thirtyDaysAgo) {
        activeUsers++;
      }

      // Check user's transactions subcollection
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
          const txCurrency = (tx.currency || 'USD').toUpperCase();
          
          // Filter by currency if specified
          if (currency && currency !== 'ALL' && txCurrency !== currency) {
            return;
          }
          
          transactionCount++;
          totalVolume += amount;

          // Count payouts (outgoing transactions)
          if (tx.type === 'payout' || tx.type === 'withdrawal' || tx.status === 'sent') {
            totalPayouts += amount;
          }
        });

        // Calculate previous period stats for growth
        if (previousStart && previousEnd) {
          const prevStartTimestamp = Timestamp.fromDate(previousStart);
          const prevEndTimestamp = Timestamp.fromDate(previousEnd);
          
          let prevTransactionsQuery = db
            .collection('users')
            .doc(userDoc.id)
            .collection('transactions')
            .where('createdAt', '>=', prevStartTimestamp)
            .where('createdAt', '<=', prevEndTimestamp);

          const prevTransactionsSnapshot = await prevTransactionsQuery.get();
          let prevPeriodTxCount = 0;
          let prevPeriodVolume = 0;
          let prevPeriodPayouts = 0;

          prevTransactionsSnapshot.forEach((txDoc) => {
            const tx = txDoc.data();
            const amount = parseFloat(tx.amount || 0);
            const txCurrency = (tx.currency || 'USD').toUpperCase();
            
            if (currency && currency !== 'ALL' && txCurrency !== currency) {
              return;
            }
            
            prevPeriodTxCount++;
            prevPeriodVolume += amount;

            if (tx.type === 'payout' || tx.type === 'withdrawal' || tx.status === 'sent') {
              prevPeriodPayouts += amount;
            }
          });

          previousPeriodVolume += prevPeriodVolume;
          previousPeriodPayouts += prevPeriodPayouts;
          previousPeriodTxCount += prevPeriodTxCount;
        }
      } catch (err) {
        // User might not have transactions subcollection
        console.log(`No transactions for user ${userDoc.id}`);
      }
    }

    // Calculate average transaction value
    const avgTransactionValue = transactionCount > 0 ? totalVolume / transactionCount : 0;
    const previousPeriodAvgValue = previousPeriodTxCount > 0 ? previousPeriodVolume / previousPeriodTxCount : 0;

    // Calculate growth percentages
    const volumeGrowth = previousPeriodVolume > 0 
      ? ((totalVolume - previousPeriodVolume) / previousPeriodVolume) * 100 
      : 0;
    const activeUsersGrowth = 0; // Would need to track previous period active users
    const payoutsGrowth = previousPeriodPayouts > 0
      ? ((totalPayouts - previousPeriodPayouts) / previousPeriodPayouts) * 100
      : 0;
    const avgValueGrowth = previousPeriodAvgValue > 0
      ? ((avgTransactionValue - previousPeriodAvgValue) / previousPeriodAvgValue) * 100
      : 0;

    console.log('✅ Dashboard stats calculated successfully');

    return NextResponse.json({
      totalVolume,
      activeUsers,
      totalUsers,
      totalPayouts,
      avgTransactionValue,
      transactionCount,
      growth: {
        volume: volumeGrowth,
        activeUsers: activeUsersGrowth,
        payouts: payoutsGrowth,
        avgValue: avgValueGrowth,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: error.message },
      { status: 500 }
    );
  }
}
