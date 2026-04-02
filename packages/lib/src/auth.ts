import { createHmac, randomInt, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { UserRecord, UserRole } from "./types";
import { sendRegisterVerificationEmail } from "./mailer";
import { loadLocalEnv } from "./load-env";
import { prisma } from "./prisma";

loadLocalEnv();

const AUTH_COOKIE_NAME = "xu-novel-session";
const DEFAULT_ADMIN_EMAIL = "admin@local";
const DEFAULT_ADMIN_PASSWORD = "novel123456";
const DEFAULT_SESSION_SECRET = "xu-novel-local-session-secret";
const REGISTER_PURPOSE = "REGISTER";
const REGISTER_CODE_EXPIRES_MINUTES = 10;
const REGISTER_CODE_RESEND_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 8;

type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
};

type SessionPayload = {
  user: SessionUser;
};

type AuthCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
  domain?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(user: {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    status: user.status === "DISABLED" ? "DISABLED" : "ACTIVE",
    email_verified_at: user.emailVerifiedAt?.toISOString() ?? null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

function getAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
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

function shouldUseSecureCookies() {
  if (process.env.NODE_ENV !== "production") return false;

  const explicit = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  const urls = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_ADMIN_URL];
  return urls.some((value) => value?.trim().startsWith("https://"));
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

    if (!parsed?.user?.id || !parsed.user.email || !parsed.user.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, hash] = passwordHash.split(":");
  if (!salt || !hash) return false;

  try {
    const expectedHash = Buffer.from(hash, "base64url");
    const actualHash = scryptSync(password, salt, expectedHash.length);

    return (
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash)
    );
  } catch {
    return false;
  }
}

function hashVerificationCode(email: string, code: string) {
  return createHmac("sha256", getSessionSecret())
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("base64url");
}

function validateEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("请输入邮箱地址。");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    throw new Error("邮箱格式不正确。");
  }

  return normalizedEmail;
}

function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`密码至少需要 ${MIN_PASSWORD_LENGTH} 位。`);
  }
}

function getAuthCookieOptions(maxAge: number): AuthCookieOptions {
  const domain = getCookieDomain();

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

async function setSessionCookie(user: Pick<UserRecord, "id" | "email" | "role">) {
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_COOKIE_NAME,
    encodeSession({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }),
    getAuthCookieOptions(60 * 60 * 24 * 30),
  );
}

async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });
}

async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

async function countOtherActiveAdmins(userId: string) {
  return prisma.user.count({
    where: {
      id: { not: userId },
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
}

async function ensureBootstrapAdminUser() {
  const email = getAdminEmail();
  const password = getAdminPassword();
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        role: "ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    return;
  }

  const updates: {
    emailVerifiedAt?: Date;
    passwordHash?: string;
    role?: "ADMIN";
    status?: "ACTIVE";
  } = {};

  if (existingUser.role !== "ADMIN") {
    updates.role = "ADMIN";
  }

  if (existingUser.status !== "ACTIVE") {
    updates.status = "ACTIVE";
  }

  if (!existingUser.emailVerifiedAt) {
    updates.emailVerifiedAt = new Date();
  }

  if (!verifyPassword(password, existingUser.passwordHash)) {
    updates.passwordHash = hashPassword(password);
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: updates,
    });
  }
}

async function getPersistedUserFromToken(token?: string | null) {
  const session = decodeSession(token);
  if (!session) return null;

  const user = await getUserById(session.user.id);
  if (!user || user.status !== "ACTIVE") return null;

  return mapUser(user);
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

export async function signInWithPassword(
  email: string,
  password: string,
  options?: { requiredRole?: UserRole },
) {
  await ensureBootstrapAdminUser();

  let normalizedEmail = "";
  try {
    normalizedEmail = validateEmail(email);
  } catch {
    return {
      ok: false as const,
      error: "账号或密码不正确。",
    };
  }
  const user = await getUserByEmail(normalizedEmail);

  if (!user || user.status !== "ACTIVE" || !verifyPassword(password, user.passwordHash)) {
    return {
      ok: false as const,
      error: "账号或密码不正确。",
    };
  }

  if (options?.requiredRole && user.role !== options.requiredRole) {
    return {
      ok: false as const,
      error: "账号或密码不正确。",
    };
  }

  const mappedUser = mapUser(user);
  await setSessionCookie(mappedUser);

  return { ok: true as const, user: mappedUser };
}

export async function sendRegistrationCode(email: string) {
  await ensureBootstrapAdminUser();

  const normalizedEmail = validateEmail(email);
  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("这个邮箱已经注册过了，请直接登录。");
  }

  const now = new Date();
  const existingCode = await prisma.emailVerificationCode.findUnique({
    where: {
      email_purpose: {
        email: normalizedEmail,
        purpose: REGISTER_PURPOSE,
      },
    },
  });

  if (existingCode) {
    const cooldownEndsAt = existingCode.createdAt.getTime() + REGISTER_CODE_RESEND_SECONDS * 1000;
    if (cooldownEndsAt > now.getTime()) {
      const seconds = Math.ceil((cooldownEndsAt - now.getTime()) / 1000);
      throw new Error(`验证码发送过于频繁，请 ${seconds} 秒后再试。`);
    }
  }

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(now.getTime() + REGISTER_CODE_EXPIRES_MINUTES * 60 * 1000);

  await prisma.emailVerificationCode.upsert({
    where: {
      email_purpose: {
        email: normalizedEmail,
        purpose: REGISTER_PURPOSE,
      },
    },
    update: {
      codeHash: hashVerificationCode(normalizedEmail, code),
      createdAt: now,
      expiresAt,
    },
    create: {
      email: normalizedEmail,
      purpose: REGISTER_PURPOSE,
      codeHash: hashVerificationCode(normalizedEmail, code),
      expiresAt,
      createdAt: now,
    },
  });

  await sendRegisterVerificationEmail({
    email: normalizedEmail,
    code,
    expiresInMinutes: REGISTER_CODE_EXPIRES_MINUTES,
  });

  return {
    ok: true as const,
    message: "验证码已发送，请检查邮箱。",
  };
}

export async function registerUserWithCode(input: {
  email: string;
  code: string;
  password: string;
  role?: UserRole;
  markVerified?: boolean;
}) {
  await ensureBootstrapAdminUser();

  const normalizedEmail = validateEmail(input.email);
  validatePassword(input.password);

  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("这个邮箱已经注册过了，请直接登录。");
  }

  const verificationCode = await prisma.emailVerificationCode.findUnique({
    where: {
      email_purpose: {
        email: normalizedEmail,
        purpose: REGISTER_PURPOSE,
      },
    },
  });

  if (!verificationCode) {
    throw new Error("请先获取邮箱验证码。");
  }

  if (verificationCode.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerificationCode.delete({
      where: {
        email_purpose: {
          email: normalizedEmail,
          purpose: REGISTER_PURPOSE,
        },
      },
    }).catch(() => undefined);

    throw new Error("验证码已过期，请重新获取。");
  }

  const submittedCode = input.code.trim();
  if (!submittedCode || hashVerificationCode(normalizedEmail, submittedCode) !== verificationCode.codeHash) {
    throw new Error("验证码不正确。");
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashPassword(input.password),
      role: input.role === "ADMIN" ? "ADMIN" : "USER",
      status: "ACTIVE",
      emailVerifiedAt: input.markVerified === false ? null : new Date(),
    },
  });

  await prisma.emailVerificationCode.delete({
    where: {
      email_purpose: {
        email: normalizedEmail,
        purpose: REGISTER_PURPOSE,
      },
    },
  });

  return mapUser(user);
}

export async function createUser(input: {
  email: string;
  password: string;
  role: UserRole;
}) {
  await ensureBootstrapAdminUser();

  const email = validateEmail(input.email);
  validatePassword(input.password);

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("该邮箱已存在。");
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(input.password),
      role: input.role === "ADMIN" ? "ADMIN" : "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  return mapUser(user);
}

export async function listUsers() {
  await ensureBootstrapAdminUser();

  const users = await prisma.user.findMany({
    orderBy: [
      { role: "asc" },
      { createdAt: "desc" },
    ],
  });

  return users.map(mapUser);
}

export async function updateUserRole(userId: string, role: UserRole) {
  await ensureBootstrapAdminUser();

  const user = await getUserById(userId);
  if (!user) {
    throw new Error("用户不存在。");
  }

  const nextRole = role === "ADMIN" ? "ADMIN" : "USER";
  if (user.role === "ADMIN" && nextRole !== "ADMIN") {
    const otherAdminCount = await countOtherActiveAdmins(user.id);
    if (otherAdminCount === 0) {
      throw new Error("至少需要保留一个管理员。");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: nextRole },
  });

  return mapUser(updatedUser);
}

export async function deleteUser(userId: string, currentUserId: string) {
  await ensureBootstrapAdminUser();

  const user = await getUserById(userId);
  if (!user) {
    throw new Error("用户不存在。");
  }

  if (user.id === currentUserId) {
    throw new Error("不能删除当前正在登录的管理员账号。");
  }

  if (user.role === "ADMIN") {
    const otherAdminCount = await countOtherActiveAdmins(user.id);
    if (otherAdminCount === 0) {
      throw new Error("至少需要保留一个管理员。");
    }
  }

  await prisma.emailVerificationCode.deleteMany({
    where: { email: user.email },
  });

  await prisma.user.delete({
    where: { id: user.id },
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", getAuthCookieOptions(0));
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = await getPersistedUserFromToken(token);

  if (!user) return null;

  return {
    session: {
      user,
    },
  };
}

export async function getUser() {
  const session = await getSession();
  return session?.session.user ?? null;
}

export async function getAdminUser() {
  const user = await getUser();
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    return null;
  }
  return user;
}
