import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    // Authorization: verify session and admin role
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifySessionCookie(sessionCookie);
    const admin = await isAdmin(decoded.uid);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    console.log('🔍 Fetching remittances...');

    const remittances: any[] = [];

    // Fetch cross-border transactions from transactions collection
    // Look for transactions that involve different countries/currencies
    try {
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          let transactionsQuery = db
            .collection('users')
            .doc(userDoc.id)
            .collection('transactions')
            .where('type', 'in', ['transfer', 'remittance', 'cross-border', 'international']);

          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            transactionsQuery = transactionsQuery
              .where('createdAt', '>=', Timestamp.fromDate(start))
              .where('createdAt', '<=', Timestamp.fromDate(end));
          }

          const transactionsSnapshot = await transactionsQuery.get();

          transactionsSnapshot.forEach((txDoc) => {
            const tx = txDoc.data();
            
            // Filter by status if provided
            if (status && status !== 'all' && tx.status?.toLowerCase() !== status.toLowerCase()) {
              return;
            }

            // Check if it's a cross-border transaction
            const sourceCountry = tx.sourceCountry || tx.fromCountry || 'UNKNOWN';
            const destCountry = tx.destinationCountry || tx.toCountry || 'UNKNOWN';
            const sourceCurrency = tx.sendCurrency || tx.currency || 'USD';
            const destCurrency = tx.receiveCurrency || tx.currency || 'USD';

            // Only include if different countries or currencies
            if (sourceCountry !== destCountry || sourceCurrency !== destCurrency) {
              const fromAmount = parseFloat(tx.sendAmount || tx.amount || 0);
              const toAmount = parseFloat(tx.receiveAmount || tx.amount || 0);
              const fxRate = toAmount > 0 && fromAmount > 0 ? (toAmount / fromAmount).toFixed(4) : '1.0000';
              
              // Calculate delivery time (mock for now, should come from provider)
              const createdAt = tx.createdAt?.toDate?.() || 
                               (tx.createdAt?._seconds ? new Date(tx.createdAt._seconds * 1000) : new Date());
              const completedAt = tx.completedAt?.toDate?.() || 
                                 (tx.completedAt?._seconds ? new Date(tx.completedAt._seconds * 1000) : null);
              
              let deliveryTime = 'N/A';
              if (completedAt && tx.status === 'Completed') {
                const diffMs = completedAt.getTime() - createdAt.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                if (diffMins < 60) {
                  deliveryTime = `${diffMins} mins`;
                } else {
                  deliveryTime = `${Math.floor(diffMins / 60)} hrs`;
                }
              }

              // Calculate profit (mock - should come from fee calculation)
              const profit = fromAmount * 0.01; // 1% margin estimate

              remittances.push({
                id: txDoc.id,
                from: sourceCountry,
                to: destCountry,
                fromAmount,
                toAmount,
                fxRate,
                partner: tx.provider || tx.channel || 'Unknown',
                channel: tx.channel || 'Bank Transfer',
                status: tx.status === 'completed' ? 'Completed' : 
                       tx.status === 'pending' ? 'Processing' : 
                       tx.status === 'failed' ? 'Failed' : 'Delayed',
                deliveryTime,
                profit,
                fromCurrency: sourceCurrency,
                toCurrency: destCurrency,
                createdAt: createdAt.toISOString(),
                userId: userDoc.id,
              });
            }
          });
        } catch (err) {
          console.log(`No transactions for user ${userDoc.id}`);
        }
      }
    } catch (err) {
      console.log('Error fetching remittances:', err);
    }

    // Sort by date (newest first)
    remittances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate stats
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24hRemittances = remittances.filter(r => new Date(r.createdAt) >= last24h);
    
    const totalVolume24h = last24hRemittances.reduce((sum, r) => sum + r.fromAmount, 0);
    const successfulPayouts24h = last24hRemittances.filter(r => r.status === 'Completed').length;
    const delayedCount = remittances.filter(r => r.status === 'Delayed').length;
    const totalProfit = remittances.reduce((sum, r) => sum + r.profit, 0);

    // Calculate average delivery time
    const completedRemittances = remittances.filter(r => r.status === 'Completed' && r.deliveryTime !== 'N/A');
    let avgDeliveryTime = 'N/A';
    if (completedRemittances.length > 0) {
      const totalMins = completedRemittances.reduce((sum, r) => {
        const mins = parseInt(r.deliveryTime.replace(/\s*(mins|hrs)/, '')) || 0;
        return sum + (r.deliveryTime.includes('hrs') ? mins * 60 : mins);
      }, 0);
      const avgMins = Math.floor(totalMins / completedRemittances.length);
      avgDeliveryTime = avgMins < 60 ? `${avgMins} mins` : `${Math.floor(avgMins / 60)} hrs`;
    }

    // Calculate top corridors
    const corridorMap = new Map<string, { volume: number; count: number }>();
    remittances.forEach(r => {
      const corridor = `${r.from} → ${r.to}`;
      const existing = corridorMap.get(corridor) || { volume: 0, count: 0 };
      corridorMap.set(corridor, {
        volume: existing.volume + r.fromAmount,
        count: existing.count + 1,
      });
    });
    const topCorridors = Array.from(corridorMap.entries())
      .map(([corridor, data]) => ({ corridor, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Calculate partner performance
    const partnerMap = new Map<string, { total: number; successful: number; totalTime: number; count: number }>();
    remittances.forEach(r => {
      const existing = partnerMap.get(r.partner) || { total: 0, successful: 0, totalTime: 0, count: 0 };
      const newData = {
        total: existing.total + 1,
        successful: existing.successful + (r.status === 'Completed' ? 1 : 0),
        totalTime: existing.totalTime + (r.deliveryTime !== 'N/A' ? parseInt(r.deliveryTime.replace(/\s*(mins|hrs)/, '')) || 0 : 0),
        count: existing.count + (r.deliveryTime !== 'N/A' ? 1 : 0),
      };
      partnerMap.set(r.partner, newData);
    });
    const partnerPerformance = Array.from(partnerMap.entries())
      .map(([partner, data]) => ({
        partner,
        successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
        avgTime: data.count > 0 ? `${Math.floor(data.totalTime / data.count)} mins` : 'N/A',
      }))
      .sort((a, b) => b.successRate - a.successRate);

    console.log(`✅ Found ${remittances.length} remittances`);

    return NextResponse.json({
      remittances,
      stats: {
        totalVolume24h,
        successfulPayouts24h,
        avgDeliveryTime,
        delayedCount,
        totalProfit,
        topCorridors,
        partnerPerformance,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching remittances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch remittances', details: error.message },
      { status: 500 }
    );
  }
}

