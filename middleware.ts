import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Protected routes that require authentication
const protectedRoutes = ["/dashboard"];

// Auth routes - should redirect to dashboard if already logged in
const authRoutes = ["/auth/login", "/auth/register"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session token from cookie
  // NextAuth v5 uses __Secure-authjs.session-token in production and authjs.session-token in development
  const sessionToken =
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value;

  const isAuthenticated = !!sessionToken;

  // Remove locale prefix for route matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ru)/, "") || "/";

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Handle protected routes - redirect to login if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const locale = pathname.match(/^\/(en|ru)/)?.[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle auth routes - redirect to dashboard if already authenticated
  if (isAuthRoute && isAuthenticated) {
    const locale = pathname.match(/^\/(en|ru)/)?.[1] || routing.defaultLocale;
    const callbackUrl =
      request.nextUrl.searchParams.get("callbackUrl") || `/${locale}/dashboard`;
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  // Apply internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - API routes (/api/*)
  // - Next.js internals (/_next/*, /_vercel/*)
  // - Static files (files with extensions like .ico, .png, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
