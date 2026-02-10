import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect unauthenticated users
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|login|signup|$).*)',
  ],
};
