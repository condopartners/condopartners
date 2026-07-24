import { describe, expect, it } from "bun:test"
import { APP_NAME, type HealthResponse } from "@condopartners/shared"
import { app } from "../../app"

describe("GET /health", () => {
  it("returns service health and database status", async () => {
    const response = await app.handle(new Request("http://localhost/health"))

    expect(response.status).toBe(200)

    const body = (await response.json()) as HealthResponse
    expect(body.service).toBe(APP_NAME)
    expect(typeof body.timestamp).toBe("string")
    expect(["ok", "degraded"]).toContain(body.status)
    expect(["ok", "unreachable"]).toContain(body.database)
  })
})
