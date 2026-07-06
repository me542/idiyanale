import { NextRequest, NextResponse } from "next/server";

// Routes that require a logged-in user.
// Add more paths here as your app grows.
const PROTECTED_PATHS = ["/ticket"];

// Routes that a logged-in user shouldn't see again (e.g. the login page).
const AUTH_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // Not logged in and trying to reach a protected page → send to /login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in and trying to reach /login → send to dashboard
  if (isAuthPage && token) {
    const dashboardUrl = new URL("/ticket/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Only run middleware on the paths that matter — avoids unnecessary
// checks on static assets, images, API routes, etc.
export const config = {
  matcher: ["/ticket/:path*", "/login"],
};