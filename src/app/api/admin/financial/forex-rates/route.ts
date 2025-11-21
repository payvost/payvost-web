import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currencyPair = searchParams.get('currencyPair');

    console.log('🔍 Fetching forex rates...');

    let ratesQuery: any = db.collection('forexRates');

    if (currencyPair) {
      ratesQuery = ratesQuery.where('currencyPair', '==', currencyPair);
    }

    const snapshot = await ratesQuery.get();
    const rates = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    // Calculate average markup
    const activeRates = rates.filter((r: any) => r.status === 'Active');
    const avgMarkup = activeRates.length > 0
      ? activeRates.reduce((sum: number, r: any) => sum + (parseFloat(r.markup) || 0), 0) / activeRates.length
      : 0;

    return NextResponse.json({
      rates,
      summary: {
        totalPairs: rates.length,
        activePairs: activeRates.length,
        pausedPairs: rates.filter((r: any) => r.status === 'Paused').length,
        averageMarkup: avgMarkup.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error('Error fetching forex rates:', error);
    return NextResponse.json({
      rates: [],
      summary: {
        totalPairs: 0,
        activePairs: 0,
        pausedPairs: 0,
        averageMarkup: '0.00',
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currencyPair, markup, status } = body;

    // Check if rate exists
    const existingQuery = await db.collection('forexRates')
      .where('currencyPair', '==', currencyPair)
      .get();

    const markupValue = parseFloat(markup);
    const baseRate = parseFloat(body.baseRate) || 0;
    const customerRate = baseRate * (1 + markupValue / 100);

    const rateData = {
      currencyPair,
      baseRate,
      markup: markupValue,
      customerRate,
      status: status || 'Active',
      lastUpdated: Timestamp.now(),
    };

    if (existingQuery.empty) {
      // Create new rate
      await db.collection('forexRates').add(rateData);
    } else {
      // Update existing rate
      await existingQuery.docs[0].ref.update(rateData);
    }

    return NextResponse.json({ success: true, rate: rateData });
  } catch (error: any) {
    console.error('Error updating forex rate:', error);
    return NextResponse.json(
      { error: 'Failed to update forex rate' },
      { status: 500 }
    );
  }
}

