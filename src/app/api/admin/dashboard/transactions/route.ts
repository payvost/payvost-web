import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`🔍 Fetching recent ${limit} transactions...`);

    const recentTransactions: any[] = [];

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    // Collect transactions from all users
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      try {
        const transactionsSnapshot = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions')
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();

        transactionsSnapshot.forEach((txDoc) => {
          const tx = txDoc.data();
          
          recentTransactions.push({
            id: txDoc.id,
            customer: userData.name || userData.displayName || 'Unknown',
            email: userData.email || 'No email',
            amount: parseFloat(tx.amount || 0),
            currency: tx.currency || 'USD',
            status: tx.status || 'completed',
            type: tx.type || 'transfer',
            date: tx.createdAt?.toDate?.() || 
                  (tx.createdAt?._seconds ? new Date(tx.createdAt._seconds * 1000) : null) ||
                  (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date()),
            description: tx.description || '',
          });
        });
      } catch (err) {
        // User might not have transactions subcollection
        console.log(`No transactions for user ${userDoc.id}`);
      }
    }

    // Sort by date descending and limit
    recentTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    const limitedTransactions = recentTransactions.slice(0, limit);

    console.log(`✅ Found ${limitedTransactions.length} transactions`);

    return NextResponse.json({
      transactions: limitedTransactions,
      total: limitedTransactions.length,
    });
  } catch (error: any) {
    console.error('❌ Error fetching recent transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent transactions', details: error.message },
      { status: 500 }
    );
  }
}
