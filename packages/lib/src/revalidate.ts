import { env } from "./env";

export async function triggerSiteRevalidation(tags: string[]) {
  if (!env.siteRevalidateUrl || !env.siteRevalidateSecret || tags.length === 0)
    return;

  try {
    const response = await fetch(env.siteRevalidateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags,
        secret: env.siteRevalidateSecret,
      }),
    });

    if (!response.ok) {
      console.error(
        `[revalidate] failed with status ${response.status} for tags: ${tags.join(", ")}`,
      );
    }
  } catch {
    // Revalidation is best-effort and should not block admin writes.
  }
}
