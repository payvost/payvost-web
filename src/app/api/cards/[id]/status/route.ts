import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { rapydService, RapydError } from '@/services/rapydService';

type StatusAction = 'freeze' | 'unfreeze';

function mapToRapydStatus(action: StatusAction) {
  return action === 'freeze' ? 'block' : 'unblock';
}

function mapToCardStatus(action: StatusAction) {
  return action === 'freeze' ? 'frozen' : 'active';
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await context.params;
    const body = (await request.json()) as { action?: StatusAction };
    const action = body?.action;

    if (!action || (action !== 'freeze' && action !== 'unfreeze')) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const cardRef = userRef.collection('cards').doc(id);
    const cardSnap = await cardRef.get();

    let cardData = cardSnap.exists ? cardSnap.data() : null;
    let cardDocId = id;

    if (!cardData) {
      const querySnap = await userRef.collection('cards').where('providerCardId', '==', id).limit(1).get();
      if (!querySnap.empty) {
        cardData = querySnap.docs[0].data();
        cardDocId = querySnap.docs[0].id;
      }
    }

    if (!cardData) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const providerCardId = cardData.providerCardId || id;
    await rapydService.updateIssuedCardStatus({
      card: providerCardId,
      status: mapToRapydStatus(action),
    });

    const newStatus = mapToCardStatus(action);
    await userRef.collection('cards').doc(cardDocId).set(
      {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ status: newStatus });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RapydError) {
      console.error('[Cards Status API] Rapyd error:', error.message, error.response);
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode || 502 }
      );
    }
    console.error('[Cards Status API] Failed to update card status:', error);
    return NextResponse.json({ error: 'Failed to update card status' }, { status: 500 });
  }
}
