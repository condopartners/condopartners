import { describe, expect, it } from "bun:test"
import { app } from "../../app"

const trustedOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

describe("CORS (WEB_ORIGIN)", () => {
  it("permite Origin confiável com Access-Control-Allow-Origin correspondente", async () => {
    const response = await app.handle(
      new Request("http://localhost/health", {
        method: "OPTIONS",
        headers: {
          Origin: trustedOrigin,
          "Access-Control-Request-Method": "GET",
        },
      }),
    )

    expect(response.headers.get("access-control-allow-origin")).toBe(trustedOrigin)
    expect(response.headers.get("access-control-allow-credentials")).toBe("true")
  })

  it("não ecoa Origin estranha em Access-Control-Allow-Origin", async () => {
    const response = await app.handle(
      new Request("http://localhost/health", {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.example.com",
          "Access-Control-Request-Method": "GET",
        },
      }),
    )

    expect(response.headers.get("access-control-allow-origin")).not.toBe(
      "https://evil.example.com",
    )
  })
})
