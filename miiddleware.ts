import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If the user is not logged in and is not trying to access the sign-in page,
  // redirect them to the sign-in page.
  if (!token && pathname !== '/auth/signin') {
    const signInUrl = new URL('/auth/signin', req.url);
    // We can add a callbackUrl so they are redirected back to the page they wanted after login
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If the user is logged in and tries to access the root page,
  // redirect them to the main timesheet page.
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/timesheet/new', req.url));
  }

  // If none of the above, allow the request to continue.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/signin (the sign-in page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)',
  ],
};
