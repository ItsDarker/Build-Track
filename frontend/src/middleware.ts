import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-if-any';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Decode JWT to check role
      // Note: We use jose because it works in Next.js Edge Runtime
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(accessToken, secret);
      
      const role = (payload as any).role;
      const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'];

      if (!role || !allowedRoles.includes(role)) {
        // Redirect to /app with unauthorized flag
        const url = new URL('/app', request.url);
        url.searchParams.set('auth_err', 'forbidden');
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Middleware JWT Error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
};
