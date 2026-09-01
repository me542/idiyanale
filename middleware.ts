import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import {
  PROTECTED_PATHS,
  SUPER_ADMIN_PROTECTED_PATHS,
} from "./lib/auth/routes";

const AUTH_PATHS = ["/login"];
const SUPER_ADMIN_AUTH_PATHS = ["/super-admin/login"];

interface EdgeClaims {
  exp?: number;
  role?: string;
  user_role?: string;
  userRole?: string;
}

interface AuthState {
  valid: boolean;
  role?: string;
  userRole?: string;
}

function getAuthState(token: string | undefined): AuthState {
  if (!token) {
    return {
      valid: false,
    };
  }

  try {
    const decoded = jwtDecode<EdgeClaims>(token);

    if (!decoded.exp) {
      return {
        valid: false,
      };
    }

    const valid = decoded.exp * 1000 > Date.now();

    if (!valid) {
      return {
        valid: false,
      };
    }

    return {
      valid: true,
      role: decoded.role,
      userRole: decoded.user_role ?? decoded.userRole,
    };
  } catch {
    return {
      valid: false,
    };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;

  /*
   * Read role from cookies first.
   * If it doesn't exist, fall back to the JWT.
   */
  const cookieRole = request.cookies.get("role")?.value;
  const cookieUserRole = request.cookies.get("user_role")?.value;

  const auth = getAuthState(token);

  const authed = auth.valid;

  const role =
    cookieRole ||
    auth.role;

  const userRole =
    cookieUserRole ||
    auth.userRole;

  /*
   * ============================================================
   * ROOT
   * ============================================================
   */

  const isRoot = pathname === "/";

  if (isRoot) {
    if (!authed) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    if (role === "super-admin") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/ticket/dashboard", request.url)
    );
  }

  /*
   * ============================================================
   * MANAGEMENT ACCESS
   * ============================================================
   *
   * Only Insti-Admin staff can access /management.
   *
   * Super-admin is allowed.
   */

  const isManagementPath = pathname.startsWith("/management");

  if (isManagementPath && authed) {
    if (role === "super-admin") {
      return NextResponse.next();
    }

    if (role === "staff" && userRole === "Insti-Admin") {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL("/ticket/dashboard", request.url)
    );
  }

  /*
   * ============================================================
   * NORMAL PROTECTED ROUTES
   * ============================================================
   */

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !authed) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /*
   * ============================================================
   * NORMAL LOGIN PAGE
   * ============================================================
   */

  const isAuthPage = AUTH_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isAuthPage && authed) {
    if (role === "super-admin") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/ticket/dashboard", request.url)
    );
  }

  /*
   * ============================================================
   * SUPER ADMIN PROTECTED ROUTES
   * ============================================================
   */

  const isSuperAdminProtected =
    SUPER_ADMIN_PROTECTED_PATHS.some((path) =>
      pathname.startsWith(path)
    );

  /*
   * If trying to access a super-admin page
   * without a valid token, send to super-admin login.
   */
  if (isSuperAdminProtected && !authed) {
    return NextResponse.redirect(
      new URL("/super-admin/login", request.url)
    );
  }

  /*
   * If a normal staff user tries to access
   * a super-admin protected page, don't allow it.
   */
  if (
    isSuperAdminProtected &&
    authed &&
    role !== "super-admin"
  ) {
    return NextResponse.redirect(
      new URL("/ticket/dashboard", request.url)
    );
  }

  /*
   * ============================================================
   * SUPER ADMIN LOGIN
   * ============================================================
   */

  const isSuperAdminAuthPage =
    SUPER_ADMIN_AUTH_PATHS.some((path) =>
      pathname.startsWith(path)
    );

  /*
   * Already authenticated as super-admin
   * → go directly to dashboard.
   */
  if (isSuperAdminAuthPage && authed) {
    if (role === "super-admin") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    /*
     * A normal staff account should not remain
     * on the super-admin login page.
     */
    return NextResponse.redirect(
      new URL("/ticket/dashboard", request.url)
    );
  }

  /*
   * ============================================================
   * DEFAULT
   * ============================================================
   */

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
  ],
};