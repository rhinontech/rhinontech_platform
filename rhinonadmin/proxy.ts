import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const pathname = request.nextUrl.pathname;

    // Public routes
    const publicRoutes = ['/login', '/api/auth/login'];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // If accessing public route
    if (isPublicRoute) {
        // Already authenticated? Redirect to dashboard
        if (token) {
            // TODO: Extract role from JWT and redirect to /{role}/dashboard
            return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Protected routes - require authentication
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
