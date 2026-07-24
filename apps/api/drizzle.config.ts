import { defineConfig } from "drizzle-kit"

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://condopartners:condopartners@localhost:5433/condopartners"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
