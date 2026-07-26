/**
 * Resolve an env var with a non-production fallback.
 * In production, missing values fail fast (same style as BETTER_AUTH_SECRET).
 */
export function resolveProdEnv(name: string, fallback: string): string {
  const value = process.env[name]
  if (value) return value
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required`)
  }
  return fallback
}
