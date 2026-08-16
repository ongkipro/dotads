import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_PATHNAME_HEADER } from './lib/request-path';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ADMIN_PATHNAME_HEADER, pathname);

  // Public auth paths must remain reachable even when a stale cookie exists.
  // The server-rendered workspace entry point performs the authoritative
  // session/role redirect.
  const publicPaths = ['/login', '/register', '/super-admin/setup'];
  
  if (publicPaths.includes(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect /admin, /super-admin, and root
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin') || pathname === '/') {
    const sessionCookie = 
      request.cookies.get('better-auth.session_token')?.value || 
      request.cookies.get('__Secure-better-auth.session_token')?.value || 
      request.cookies.get('dotads_session')?.value || 
      request.cookies.get('Authorization')?.value;
    
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Match all routes except API, static files, images, favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
