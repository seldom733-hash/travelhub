import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error(
    "[Middleware] JWT_SECRET env variable is required. " +
    "Set it in .env — see .env.example for details."
  );
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

const protectedRoutes = ["/dashboard", "/partner", "/admin", "/chat", "/favorites", "/notifications", "/loyalty", "/bookings"];
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isProtectedRoute) {
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (token && isAuthRoute) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Token invalid, allow access to auth pages
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/partner/:path*", "/admin/:path*", "/chat/:path*", "/favorites/:path*", "/notifications/:path*", "/loyalty/:path*", "/bookings/:path*", "/auth/:path*"],
};
