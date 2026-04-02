export const env = {
  authCookieDomain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001",
  siteRevalidateUrl:
    process.env.SITE_REVALIDATE_URL ?? "http://localhost:3000/api/revalidate",
  siteRevalidateSecret:
    process.env.SITE_REVALIDATE_SECRET ?? "xu-novel-local-revalidate-secret",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  smtpQqEmail: process.env.SMTP_QQ_EMAIL ?? "",
  smtpFromName: process.env.SMTP_FROM_NAME ?? "xu-novel",
  imageApiBaseUrl: process.env.IMAGE_API_BASE_URL ?? "http://127.0.0.1:4000",
};
