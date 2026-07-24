import { type FormEvent, useState } from "react"
import { waitlistCopy } from "../lib/copy"
import { isValidCorporateEmail } from "../lib/email"
import { waitlistStatusTone } from "./waitlistStatusTone"

type Status = "idle" | "success" | "error" | "invalid"

async function submitWaitlist(email: string): Promise<"ok" | "error"> {
  const endpoint = import.meta.env.VITE_WAITLIST_ENDPOINT
  if (!endpoint) {
    // Option A (spec): local confirmation stub — no API in this phase
    await new Promise((r) => setTimeout(r, 280))
    return "ok"
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    return res.ok ? "ok" : "error"
  } catch {
    return "error"
  }
}

export function WaitlistForm({ idPrefix = "waitlist" }: { idPrefix?: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [pending, setPending] = useState(false)
  const inputId = `${idPrefix}-email`

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidCorporateEmail(email)) {
      setStatus("invalid")
      return
    }
    setPending(true)
    setStatus("idle")
    const result = await submitWaitlist(email.trim())
    setPending(false)
    setStatus(result === "ok" ? "success" : "error")
  }

  return (
    <form
      className="flex w-full max-w-md flex-col gap-3"
      onSubmit={(e) => void onSubmit(e)}
      noValidate
    >
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink)]">
        {waitlistCopy.label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={waitlistCopy.placeholder}
          value={email}
          onChange={(ev) => {
            setEmail(ev.target.value)
            if (status !== "idle") setStatus("idle")
          }}
          className="min-h-11 flex-1 border border-[var(--color-ink)]/20 bg-white px-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink)]/45"
          aria-invalid={status === "invalid"}
          aria-describedby={status !== "idle" ? `${idPrefix}-status` : undefined}
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-[var(--color-courtyard)] px-5 text-sm font-semibold text-[var(--color-courtyard-ink)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-courtyard)_88%,black)] disabled:opacity-60"
        >
          {pending ? "Enviando…" : waitlistCopy.submit}
        </button>
      </div>
      {status === "success" && (
        <p
          id={`${idPrefix}-status`}
          role="status"
          className={`text-sm ${waitlistStatusTone.success}`}
        >
          {waitlistCopy.success}
        </p>
      )}
      {status === "error" && (
        <p id={`${idPrefix}-status`} role="alert" className={`text-sm ${waitlistStatusTone.alert}`}>
          {waitlistCopy.error}
        </p>
      )}
      {status === "invalid" && (
        <p id={`${idPrefix}-status`} role="alert" className={`text-sm ${waitlistStatusTone.alert}`}>
          Informe um e-mail válido (ex.: {waitlistCopy.placeholder}).
        </p>
      )}
    </form>
  )
}
