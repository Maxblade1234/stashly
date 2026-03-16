import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for API routes
const ipRequests = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 60; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Protected routes that require auth
const protectedPaths = ['/dashboard', '/gift-cards', '/history', '/settings', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Webhook endpoints authenticated by signature, not session/rate-limit
  if (pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next();
  }

  // Rate limit API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Auth check for protected routes (client-side redirect)
  // Note: Server components handle their own auth checks;
  // this middleware provides early protection for static pages
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const supabaseAuth = request.cookies.getAll().find(c =>
      c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    if (!supabaseAuth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/gift-cards/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
