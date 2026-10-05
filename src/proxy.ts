import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED = ["/today", "/search", "/history", "/recipes", "/foods", "/profile", "/settings", "/onboarding"];

/** Optimistic redirect for signed-out visitors. API routes check the session themselves. */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !req.auth?.user) {
    const url = new URL("/sign-in", req.nextUrl);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/sign-in" || pathname === "/sign-up") && req.auth?.user) {
    return NextResponse.redirect(new URL("/today", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
