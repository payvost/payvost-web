import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Placeholder admin decision endpoint
  // Body: { submissionId: string, decision: 'approved' | 'rejected', reason?: string, level?: 'Basic'|'Full'|'Advanced' }
  try {
    const body = await request.json();
    // TODO: update KYC submission status in backend and notify user
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
