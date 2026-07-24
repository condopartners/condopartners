import { APP_NAME, type DatabaseHealth, type HealthResponse } from "@condopartners/shared"
import { sql } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db } from "../../db"

const DATABASE_CHECK_TIMEOUT_MS = 1_500

async function checkDatabase(): Promise<DatabaseHealth> {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("database check timeout")), DATABASE_CHECK_TIMEOUT_MS)
      }),
    ])
    return "ok"
  } catch {
    return "unreachable"
  }
}

export const healthModule = new Elysia({ prefix: "/health" }).get(
  "/",
  async (): Promise<HealthResponse> => {
    const database = await checkDatabase()
    return {
      status: database === "ok" ? "ok" : "degraded",
      service: APP_NAME,
      timestamp: new Date().toISOString(),
      database,
    }
  },
  {
    response: t.Object({
      status: t.Union([t.Literal("ok"), t.Literal("degraded"), t.Literal("down")]),
      service: t.Literal(APP_NAME),
      timestamp: t.String(),
      database: t.Union([t.Literal("ok"), t.Literal("unreachable")]),
    }),
  },
)
