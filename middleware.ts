import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, AUTH_COOKIE_NAME } from './lib/jwt';

// Protected routes requiring user login
const PROTECTED_PREFIXES = ['/dashboard', '/api/tiktok'];

// Auth routes (redirect to dashboard if already logged in)
const AUTH_PREFIXES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const session = token ? await verifySessionToken(token) : null;

  // Protect Dashboard and TikTok API routes (except TikTok oauth callback if needed)
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
      }
      // If navigating to /dashboard directly without cookie, let the page load
      // so client-side can verify via localStorage or redirect cleanly
      if (pathname.startsWith('/dashboard')) {
        return NextResponse.next();
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/api/tiktok/:path*',
  ],
};
