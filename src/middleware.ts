
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Redirect mobile users trying to access login/register to a download page
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  if (isMobile && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/download', request.url));
  }

  // 2. Protect all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check for a Firebase authentication token in the cookies
    const authToken = request.cookies.get('firebase-auth-token');
    
    // If there's no token, redirect to the login page
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
    // 3. Protect all admin dashboard routes
  if (pathname.startsWith('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard')) {
    const authToken = request.cookies.get('firebase-auth-token');
    if (!authToken) {
      const loginUrl = new URL('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }


  // Allow all other requests to proceed
  return NextResponse.next();
}

// Specify the paths this middleware should run on.
export const config = {
  matcher: [
    '/login', 
    '/register',
    '/dashboard/:path*', // Protect all dashboard routes
    '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/:path*', // Protect all admin routes
  ],
};
