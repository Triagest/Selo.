import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, verifySuperAdminJWT } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public routes - no auth needed
  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth/") ||
    pathname.match(/^\/admin\/super-login/i)
  ) {
    return NextResponse.next();
  }

  // Super-admin routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    const superToken = req.cookies.get("selo_super_token")?.value;
    if (!superToken) {
      return NextResponse.redirect(new URL("/admin/super-login", req.url));
    }

    const payload = verifySuperAdminJWT(superToken);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/super-login", req.url));
      response.cookies.delete("selo_super_token");
      return response;
    }

    return NextResponse.next();
  }

  // Tenant routes (/[tenant_slug]/*)
  const tenantMatch = pathname.match(/^\/([a-z0-9-]+)(\/|$)/);
  if (tenantMatch) {
    const tenantSlug = tenantMatch[1];
    const token = req.cookies.get("selo_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL(`/${tenantSlug}/login`, req.url));
    }

    const payload = verifyJWT(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL(`/${tenantSlug}/login`, req.url));
      response.cookies.delete("selo_token");
      return response;
    }

    // Validate tenant in URL matches tenant in JWT
    if (payload.tenantId !== tenantSlug) {
      return NextResponse.json(
        { error: "Tenant mismatch" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // Catch-all: redirect to login
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
