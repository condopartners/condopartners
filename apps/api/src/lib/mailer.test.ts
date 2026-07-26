import { afterEach, describe, expect, it } from "bun:test"
import {
  assertSmtpEnvForProduction,
  buildActivationEmail,
  buildResetPasswordEmail,
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

describe("buildActivationEmail", () => {
  it("escapa HTML no nome do usuário (nome malicioso vira texto, sem tag/link)", () => {
    const { html } = buildActivationEmail({
      name: '<a href="https://evil.example">Suporte</a>',
      url: "https://api.example.com/verify?token=abc",
    })

    expect(html).not.toContain('<a href="https://evil.example">')
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;Suporte&lt;/a&gt;")
  })

  it("escapa &, <, >, aspas duplas e simples no nome", () => {
    const { html } = buildActivationEmail({
      name: `Tom & Jerry <"O'Brien">`,
      url: "https://api.example.com/verify?token=abc",
    })

    expect(html).toContain("Tom &amp; Jerry &lt;&quot;O&#39;Brien&quot;&gt;")
  })

  it("preserva o link de ativação gerado pelo Better Auth", () => {
    const url = "https://api.example.com/verify?token=abc"
    const { html, text } = buildActivationEmail({
      name: '<img src=x onerror="alert(1)">',
      url,
    })

    expect(html).toContain(`<a href="${url}">Ativar conta</a>`)
    expect(text).toContain(url)
  })

  it("informa TTL de 30 dias no texto e HTML", () => {
    const { html, text } = buildActivationEmail({
      name: "Ana",
      url: "https://api.example.com/verify?token=abc",
    })
    expect(text).toMatch(/30 dias/i)
    expect(html).toMatch(/30 dias/i)
    expect(text).not.toMatch(/1 hora/i)
  })
})

describe("buildResetPasswordEmail", () => {
  it("informa TTL de 24 horas e CTA Redefinir senha", () => {
    const url = "https://api.example.com/reset-password/tok"
    const { subject, html, text } = buildResetPasswordEmail({ name: "Ana", url })
    expect(subject).toBe("Redefina sua senha no CondoPartners")
    expect(html).toContain(`<a href="${url}">Redefinir senha</a>`)
    expect(text).toContain(url)
    expect(text).toMatch(/24 horas/i)
    expect(html).toMatch(/24 horas/i)
  })

  it("escapa HTML no nome do usuário", () => {
    const { html } = buildResetPasswordEmail({
      name: '<a href="https://evil.example">Suporte</a>',
      url: "https://api.example.com/reset",
    })
    expect(html).not.toContain('<a href="https://evil.example">')
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;Suporte&lt;/a&gt;")
  })
})
