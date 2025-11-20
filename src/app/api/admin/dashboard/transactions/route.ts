import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const currency = searchParams.get('currency');

    console.log(`🔍 Fetching recent ${limit} transactions...`);

    const recentTransactions: any[] = [];

    // Date range filtering
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : null;
    
    // Convert dates to Firestore Timestamps
    const endTimestamp = Timestamp.fromDate(end);
    const startTimestamp = start ? Timestamp.fromDate(start) : null;

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    // Collect transactions from all users
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      try {
        let transactionsQuery = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions');

        if (startTimestamp) {
          transactionsQuery = transactionsQuery
            .where('createdAt', '>=', startTimestamp)
            .where('createdAt', '<=', endTimestamp)
            .orderBy('createdAt', 'desc')
            .limit(limit * 2); // Get more to account for currency filtering
        } else {
          transactionsQuery = transactionsQuery
            .where('createdAt', '<=', endTimestamp)
            .orderBy('createdAt', 'desc')
            .limit(limit * 2);
        }

        const transactionsSnapshot = await transactionsQuery.get();

        transactionsSnapshot.forEach((txDoc) => {
          const tx = txDoc.data();
          const txCurrency = (tx.currency || 'USD').toUpperCase();
          
          // Filter by currency if specified
          if (currency && currency !== 'ALL' && txCurrency !== currency) {
            return;
          }
          
          const txDate = tx.createdAt?.toDate?.() || 
                        (tx.createdAt?._seconds ? new Date(tx.createdAt._seconds * 1000) : null) ||
                        (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date());
          
          recentTransactions.push({
            id: txDoc.id,
            customer: userData.name || userData.displayName || 'Unknown',
            email: userData.email || 'No email',
            amount: parseFloat(tx.amount || 0),
            currency: txCurrency,
            status: tx.status || 'completed',
            type: tx.type || 'transfer',
            date: txDate.toISOString(),
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
