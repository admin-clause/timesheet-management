import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/auth/signin'];

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // --- Logic for logged-in users ---
  if (token) {
    // If a logged-in user tries to access a public page, redirect them to the app
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/timesheet', req.url));
    }
  } 
  // --- Logic for logged-out users ---
  else {
    // If a logged-out user tries to access a protected page (i.e., not a public page)
    if (!isPublicPath) {
      // Redirect them to the sign-in page, saving the page they were trying to access
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Allow the request to proceed by default
  return NextResponse.next();
}

// The matcher remains the same, running the middleware on all pages except API/static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
