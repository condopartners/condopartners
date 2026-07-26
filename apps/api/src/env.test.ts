import { afterEach, describe, expect, it } from "bun:test"
import { resolveProdEnv } from "./env"

const KEYS = ["WEB_ORIGIN", "BETTER_AUTH_URL", "NODE_ENV"] as const

describe("resolveProdEnv", () => {
  const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {}

  afterEach(() => {
    for (const key of KEYS) {
      if (key in saved) {
        const value = saved[key]
        if (value === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = value
        }
        delete saved[key]
      }
    }
  })

  function stash(key: (typeof KEYS)[number]) {
    if (!(key in saved)) {
      saved[key] = process.env[key]
    }
  }

  it("throws in production when the env var is missing", () => {
    stash("NODE_ENV")
    stash("WEB_ORIGIN")
    process.env.NODE_ENV = "production"
    delete process.env.WEB_ORIGIN

    expect(() => resolveProdEnv("WEB_ORIGIN", "http://localhost:5173")).toThrow(
      "WEB_ORIGIN is required",
    )
  })

  it("throws in production when BETTER_AUTH_URL is missing", () => {
    stash("NODE_ENV")
    stash("BETTER_AUTH_URL")
    process.env.NODE_ENV = "production"
    delete process.env.BETTER_AUTH_URL

    expect(() => resolveProdEnv("BETTER_AUTH_URL", "http://localhost:3000")).toThrow(
      "BETTER_AUTH_URL is required",
    )
  })

  it("returns the env value in production when set", () => {
    stash("NODE_ENV")
    stash("WEB_ORIGIN")
    process.env.NODE_ENV = "production"
    process.env.WEB_ORIGIN = "https://app.condopartners.com.br"

    expect(resolveProdEnv("WEB_ORIGIN", "http://localhost:5173")).toBe(
      "https://app.condopartners.com.br",
    )
  })

  it("falls back outside production when the env var is missing", () => {
    stash("NODE_ENV")
    stash("WEB_ORIGIN")
    process.env.NODE_ENV = "development"
    delete process.env.WEB_ORIGIN

    expect(resolveProdEnv("WEB_ORIGIN", "http://localhost:5173")).toBe("http://localhost:5173")
  })
})
