// Deprecated endpoint: Email-based 2FA was removed in favor of Firebase MFA.
// This route now returns 410 Gone to indicate deprecation.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated: Email 2FA has been removed. Use Firebase MFA with TOTP or SMS.',
    },
    { status: 410 }
  );
}
