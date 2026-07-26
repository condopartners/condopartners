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
