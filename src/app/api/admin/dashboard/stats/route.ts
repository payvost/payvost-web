import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('🔍 Fetching dashboard statistics...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Calculate active users (users with recent activity - logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let activeUsers = 0;
    let totalVolume = 0;
    let totalPayouts = 0;
    let transactionCount = 0;

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
        const transactionsSnapshot = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions')
          .get();

        transactionsSnapshot.forEach((txDoc) => {
          const tx = txDoc.data();
          const amount = parseFloat(tx.amount || 0);
          
          transactionCount++;
          totalVolume += amount;

          // Count payouts (outgoing transactions)
          if (tx.type === 'payout' || tx.type === 'withdrawal' || tx.status === 'sent') {
            totalPayouts += amount;
          }
        });
      } catch (err) {
        // User might not have transactions subcollection
        console.log(`No transactions for user ${userDoc.id}`);
      }
    }

    // Calculate average transaction value
    const avgTransactionValue = transactionCount > 0 ? totalVolume / transactionCount : 0;

    // Calculate growth percentages (mocked for now - would need historical data)
    const volumeGrowth = 20.1;
    const activeUsersGrowth = 180.1;
    const payoutsGrowth = 19.0;
    const avgValueGrowth = 12.8;

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
