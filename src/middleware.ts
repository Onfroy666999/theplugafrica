import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First gate for /admin: no valid session cookie, no admin pages. Pages and actions check again (requireAdmin).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Sign-in and invitation links work without a session.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/invite/")) return NextResponse.next();
  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
