import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');

    console.log('🔍 Fetching liquidity data...');

    // Get liquidity accounts from Firestore
    let accountsQuery: any = db.collection('liquidityAccounts');

    if (currency && currency !== 'ALL') {
      accountsQuery = accountsQuery.where('currency', '==', currency);
    }

    const snapshot = await accountsQuery.get();
    const accounts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate totals
    const totalBalance = accounts.reduce((sum: number, acc: any) => {
      return sum + (parseFloat(acc.balance) || 0);
    }, 0);

    const totalReserved = accounts.reduce((sum: number, acc: any) => {
      return sum + (parseFloat(acc.reserved) || 0);
    }, 0);

    const availableBalance = totalBalance - totalReserved;

    // Get recent liquidity movements
    let movementsQuery: any = db.collection('liquidityMovements')
      .orderBy('createdAt', 'desc')
      .limit(20);

    const movementsSnapshot = await movementsQuery.get();
    const movements = movementsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      accounts,
      movements,
      summary: {
        totalBalance,
        totalReserved,
        availableBalance,
        accountCount: accounts.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching liquidity data:', error);
    return NextResponse.json({
      accounts: [],
      movements: [],
      summary: {
        totalBalance: 0,
        totalReserved: 0,
        availableBalance: 0,
        accountCount: 0,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, amount, type, description } = body;

    // Create liquidity movement record
    const movement = {
      accountId,
      amount: parseFloat(amount),
      type, // 'deposit', 'withdrawal', 'transfer'
      description,
      createdAt: Timestamp.now(),
      status: 'completed',
    };

    await db.collection('liquidityMovements').add(movement);

    // Update account balance if needed
    if (accountId) {
      const accountRef = db.collection('liquidityAccounts').doc(accountId);
      const accountDoc = await accountRef.get();
      
      if (accountDoc.exists) {
        const currentBalance = parseFloat(accountDoc.data()?.balance || 0);
        const newBalance = type === 'deposit' 
          ? currentBalance + parseFloat(amount)
          : currentBalance - parseFloat(amount);
        
        await accountRef.update({ balance: newBalance });
      }
    }

    return NextResponse.json({ success: true, movement });
  } catch (error: any) {
    console.error('Error processing liquidity movement:', error);
    return NextResponse.json(
      { error: 'Failed to process liquidity movement' },
      { status: 500 }
    );
  }
}

