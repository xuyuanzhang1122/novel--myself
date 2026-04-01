import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

const workspaceRoot = path.join(__dirname, "../..");

loadEnvConfig(workspaceRoot);

const nextConfig: NextConfig = {
  transpilePackages: ["@xu-novel/ui", "@xu-novel/lib"],
  outputFileTracingRoot: workspaceRoot,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
    SITE_REVALIDATE_URL: process.env.SITE_REVALIDATE_URL,
    SITE_REVALIDATE_SECRET: process.env.SITE_REVALIDATE_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
