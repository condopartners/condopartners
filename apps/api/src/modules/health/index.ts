import { APP_NAME, type HealthResponse } from "@condopartners/shared"
import { Elysia, t } from "elysia"

export const healthModule = new Elysia({ prefix: "/health" }).get(
  "/",
  (): HealthResponse => ({
    status: "ok",
    service: APP_NAME,
    timestamp: new Date().toISOString(),
  }),
  {
    response: t.Object({
      status: t.Union([t.Literal("ok"), t.Literal("degraded"), t.Literal("down")]),
      service: t.Literal(APP_NAME),
      timestamp: t.String(),
    }),
  },
)
