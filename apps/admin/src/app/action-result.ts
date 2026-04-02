export type AdminActionResult = {
  ok: true;
  message?: string;
  redirectTo?: string;
  chapterId?: string;
};

export function getRedirectTargetFromError(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("digest" in error) ||
    typeof error.digest !== "string"
  ) {
    return null;
  }

  if (!error.digest.startsWith("NEXT_REDIRECT")) {
    return null;
  }

  const [, , target] = error.digest.split(";");
  return target && target.startsWith("/") && !target.startsWith("//") ? target : null;
}
