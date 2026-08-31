import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { PROTECTED_PATHS, SUPER_ADMIN_PROTECTED_PATHS } from "./lib/auth/routes";

// Routes that a logged-in staff user shouldn't see again.
const AUTH_PATHS = ["/login"];

// Dedicated super-admin login page (kept separate from protected paths).
const SUPER_ADMIN_AUTH_PATHS = ["/super-admin/login"];

interface EdgeClaims {
  exp: number;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwtDecode<EdgeClaims>(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value; // "staff" | "super-admin"
  const authed = isValidToken(token);

  const isRoot = pathname === "/";
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isSuperAdminProtected = SUPER_ADMIN_PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isSuperAdminAuthPage = SUPER_ADMIN_AUTH_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isRoot) {
    if (!authed) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "super-admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/ticket/dashboard", request.url));
  }

  if (isProtected && !authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && authed) {
    const dest = role === "super-admin" ? "/dashboard" : "/ticket/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isSuperAdminProtected && !isSuperAdminAuthPage && !authed) {
    return NextResponse.redirect(new URL("/super-admin/login", request.url));
  }

  if (isSuperAdminAuthPage && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/ticket/:path*",
    "/minor-task/:path*",
    "/chat/:path*",
    "/knowledge/:path*",
    "/management/:path*",
    "/login",
    "/super-admin/:path*",
    "/dashboard/:path*",
    "/management/:path*",
  ],
};