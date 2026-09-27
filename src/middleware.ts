import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function csrf() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isOpen = pathname === "/admin/login" || pathname === "/admin/setup";
  let response = NextResponse.next();
  if (isAdmin && !isOpen && !request.cookies.get("nkdon_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    response = NextResponse.redirect(url);
  }
  if (!request.cookies.get("nkdon_csrf")) {
    response.cookies.set("nkdon_csrf", csrf(), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico|icon.svg).*)"],
};
