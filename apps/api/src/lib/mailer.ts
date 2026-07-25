/**
 * Seam de envio de e-mail. A implementação SMTP real (nodemailer) chega com
 * docs/specs/auth-smtp-activation.md (SIS-115/SIS-130) via `setMailer`.
 * Sem implementação registrada, o mailer é considerado não configurado e as
 * ações que dependem de e-mail degradam com erro explícito (spec super-admin).
 */

export type MailMessage = {
  to: string
  subject: string
  text: string
  html?: string
}

export type SendMail = (message: MailMessage) => Promise<void>

let implementation: SendMail | null = null

export function setMailer(sendMail: SendMail | null) {
  implementation = sendMail
}

export function isMailerConfigured(): boolean {
  return implementation !== null
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!implementation) {
    throw new Error("mailer não configurado — ver docs/specs/auth-smtp-activation.md")
  }
  await implementation(message)
}
