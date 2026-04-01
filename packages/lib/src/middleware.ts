import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "xu-novel-session";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  return response;
}

type AuthMiddlewareOptions = {
  authenticatedRedirect?: string;
  protectedPrefixes?: string[];
  publicRoutes: string[];
};

function matchesRoute(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isSafeRedirect(pathname: string | null) {
  return Boolean(pathname && pathname.startsWith("/") && !pathname.startsWith("//"));
}

export function createAuthMiddleware(
  optionsOrPublicRoutes: string[] | AuthMiddlewareOptions,
) {
  const options = Array.isArray(optionsOrPublicRoutes)
    ? { publicRoutes: optionsOrPublicRoutes }
    : optionsOrPublicRoutes;

  return function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isPublic = options.publicRoutes.some((route) => matchesRoute(pathname, route));
    const needsAuth =
      options.protectedPrefixes && options.protectedPrefixes.length > 0
        ? options.protectedPrefixes.some((route) => matchesRoute(pathname, route))
        : !isPublic;
    const hasSession = Boolean(req.cookies.get(AUTH_COOKIE_NAME)?.value);

    if (!hasSession && needsAuth) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/login", req.url);
      if (pathname !== "/login") {
        loginUrl.searchParams.set("redirectedFrom", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    if (hasSession && pathname === "/login") {
      const redirectedFrom = req.nextUrl.searchParams.get("redirectedFrom");
      const target =
        isSafeRedirect(redirectedFrom) && redirectedFrom
          ? redirectedFrom
          : options.authenticatedRedirect || "/";

      return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
  };
}

export const authMiddlewareConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
