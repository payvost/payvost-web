// Deprecated endpoint: 2FA verification moved to Firebase client SDK using MultiFactorResolver.
// This route now returns 410 Gone to indicate deprecation.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated: Use Firebase MFA resolver on the client to verify codes.',
    },
    { status: 410 }
  );
}
