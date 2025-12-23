import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await requireAuth(req);
    const body = await req.json();

    const { billPaymentId, reminderDays } = body;

    if (!billPaymentId || !reminderDays || !Array.isArray(reminderDays)) {
      return NextResponse.json(
        { error: 'billPaymentId and reminderDays array are required' },
        { status: 400 }
      );
    }

    const remindersRef = collection(db, 'users', uid, 'billReminders');
    await addDoc(remindersRef, {
      billPaymentId,
      reminderDays,
      enabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Bill reminders set up successfully',
    });
  } catch (error: any) {
    console.error('Error creating bill reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create bill reminder' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { uid } = await requireAuth(req);
    const remindersRef = collection(db, 'users', uid, 'billReminders');
    const q = query(remindersRef, where('enabled', '==', true));
    const snapshot = await getDocs(q);

    const reminders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ reminders });
  } catch (error: any) {
    console.error('Error fetching bill reminders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bill reminders' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { uid } = await requireAuth(req);
    const body = await req.json();

    const { reminderId, enabled } = body;

    if (!reminderId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'reminderId and enabled are required' },
        { status: 400 }
      );
    }

    const reminderRef = doc(db, 'users', uid, 'billReminders', reminderId);
    await updateDoc(reminderRef, {
      enabled,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Bill reminder updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating bill reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update bill reminder' },
      { status: 500 }
    );
  }
}

