import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Note: Middleware runs on the Edge Runtime. Avoid Node.js/SDK imports here.

// This function will be the middleware
export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Mobi/i.test(userAgent);
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

  // If the user is on a mobile device and trying to access a dashboard route
  if (isMobile && (pathname.startsWith('/dashboard') || pathname.startsWith('/business'))) {
    // Redirect them to the download page
    return NextResponse.redirect(new URL('/download', request.url));
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
    '/business/:path*',
    '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/:path*',
  ],
};
