let didLoadEnv = false;

export function loadLocalEnv() {
  if (didLoadEnv) return;
  didLoadEnv = true;

  for (const candidate of [".env.local", "../../.env.local", ".env", "../../.env"]) {
    try {
      process.loadEnvFile(candidate);
    } catch {
      // Keep process env defaults when the file is absent.
    }
  }
}
