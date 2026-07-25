import { afterEach, describe, expect, it } from "bun:test"
import {
  assertSmtpEnvForProduction,
  resetMailerForTests,
  sendMail,
  setSendMailForTests,
} from "./mailer"

describe("mailer", () => {
  afterEach(() => {
    resetMailerForTests()
    delete process.env.NODE_ENV
  })

  it("delega para a implementação injetada (mockável)", async () => {
    const sent: Array<{ to: string; subject: string }> = []
    setSendMailForTests(async (mail) => {
      sent.push({ to: mail.to, subject: mail.subject })
    })

    await sendMail({
      to: "a@example.com",
      subject: "Ative sua conta no CondoPartners",
      text: "texto",
      html: "<p>html</p>",
    })

    expect(sent).toEqual([{ to: "a@example.com", subject: "Ative sua conta no CondoPartners" }])
  })

  it("em produção, falha se SMTP obrigatório estiver ausente", () => {
    process.env.NODE_ENV = "production"
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_FROM
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS

    expect(() => assertSmtpEnvForProduction()).toThrow(/SMTP_/)
  })

  it("em produção, aceita SMTP obrigatório preenchido", () => {
    process.env.NODE_ENV = "production"
    process.env.SMTP_HOST = "smtp.example.com"
    process.env.SMTP_PORT = "587"
    process.env.SMTP_FROM = "CondoPartners <noreply@example.com>"
    process.env.SMTP_USER = "user"
    process.env.SMTP_PASS = "pass"

    expect(() => assertSmtpEnvForProduction()).not.toThrow()
  })
})
