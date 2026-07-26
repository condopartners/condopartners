import nodemailer from "nodemailer"

export type SendMailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

export type SendMailFn = (input: SendMailInput) => Promise<void>

/** Alias usado pelo módulo admin (PR #28). */
export type MailMessage = SendMailInput
export type SendMail = SendMailFn

const REQUIRED_SMTP_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "SMTP_USER", "SMTP_PASS"] as const

/** Sentinel: sem override de teste — usa env SMTP em runtime. */
const USE_ENV = Symbol("use-env")

let testOverride: SendMailFn | null | typeof USE_ENV = USE_ENV
let transportSend: SendMailFn | null = null

/** Injeta mailer (testes admin) ou desliga com `null` mesmo com SMTP_* presentes. */
export function setMailer(fn: SendMailFn | null) {
  testOverride = fn
}

/** Alias de `setMailer` para os testes de ativação SMTP. */
export function setSendMailForTests(fn: SendMailFn | null) {
  testOverride = fn
}

export function resetMailerForTests() {
  testOverride = USE_ENV
  transportSend = null
}

function hasRuntimeSmtpEnv(): boolean {
  const host = process.env.SMTP_HOST?.trim()
  const port = process.env.SMTP_PORT?.trim()
  const from = process.env.SMTP_FROM?.trim()
  return Boolean(host && port && from)
}

/**
 * Configurado se há override de teste com impl, ou (sem override) se SMTP_*
 * mínimos (HOST/PORT/FROM) estão presentes.
 */
export function isMailerConfigured(): boolean {
  if (testOverride !== USE_ENV) return testOverride !== null
  return hasRuntimeSmtpEnv()
}

export function assertSmtpEnvForProduction() {
  if (process.env.NODE_ENV !== "production") return

  const missing = REQUIRED_SMTP_ENV.filter((key) => {
    const value = process.env[key]
    return value === undefined || value.trim() === ""
  })

  if (missing.length > 0) {
    throw new Error(`Missing required SMTP env in production: ${missing.join(", ")}`)
  }
}

function createTransportSend(): SendMailFn {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const from = process.env.SMTP_FROM
  if (!host || !Number.isFinite(port) || !from) {
    throw new Error("SMTP_HOST, SMTP_PORT and SMTP_FROM are required to send mail")
  }

  const secure = process.env.SMTP_SECURE === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false"

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user || pass ? { user: user ?? "", pass: pass ?? "" } : undefined,
    tls: { rejectUnauthorized },
  })

  return async (input) => {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
  }
}

export async function sendMail(input: SendMailInput): Promise<void> {
  if (testOverride !== USE_ENV) {
    if (!testOverride) {
      throw new Error("mailer não configurado — ver docs/specs/auth-smtp-activation.md")
    }
    await testOverride(input)
    return
  }

  if (!hasRuntimeSmtpEnv()) {
    throw new Error("mailer não configurado — ver docs/specs/auth-smtp-activation.md")
  }

  transportSend ??= createTransportSend()
  await transportSend(input)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function buildActivationEmail(input: {
  name?: string | null
  url: string
}): Pick<SendMailInput, "subject" | "text" | "html"> {
  const greeting = input.name ? `Olá, ${input.name}!` : "Olá!"
  const htmlGreeting = input.name ? `Olá, ${escapeHtml(input.name)}!` : "Olá!"
  const subject = "Ative sua conta no CondoPartners"
  const text = [
    greeting,
    "",
    "Clique no link para ativar sua conta:",
    input.url,
    "",
    "O link expira em 1 hora.",
    "",
    "Se você não criou esta conta, ignore esta mensagem.",
  ].join("\n")
  const html = [
    `<p>${htmlGreeting}</p>`,
    `<p>Clique no link para ativar sua conta:</p>`,
    `<p><a href="${input.url}">Ativar conta</a></p>`,
    `<p>O link expira em 1 hora.</p>`,
    `<p>Se você não criou esta conta, ignore esta mensagem.</p>`,
  ].join("")

  return { subject, text, html }
}
