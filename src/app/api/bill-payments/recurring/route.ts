import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    const body = await req.json();

    const {
      billerId,
      accountNumber,
      amount,
      currency,
      sourceAccountId,
      frequency,
      startDate,
      endDate,
      needsConversion,
      exchangeRate,
      conversionFee,
    } = body;

    if (!billerId || !accountNumber || !amount || !currency || !sourceAccountId || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const recurringBillRef = collection(db, 'users', user.uid, 'recurringBills');
    const docRef = await addDoc(recurringBillRef, {
      billerId,
      accountNumber,
      amount: parseFloat(amount),
      currency,
      sourceAccountId,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      needsConversion: needsConversion || false,
      exchangeRate: exchangeRate || 1,
      conversionFee: conversionFee || 0,
      status: 'ACTIVE',
      nextPaymentDate: new Date(startDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Recurring bill payment created successfully',
    });
  } catch (error: any) {
    console.error('Error creating recurring bill payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create recurring bill payment' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const recurringBillsRef = collection(db, 'users', user.uid, 'recurringBills');
    const q = query(recurringBillsRef, where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(q);

    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ bills });
  } catch (error: any) {
    console.error('Error fetching recurring bills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recurring bills' },
      { status: 500 }
    );
  }
}

