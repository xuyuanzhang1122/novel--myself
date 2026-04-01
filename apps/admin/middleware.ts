import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "xu-novel-session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (!hasSession && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
    const target =
      redirectedFrom && redirectedFrom.startsWith("/") && !redirectedFrom.startsWith("//")
        ? redirectedFrom
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
