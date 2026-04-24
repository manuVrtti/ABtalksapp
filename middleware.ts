import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/challenge", "/profile", "/quiz", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname === "/login";

  // Protected route, not logged in → redirect to login
  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in, on login page → redirect to dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Everything else proceeds normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/challenge/:path*",
    "/profile/:path*",
    "/quiz/:path*",
    "/register/:path*",
    "/login",
  ],
};
