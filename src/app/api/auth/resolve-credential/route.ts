import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

type Bucket = { count: number; resetAt: number };

function getIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec?: number } {
  const g = globalThis as any;
  const buckets: Map<string, Bucket> = g.__payvost_rl_resolve_credential ?? (g.__payvost_rl_resolve_credential = new Map());

  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true };
}

/**
 * POST /api/auth/resolve-credential
 * Resolve "@username" -> email for login without exposing Firestore list permissions to the client.
 *
 * Request: { credential: string }
 * Response: { resolvedEmail: string, kind: 'email' | 'username' }
 */
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`resolve-credential:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = String(body?.credential ?? '').trim();
  if (!raw) return NextResponse.json({ error: 'credential is required' }, { status: 400 });

  // Email: no lookup needed.
  if (raw.includes('@') && !raw.startsWith('@')) {
    return NextResponse.json({ resolvedEmail: raw, kind: 'email' as const });
  }

  const username = raw.replace(/^@/, '').trim();
  if (!username) return NextResponse.json({ error: 'Invalid username' }, { status: 400 });

  // Lookup by username in Firestore (Admin SDK; does not depend on client Firestore rules).
  const snap = await db.collection('users').where('username', '==', username).limit(1).get();
  if (snap.empty) {
    // Avoid revealing whether a username exists (mitigates enumeration).
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const doc = snap.docs[0]!;
  const data = doc.data() as any;
  const email = String(data?.email ?? '').trim();
  if (!email) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  return NextResponse.json({ resolvedEmail: email, kind: 'username' as const });
}

