import { describe, expect, test } from "bun:test"
import { pwaManifest } from "./pwa-manifest"

describe("pwaManifest", () => {
  test("usa theme/background CondoPartners ink e display standalone", () => {
    expect(pwaManifest.theme_color).toBe("#0B1F33")
    expect(pwaManifest.background_color).toBe("#0B1F33")
    expect(pwaManifest.display).toBe("standalone")
    expect(pwaManifest.lang).toBe("pt-BR")
    expect(pwaManifest.name).toBe("CondoPartners")
    expect(pwaManifest.short_name).toBe("CondoPartners")
    expect(pwaManifest.start_url).toBe("/")
  })

  test("expõe ícones 192 e 512 (inclui maskable)", () => {
    const sizes = pwaManifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain("192x192")
    expect(sizes).toContain("512x512")
    expect(pwaManifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true)
  })
})
