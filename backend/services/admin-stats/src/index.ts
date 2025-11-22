import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { Timestamp } from 'firebase-admin/firestore';

const app = express();
const PORT = process.env.ADMIN_STATS_SERVICE_PORT || 3007;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use existing credentials from environment or default initialization
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Use default credentials (for local development with gcloud auth)
      admin.initializeApp();
    }
    console.log('[Admin Stats Service] Firebase Admin initialized');
  } catch (error: any) {
    console.error('[Admin Stats Service] Firebase Admin initialization error:', error.message);
  }
}

const db = admin.firestore();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'admin-stats-service',
    timestamp: new Date().toISOString(),
    firebaseInitialized: admin.apps.length > 0,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Payvost Admin Stats Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      stats: 'GET /stats',
      volumeOverTime: 'GET /volume-over-time',
      transactions: 'GET /transactions',
      currencyDistribution: 'GET /currency-distribution',
    },
  });
});

// Dashboard statistics endpoint
app.get('/stats', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const currency = req.query.currency as string | undefined;

    console.log('[Admin Stats Service] Fetching dashboard statistics...');

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
        const transactionsRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions');

        let transactionsQuery: admin.firestore.Query;
        if (startTimestamp) {
          transactionsQuery = transactionsRef
            .where('createdAt', '>=', startTimestamp)
            .where('createdAt', '<=', endTimestamp);
        } else {
          transactionsQuery = transactionsRef.where('createdAt', '<=', endTimestamp);
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
          
          const prevTransactionsQuery = db
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
        console.log(`[Admin Stats Service] No transactions for user ${userDoc.id}`);
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

    console.log('[Admin Stats Service] Dashboard stats calculated successfully');

    return res.status(200).json({
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
    console.error('[Admin Stats Service] Error fetching dashboard stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message,
      details: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Volume over time endpoint
app.get('/volume-over-time', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const currency = req.query.currency as string | undefined;

    console.log('[Admin Stats Service] Fetching volume over time...');

    // Default to last 12 months if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 12);
      return d;
    })();

    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    // Generate month keys
    const months: Array<{ month: string; start: Date; end: Date }> = [];
    const current = new Date(start);
    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
      months.push({
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        start: monthStart,
        end: monthEnd,
      });
      current.setMonth(current.getMonth() + 1);
    }

    const monthlyData: Record<string, { volume: number; payouts: number }> = {};
    months.forEach(({ month }) => {
      monthlyData[month] = { volume: 0, payouts: 0 };
    });

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    // Collect transactions from all users
    for (const userDoc of usersSnapshot.docs) {
      try {
        const transactionsRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions');
        
        const transactionsQuery = transactionsRef
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
        console.log(`[Admin Stats Service] No transactions for user ${userDoc.id}`);
      }
    }

    // Format data for chart
    const chartData = months.map(({ month }) => ({
      month,
      volume: Math.round(monthlyData[month].volume),
      payouts: Math.round(monthlyData[month].payouts),
    }));

    console.log('[Admin Stats Service] Volume over time calculated successfully');

    return res.status(200).json({ data: chartData });
  } catch (error: any) {
    console.error('[Admin Stats Service] Error fetching volume over time:', error);
    return res.status(500).json({
      error: 'Failed to fetch volume over time',
      message: error.message,
      details: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Recent transactions endpoint
app.get('/transactions', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '10');
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const currency = req.query.currency as string | undefined;

    console.log(`[Admin Stats Service] Fetching recent ${limit} transactions...`);

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
        const transactionsRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions');

        let transactionsQuery: admin.firestore.Query;
        if (startTimestamp) {
          transactionsQuery = transactionsRef
            .where('createdAt', '>=', startTimestamp)
            .where('createdAt', '<=', endTimestamp)
            .orderBy('createdAt', 'desc')
            .limit(limit * 2); // Get more to account for currency filtering
        } else {
          transactionsQuery = transactionsRef
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
        console.log(`[Admin Stats Service] No transactions for user ${userDoc.id}`);
      }
    }

    // Sort by date descending and limit
    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedTransactions = recentTransactions.slice(0, limit);

    console.log(`[Admin Stats Service] Found ${limitedTransactions.length} transactions`);

    return res.status(200).json({
      transactions: limitedTransactions,
      total: limitedTransactions.length,
    });
  } catch (error: any) {
    console.error('[Admin Stats Service] Error fetching recent transactions:', error);
    return res.status(500).json({
      error: 'Failed to fetch recent transactions',
      message: error.message,
      details: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Currency distribution endpoint
app.get('/currency-distribution', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    console.log('[Admin Stats Service] Fetching currency distribution...');

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
        const transactionsRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('transactions');

        let transactionsQuery: admin.firestore.Query;
        if (startTimestamp) {
          transactionsQuery = transactionsRef
            .where('createdAt', '>=', startTimestamp)
            .where('createdAt', '<=', endTimestamp);
        } else {
          transactionsQuery = transactionsRef.where('createdAt', '<=', endTimestamp);
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
        console.log(`[Admin Stats Service] No transactions for user ${userDoc.id}`);
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

    console.log('[Admin Stats Service] Currency distribution calculated successfully');

    return res.status(200).json({ data: chartData });
  } catch (error: any) {
    console.error('[Admin Stats Service] Error fetching currency distribution:', error);
    return res.status(500).json({
      error: 'Failed to fetch currency distribution',
      message: error.message,
      details: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Admin Stats Service] Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`[Admin Stats Service] Running on port ${PORT}`);
  console.log(`[Admin Stats Service] Environment: ${NODE_ENV}`);
  console.log(`[Admin Stats Service] Firebase initialized: ${admin.apps.length > 0}`);
  console.log(`[Admin Stats Service] Endpoints:`);
  console.log(`  - GET http://localhost:${PORT}/health`);
  console.log(`  - GET http://localhost:${PORT}/stats`);
  console.log(`  - GET http://localhost:${PORT}/volume-over-time`);
  console.log(`  - GET http://localhost:${PORT}/transactions`);
  console.log(`  - GET http://localhost:${PORT}/currency-distribution`);
});

