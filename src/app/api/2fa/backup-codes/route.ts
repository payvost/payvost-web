// Deprecated endpoint: Backup codes are not used with Firebase MFA.
// This route now returns 410 Gone to indicate deprecation.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated: Backup codes are not supported with Firebase MFA.',
    },
    { status: 410 }
  );
}
