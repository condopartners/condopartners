/**
 * Test preload: provides deterministic env defaults for API tests.
 * Real secrets live only in .env (never committed). CI sets DATABASE_URL to
 * its Postgres service; locally `bun run db:up` maps Postgres on 5433.
 */

process.env.BETTER_AUTH_SECRET ??= "test-secret-at-least-32-characters-long!!"
process.env.BETTER_AUTH_URL ??= "http://localhost:3000"
process.env.WEB_ORIGIN ??= "http://localhost:5173"
process.env.DATABASE_URL ??= "postgres://condopartners:condopartners@localhost:5433/condopartners"
