
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // Regular expression to detect mobile and tablet devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // If a mobile user tries to access login or register, redirect them to the download page.
  if (isMobile && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/download', request.url));
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

// Specify that this middleware should only run on the login and register paths.
export const config = {
  matcher: ['/login', '/register'],
};
