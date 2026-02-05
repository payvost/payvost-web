import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { rapydService, RapydError, type IssuedCard } from '@/services/rapydService';

function extractLast4(card: IssuedCard, fallback?: string): string {
  return card.last4 || card.last_4 || card.pan_last_4 || fallback || '0000';
}

function extractExpiry(card: IssuedCard): string | undefined {
  if (card.expiration_date || card.expiry_date || card.exp_date) {
    return (card.expiration_date || card.expiry_date || card.exp_date) as string;
  }
  if (card.expiration_month && card.expiration_year) {
    const month = String(card.expiration_month).padStart(2, '0');
    const year = String(card.expiration_year).slice(-2);
    return `${month}/${year}`;
  }
  return undefined;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await context.params;

    const userRef = adminDb.collection('users').doc(uid);
    const cardRef = userRef.collection('cards').doc(id);
    const cardSnap = await cardRef.get();

    let cardData = cardSnap.exists ? cardSnap.data() : null;

    if (!cardData) {
      const querySnap = await userRef.collection('cards').where('providerCardId', '==', id).limit(1).get();
      if (!querySnap.empty) {
        cardData = querySnap.docs[0].data();
      }
    }

    if (!cardData) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const providerCardId = cardData.providerCardId || id;
    const issuedCard = await rapydService.getIssuedCard(providerCardId);
    const last4 = extractLast4(issuedCard, cardData.last4);
    const expiry = extractExpiry(issuedCard) || cardData.expiry;

    return NextResponse.json({
      cardId: providerCardId,
      last4,
      maskedNumber: issuedCard.masked_number || cardData.maskedNumber || `**** **** **** ${last4}`,
      expiry,
      fullNumber: issuedCard.card_number,
      cvv: issuedCard.cvv,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RapydError) {
      console.error('[Cards Reveal API] Rapyd error:', error.message, error.response);
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode || 502 }
      );
    }
    console.error('[Cards Reveal API] Failed to reveal card:', error);
    return NextResponse.json({ error: 'Failed to reveal card' }, { status: 500 });
  }
}
