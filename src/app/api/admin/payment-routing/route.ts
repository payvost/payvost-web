import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';
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

    console.log('🔍 Fetching payment routing data...');

    // Fetch transactions to analyze provider performance
    const providerStats = new Map<string, {
      totalTransactions: number;
      successfulTransactions: number;
      totalVolume: number;
      totalResponseTime: number;
      responseTimeCount: number;
      errors: number;
    }>();

    const allTransactions: any[] = [];

    try {
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const transactionsSnapshot = await userDoc.ref.collection('transactions').get();
          
          transactionsSnapshot.forEach((txDoc) => {
            const tx = txDoc.data();
            const provider = tx.provider || tx.channel || 'Unknown';
            
            allTransactions.push({
              id: txDoc.id,
              provider,
              status: tx.status || 'unknown',
              amount: parseFloat(tx.amount || 0),
              currency: tx.currency || 'USD',
              createdAt: tx.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            });

            // Update provider stats
            const stats = providerStats.get(provider) || {
              totalTransactions: 0,
              successfulTransactions: 0,
              totalVolume: 0,
              totalResponseTime: 0,
              responseTimeCount: 0,
              errors: 0,
            };

            stats.totalTransactions++;
            if (tx.status === 'completed' || tx.status === 'successful') {
              stats.successfulTransactions++;
            }
            if (tx.status === 'failed' || tx.status === 'error') {
              stats.errors++;
            }
            stats.totalVolume += parseFloat(tx.amount || 0);
            
            // Mock response time (should come from actual provider logs)
            if (tx.responseTime) {
              stats.totalResponseTime += tx.responseTime;
              stats.responseTimeCount++;
            } else {
              // Estimate based on provider (mock data)
              const estimatedTime = provider === 'stripe' ? 120 : 
                                   provider === 'paystack' ? 180 :
                                   provider === 'flutterwave' ? 200 : 150;
              stats.totalResponseTime += estimatedTime;
              stats.responseTimeCount++;
            }

            providerStats.set(provider, stats);
          });
        } catch (err) {
          console.log(`No transactions for user ${userDoc.id}`);
        }
      }
    } catch (err) {
      console.log('Error fetching transactions:', err);
    }

    // Convert provider stats to array
    const providers: any[] = Array.from(providerStats.entries()).map(([name, stats]) => {
      const successRate = stats.totalTransactions > 0 
        ? (stats.successfulTransactions / stats.totalTransactions) * 100 
        : 0;
      const avgResponseTime = stats.responseTimeCount > 0
        ? Math.round(stats.totalResponseTime / stats.responseTimeCount)
        : 150;
      const costPerTransaction = 0.30; // Mock - should come from fee configuration
      
      // Determine status based on success rate and error rate
      let status: 'active' | 'degraded' | 'down' = 'active';
      const errorRate = stats.totalTransactions > 0 ? (stats.errors / stats.totalTransactions) * 100 : 0;
      if (errorRate > 10 || successRate < 90) {
        status = 'degraded';
      }
      if (errorRate > 30 || successRate < 70) {
        status = 'down';
      }

      // Mock supported currencies and countries (should come from provider config)
      const supportedCurrencies: string[] = [];
      const supportedCountries: string[] = [];
      
      if (name.toLowerCase().includes('stripe')) {
        supportedCurrencies.push('USD', 'EUR', 'GBP');
        supportedCountries.push('US', 'GB', 'CA', 'AU');
      } else if (name.toLowerCase().includes('paystack')) {
        supportedCurrencies.push('NGN', 'GHS', 'ZAR');
        supportedCountries.push('NG', 'GH', 'ZA');
      } else if (name.toLowerCase().includes('flutterwave')) {
        supportedCurrencies.push('NGN', 'KES', 'GHS', 'ZAR');
        supportedCountries.push('NG', 'KE', 'GH', 'ZA');
      } else if (name.toLowerCase().includes('wise')) {
        supportedCurrencies.push('USD', 'EUR', 'GBP', 'AUD');
        supportedCountries.push('US', 'GB', 'AU', 'CA');
      }

      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        successRate: parseFloat(successRate.toFixed(2)),
        avgResponseTime,
        totalTransactions: stats.totalTransactions,
        totalVolume: stats.totalVolume,
        costPerTransaction,
        status,
        supportedCurrencies,
        supportedCountries,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Calculate overall stats
    const totalOptimizations = allTransactions.length;
    const totalVolume = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const successfulTransactions = allTransactions.filter(tx => 
      tx.status === 'completed' || tx.status === 'successful'
    ).length;
    const avgSuccessRate = totalOptimizations > 0 
      ? (successfulTransactions / totalOptimizations) * 100 
      : 0;
    
    const totalResponseTime = providers.reduce((sum, p) => sum + (p.avgResponseTime * p.totalTransactions), 0);
    const totalTransactionCount = providers.reduce((sum, p) => sum + p.totalTransactions, 0);
    const avgResponseTime = totalTransactionCount > 0 
      ? Math.round(totalResponseTime / totalTransactionCount)
      : 150;

    // Calculate cost savings (mock - should be actual calculation)
    const costSavings = totalVolume * 0.001; // 0.1% savings estimate

    // Calculate routing efficiency (mock - should be based on optimal routing)
    const routingEfficiency = 94.5; // Mock percentage

    // Get top provider
    const topProvider = providers.length > 0
      ? providers.sort((a, b) => b.successRate - a.successRate)[0].name
      : 'None';

    console.log(`✅ Found ${providers.length} providers`);
    console.log(`   Total Transactions: ${totalOptimizations}`);
    console.log(`   Avg Success Rate: ${avgSuccessRate.toFixed(2)}%`);

    return NextResponse.json({
      providers,
      stats: {
        totalOptimizations,
        costSavings,
        avgSuccessRate: parseFloat(avgSuccessRate.toFixed(2)),
        avgResponseTime,
        topProvider,
        routingEfficiency,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching payment routing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment routing data', details: error.message },
      { status: 500 }
    );
  }
}

