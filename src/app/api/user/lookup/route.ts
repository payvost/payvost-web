import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * POST /api/user/lookup
 * Authenticated lookup of a Payvost user by username or email.
 *
 * Request: { identifier: string }
 * Response: { user: { uid, username, email, fullName, photoURL, kycStatus, country, countryCode } | null }
 */
export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await auth.verifyIdToken(token);

    const body = await req.json().catch(() => ({}));
    const raw = String(body?.identifier ?? '').trim();
    if (!raw) return NextResponse.json({ error: 'identifier is required' }, { status: 400 });

    const isEmail = raw.includes('@') && !raw.startsWith('@');
    const identifierTrimmed = raw.replace(/^@/, '').trim();

    const q = db
      .collection('users')
      .where(isEmail ? 'email' : 'username', '==', isEmail ? raw : identifierTrimmed)
      .limit(1);

    const snap = await q.get();
    if (snap.empty) return NextResponse.json({ user: null });

    const doc = snap.docs[0]!;
    const data = doc.data() as any;

    return NextResponse.json({
      user: {
        uid: doc.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName || data.name,
        photoURL: data.photoURL || data.photo,
        kycStatus: data.kycStatus,
        country: data.country,
        countryCode: data.countryCode,
        isVerified: data.isVerified || data.kycStatus === 'Verified' || data.kycStatus === 'verified',
      },
    });
  } catch (error: any) {
    console.error('User lookup error:', error);
    return NextResponse.json({ error: 'Failed to lookup user' }, { status: 500 });
  }
}

