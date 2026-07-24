import { type FormEvent, useState } from "react"
import { contactCopy } from "../lib/copy"
import { isValidCorporateEmail } from "../lib/email"

type Status = "idle" | "success" | "invalid"

function contactMailto(): string {
  const email = import.meta.env.VITE_CONTACT_EMAIL ?? "contato@condopartners.com.br"
  return `mailto:${email}`
}

export function ContactForm() {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>("idle")

  const externalUrl = import.meta.env.VITE_CONTACT_URL

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !company.trim() || !isValidCorporateEmail(email)) {
      setStatus("invalid")
      return
    }
    if (externalUrl) {
      window.location.href = externalUrl
      return
    }
    const subject = encodeURIComponent(`Contato CondoPartners — ${company.trim()}`)
    const body = encodeURIComponent(
      `Nome: ${name.trim()}\nEmpresa: ${company.trim()}\nE-mail: ${email.trim()}\n\n${message.trim()}`,
    )
    window.location.href = `${contactMailto()}?subject=${subject}&body=${body}`
    setStatus("success")
  }

  return (
    <form className="grid max-w-xl gap-3" onSubmit={onSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-nome" className="text-sm font-medium">
            {contactCopy.fields.name}
          </label>
          <input
            id="contato-nome"
            name="name"
            className="min-h-11 border border-[var(--color-ink)]/20 bg-white px-3"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-empresa" className="text-sm font-medium">
            {contactCopy.fields.company}
          </label>
          <input
            id="contato-empresa"
            name="company"
            className="min-h-11 border border-[var(--color-ink)]/20 bg-white px-3"
            value={company}
            onChange={(ev) => setCompany(ev.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contato-email" className="text-sm font-medium">
          {contactCopy.fields.email}
        </label>
        <input
          id="contato-email"
          name="email"
          type="email"
          className="min-h-11 border border-[var(--color-ink)]/20 bg-white px-3"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contato-mensagem" className="text-sm font-medium">
          {contactCopy.fields.message}
        </label>
        <textarea
          id="contato-mensagem"
          name="message"
          rows={4}
          className="border border-[var(--color-ink)]/20 bg-white px-3 py-2"
          value={message}
          onChange={(ev) => setMessage(ev.target.value)}
        />
      </div>
      <button
        type="submit"
        className="min-h-11 w-fit bg-[var(--color-ink)] px-5 text-sm font-semibold text-[var(--color-paper)] transition-opacity hover:opacity-90"
      >
        {contactCopy.submit}
      </button>
      {status === "success" && (
        <p role="status" className="text-sm text-[var(--color-courtyard)]">
          {contactCopy.success}
        </p>
      )}
      {status === "invalid" && (
        <p role="alert" className="text-sm text-red-800">
          Preencha nome, empresa e um e-mail válido.
        </p>
      )}
    </form>
  )
}

export function contactHref(): string {
  return import.meta.env.VITE_CONTACT_URL || contactMailto()
}
