import { describe, expect, it } from "bun:test"
import { isValidCorporateEmail } from "./email"

describe("isValidCorporateEmail", () => {
  it("accepts a typical corporate address", () => {
    expect(isValidCorporateEmail("nome@empresa.com.br")).toBe(true)
  })

  it("rejects empty and malformed values", () => {
    expect(isValidCorporateEmail("")).toBe(false)
    expect(isValidCorporateEmail("sem-arroba")).toBe(false)
    expect(isValidCorporateEmail("@empresa.com")).toBe(false)
    expect(isValidCorporateEmail("a@b")).toBe(false)
  })
})
