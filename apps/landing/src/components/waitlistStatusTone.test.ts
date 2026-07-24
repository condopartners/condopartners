import { describe, expect, it } from "bun:test"
import { contrastRatio } from "../lib/contrast"
import { waitlistStatusTone } from "./waitlistStatusTone"

/** Tokens from apps/landing/src/index.css + Tailwind red-300. */
const INK = "#102028"
const COURTYARD = "#1f6b4f"
const COURTYARD_INK = "#e8f5ef"
const RED_300 = "#fca5a5"
const RED_800 = "#991b1b"

describe("waitlistStatusTone (dark #waitlist)", () => {
  it("uses courtyard-ink for success (not courtyard)", () => {
    expect(waitlistStatusTone.success).toContain("color-courtyard-ink")
    expect(waitlistStatusTone.success).not.toContain("color-courtyard)]")
  })

  it("uses a light alert tone for errors on dark background", () => {
    expect(waitlistStatusTone.alert).toBe("text-red-300")
  })

  it("meets WCAG AA (≥4.5:1) for success and alert on ink", () => {
    expect(contrastRatio(COURTYARD, INK)).toBeLessThan(4.5)
    expect(contrastRatio(RED_800, INK)).toBeLessThan(4.5)
    expect(contrastRatio(COURTYARD_INK, INK)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(RED_300, INK)).toBeGreaterThanOrEqual(4.5)
  })
})
