import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "xu-novel-session";
const PUBLIC_ROUTES = ["/", "/library", "/login", "/novel", "/api/revalidate"];
const PROTECTED_PREFIXES = ["/settings", "/api/reading-progress"];

function matchesRoute(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isSafeRedirect(pathname: string | null) {
  return Boolean(pathname && pathname.startsWith("/") && !pathname.startsWith("//"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));
  const needsAuth = PROTECTED_PREFIXES.some((route) => matchesRoute(pathname, route));
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (!hasSession && needsAuth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
    const target =
      isSafeRedirect(redirectedFrom) && redirectedFrom ? redirectedFrom : "/library";

    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isPublic && !needsAuth) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
