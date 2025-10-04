
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all other requests to proceed
  return NextResponse.next();
}

// Specify that this middleware should only run on the login and register paths.
export const config = {
  matcher: ['/login', '/register'],
};
