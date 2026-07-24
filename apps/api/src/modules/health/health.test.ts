import { describe, expect, it } from "bun:test"
import { APP_NAME, type HealthResponse } from "@condopartners/shared"
import { app } from "../../app"

describe("GET /health", () => {
  it("returns ok status with service name", async () => {
    const response = await app.handle(new Request("http://localhost/health"))

    expect(response.status).toBe(200)

    const body = (await response.json()) as HealthResponse
    expect(body.status).toBe("ok")
    expect(body.service).toBe(APP_NAME)
    expect(typeof body.timestamp).toBe("string")
  })
})
