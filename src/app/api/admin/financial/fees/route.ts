import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'transaction', 'payout', 'fx'

    console.log('🔍 Fetching fee configuration...');

    let feesQuery: any = db.collection('feeRules');

    if (type) {
      feesQuery = feesQuery.where('type', '==', type);
    }

    const snapshot = await feesQuery.get();
    const fees = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    }));

    // Group by type
    const transactionFees = fees.filter((f: any) => f.type === 'transaction');
    const payoutFees = fees.filter((f: any) => f.type === 'payout');
    const fxMarkups = fees.filter((f: any) => f.type === 'fx');

    return NextResponse.json({
      fees,
      grouped: {
        transaction: transactionFees,
        payout: payoutFees,
        fx: fxMarkups,
      },
    });
  } catch (error: any) {
    console.error('Error fetching fee configuration:', error);
    return NextResponse.json({
      fees: [],
      grouped: {
        transaction: [],
        payout: [],
        fx: [],
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...feeData } = body;

    const rule = {
      type,
      ...feeData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      active: true,
    };

    const docRef = await db.collection('feeRules').add(rule);

    return NextResponse.json({ success: true, id: docRef.id, rule });
  } catch (error: any) {
    console.error('Error creating fee rule:', error);
    return NextResponse.json(
      { error: 'Failed to create fee rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    await db.collection('feeRules').doc(id).update({
      ...updateData,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating fee rule:', error);
    return NextResponse.json(
      { error: 'Failed to update fee rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Fee rule ID is required' },
        { status: 400 }
      );
    }

    await db.collection('feeRules').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fee rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete fee rule' },
      { status: 500 }
    );
  }
}

