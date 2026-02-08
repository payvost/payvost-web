import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Note: Middleware runs on the Edge Runtime. Avoid Node.js/SDK imports here.

// This function will be the middleware
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lightweight admin check: only gate access if session cookie is missing.
  // Full role verification happens in server routes/pages.
  if (pathname.startsWith('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE') &&
      !pathname.startsWith('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login')) {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login', request.url));
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

// Update the matcher to include all dashboard paths
export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/:path*',
  ],
};
