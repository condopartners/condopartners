import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("vite PWA registerType", () => {
  test("usa prompt (sem autoUpdate silencioso)", () => {
    const config = readFileSync(join(import.meta.dir, "../../vite.config.ts"), "utf8")
    expect(config).toContain('registerType: "prompt"')
    expect(config).not.toContain('registerType: "autoUpdate"')
  })
})

describe("web package PWA runtime deps", () => {
  test("declara workbox-window (virtual:pwa-register/react)", () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, "../../package.json"), "utf8"))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(deps["workbox-window"]).toBeTruthy()
  })
})
