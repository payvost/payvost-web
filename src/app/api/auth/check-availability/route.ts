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
  const buckets: Map<string, Bucket> = g.__payvost_rl_check_availability ?? (g.__payvost_rl_check_availability = new Map());

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
 * POST /api/auth/check-availability
 * Server-side uniqueness checks for email/username (avoid client-side Firestore list permissions).
 *
 * Request: { username?: string, email?: string }
 * Response: { usernameAvailable?: boolean, emailAvailable?: boolean }
 */
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`check-availability:${ip}`, 30, 60_000);
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

  const username = body?.username ? String(body.username).trim().replace(/^@/, '') : '';
  const email = body?.email ? String(body.email).trim().toLowerCase() : '';

  const result: { usernameAvailable?: boolean; emailAvailable?: boolean } = {};

  if (username) {
    const snap = await db.collection('users').where('username', '==', username).limit(1).get();
    result.usernameAvailable = snap.empty;
  }

  if (email) {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    result.emailAvailable = snap.empty;
  }

  return NextResponse.json(result);
}

