import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Check for the 'auth_token' cookie
  const token = request.cookies.get("auth_token")?.value;

  // 2. Get the current path
  const { pathname } = request.nextUrl;

  // 3. Define paths that do NOT require login
  const isPublicPath =
    pathname === "/login" || pathname === "/setup" || pathname === "/join";

  // 4. Redirect Logic

  // If user is NOT logged in and tries to access a protected page
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user IS logged in and tries to access Login or Setup, send them to Dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
