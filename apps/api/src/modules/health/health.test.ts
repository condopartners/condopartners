import { afterEach, describe, expect, it } from "bun:test"
import { APP_NAME, type HealthResponse } from "@condopartners/shared"
import { app } from "../../app"

describe("GET /health", () => {
  const previousGitSha = process.env.GIT_SHA

  afterEach(() => {
    if (previousGitSha === undefined) {
      delete process.env.GIT_SHA
    } else {
      process.env.GIT_SHA = previousGitSha
    }
  })

  it("returns service health and database status", async () => {
    delete process.env.GIT_SHA
    const response = await app.handle(new Request("http://localhost/health"))

    expect(response.status).toBe(200)

    const body = (await response.json()) as HealthResponse
    expect(body.service).toBe(APP_NAME)
    expect(typeof body.timestamp).toBe("string")
    expect(["ok", "degraded"]).toContain(body.status)
    expect(["ok", "unreachable"]).toContain(body.database)
    expect(body.gitSha).toBeNull()
  })

  it("exposes GIT_SHA as gitSha when set", async () => {
    process.env.GIT_SHA = "abc123def4567890abc123def4567890abc123de"
    const response = await app.handle(new Request("http://localhost/health"))

    expect(response.status).toBe(200)
    const body = (await response.json()) as HealthResponse
    expect(body.gitSha).toBe("abc123def4567890abc123def4567890abc123de")
  })
})
