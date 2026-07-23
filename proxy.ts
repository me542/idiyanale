import { NextRequest, NextResponse } from "next/server";

// Routes that require a logged-in staff user.
const PROTECTED_PATHS = ["/ticket"];

// Routes that a logged-in staff user shouldn't see again (e.g. the login page).
const AUTH_PATHS = ["/login"];

// Routes that require a logged-in super admin.
const SUPER_ADMIN_PROTECTED_PATHS = ["/dashboard"];

// Dedicated super-admin login page (kept separate from protected paths).
const SUPER_ADMIN_AUTH_PATHS = ["/super-admin/login"];

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  // TODO: replace with real validation — decode the JWT and check `exp`,
  // or verify signature. Currently this only checks the cookie exists.
  return true;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value; // "staff" | "super-admin"
  const authed = isValidToken(token);

  const isRoot = pathname === "/";
  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isSuperAdminProtected = SUPER_ADMIN_PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isSuperAdminAuthPage = SUPER_ADMIN_AUTH_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Root path: redirect based on auth state instead of relying on client JS.
  if (isRoot) {
    if (!authed) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "super-admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/ticket/dashboard", request.url));
  }

  // Not logged in and trying to reach a protected staff page → send to /login
  if (isProtected && !authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in and trying to reach /login → send to staff dashboard
  // if (isAuthPage && authed) {
  //   return NextResponse.redirect(new URL("/ticket/dashboard", request.url));
  // }

  // Not logged in and trying to reach a protected super admin page → send to super admin login
  if (isSuperAdminProtected && !isSuperAdminAuthPage && !authed) {
    return NextResponse.redirect(new URL("/super-admin/login", request.url));
  }

  // Already logged in and trying to reach the super admin login page → send to super admin dashboard
  if (isSuperAdminAuthPage && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Only run on paths that matter — avoids unnecessary checks on static
// assets, images, API routes, etc.
export const config = {
  matcher: [
    "/",
    "/ticket/:path*",
    "/login",
    "/super-admin/:path*",
    "/dashboard/:path*",
  ],
};