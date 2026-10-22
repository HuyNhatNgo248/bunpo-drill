/**
 * Settings. Local runs read them from .env; a host like Vercel sets them in its
 * settings, and those win over .env.
 */

try {
  process.loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

/** A setting the app can't run without. Missing ones fail the request with a message naming them. */
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env (see .env.example) or to the host's settings.`);
  return value;
}
