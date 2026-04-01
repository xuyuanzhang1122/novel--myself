import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

for (const candidate of [".env.local", "../../.env.local", ".env", "../../.env"]) {
  try {
    process.loadEnvFile(candidate);
  } catch {
    // Keep local defaults when the file is absent.
  }
}

const AUTH_COOKIE_NAME = "xu-novel-session";
const DEFAULT_USER_ID = "default-user";
const DEFAULT_ADMIN_EMAIL = "admin@local";
const DEFAULT_ADMIN_PASSWORD = "novel123456";
const DEFAULT_SESSION_SECRET = "xu-novel-local-session-secret";

type SessionUser = {
  id: string;
  email: string;
};

type SessionPayload = {
  user: SessionUser;
};

function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

function getSessionSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.SITE_REVALIDATE_SECRET ||
    DEFAULT_SESSION_SECRET
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function encodeSession(session: SessionPayload) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(token?: string | null): SessionPayload | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = signPayload(payload);
  if (signature.length !== expectedSignature.length) return null;

  if (
    !timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!parsed?.user?.id || !parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV === "development") return undefined;
  const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();
  return domain ? domain : undefined;
}

export function getAuthDefaults() {
  return {
    email: getAdminEmail(),
    passwordHint:
      process.env.ADMIN_PASSWORD ? "使用你配置的管理员密码" : DEFAULT_ADMIN_PASSWORD,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== getAdminEmail() || password !== getAdminPassword()) {
    return {
      ok: false as const,
      error: "账号或密码不正确。",
    };
  }

  const cookieStore = await cookies();
  const domain = getCookieDomain();

  cookieStore.set(AUTH_COOKIE_NAME, encodeSession({
    user: {
      id: DEFAULT_USER_ID,
      email: normalizedEmail,
    },
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    ...(domain ? { domain } : {}),
  });

  return { ok: true as const };
}

export async function signOut() {
  const cookieStore = await cookies();
  const domain = getCookieDomain();

  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = decodeSession(token);

  if (!session) return null;

  return { session };
}

export async function getUser() {
  const session = await getSession();
  return session?.session.user ?? null;
}
