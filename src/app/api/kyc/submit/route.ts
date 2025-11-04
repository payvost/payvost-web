import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Placeholder endpoint to be wired to backend service.
  // Expecting JSON body with: userId, countryCode, level, documents(meta)
  try {
    const body = await request.json();
    // TODO: forward to backend KYC service and enqueue review
    return NextResponse.json({ status: 'accepted', submissionId: body?.submissionId || null }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
