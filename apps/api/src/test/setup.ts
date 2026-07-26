/**
 * Test preload: provides deterministic env defaults for API tests.
 * Real secrets live only in .env (never committed). CI sets DATABASE_URL to
 * its Postgres service; locally `bun run db:up` maps Postgres on 5432.
 */

// Força ambiente de teste mesmo quando a máquina exporta NODE_ENV=production
// (Better Auth liga rate limiting em produção e derrubaria a suite com 429).
process.env.NODE_ENV = "test"

process.env.BETTER_AUTH_SECRET ??= "test-secret-at-least-32-characters-long!!"
process.env.BETTER_AUTH_URL ??= "http://localhost:3000"
process.env.WEB_ORIGIN ??= "http://localhost:5173"
process.env.DATABASE_URL ??= "postgres://condopartners:condopartners@localhost:5432/condopartners"
process.env.SMTP_HOST ??= "127.0.0.1"
process.env.SMTP_PORT ??= "1025"
process.env.SMTP_FROM ??= "CondoPartners <noreply@example.com>"
process.env.SMTP_USER ??= "test"
process.env.SMTP_PASS ??= "test"
