import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/auth";

/**
 * 1. Private staging (D13): when STAGING_USER and STAGING_PASSWORD are set, every
 *    request needs HTTP Basic auth.
 * 2. Admin dashboard: /admin pages need a valid admin session (API routes check it themselves).
 */
export async function proxy(request: NextRequest) {
  const user = process.env.STAGING_USER;
  const pass = process.env.STAGING_PASSWORD;
  if (user && pass) {
    const header = request.headers.get("authorization") ?? "";
    let ok = false;
    if (header.startsWith("Basic ")) {
      try {
        const [u, ...rest] = atob(header.slice(6)).split(":");
        ok = u === user && rest.join(":") === pass;
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="AACMA staging", charset="UTF-8"' },
      });
    }
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!(await verifySession(request.cookies.get(ADMIN_COOKIE)?.value))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
