import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allowed public auth paths
  const publicPaths = ['/login', '/register', '/super-admin/setup'];
  
  if (publicPaths.includes(pathname)) {
    // If they already have a session, redirect to /admin instead of showing login
    const sessionCookie = 
      request.cookies.get('better-auth.session_token')?.value || 
      request.cookies.get('__Secure-better-auth.session_token')?.value || 
      request.cookies.get('dotads_session')?.value || 
      request.cookies.get('Authorization')?.value;
      
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
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
    
    // If they access root '/' and have a session, redirect to /admin
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except API, static files, images, favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
