import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  // The secret is needed to decrypt the JWT.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  const isAuthPage = nextUrl.pathname.startsWith('/auth/signin');
  const isHomePage = nextUrl.pathname === '/';
  const isAppPage = nextUrl.pathname.startsWith('/timesheet'); // Any page inside the app

  if (isLoggedIn) {
    // If a logged-in user tries to access the home or sign-in page,
    // redirect them to the timesheet page.
    if (isAuthPage || isHomePage) {
      return NextResponse.redirect(new URL('/timesheet', req.url));
    }
  } else {
    // If a non-logged-in user tries to access a protected app page or the home page,
    // redirect them to the sign-in page.
    if (isAppPage || isHomePage) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Allow the request to proceed if no redirection is needed.
  return NextResponse.next();
}

// Optional: Use a matcher to specify which paths the middleware should run on.
export const config = {
  matcher: [
    // Match all paths except for API routes, static files, and image optimization files.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};