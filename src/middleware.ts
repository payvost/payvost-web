import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function will be the middleware
export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Mobi/i.test(userAgent);
  const { pathname } = request.nextUrl;

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
  ],
};
