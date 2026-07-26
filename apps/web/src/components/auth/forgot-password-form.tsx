import { Loader2 } from "lucide-react"
import type { FormEvent } from "react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ForgotPasswordFormProps = {
  email: string
  error: string | null
  submitting: boolean
  onEmailChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBackToSignIn: () => void
}

export function ForgotPasswordForm({
  email,
  error,
  submitting,
  onEmailChange,
  onSubmit,
  onBackToSignIn,
}: ForgotPasswordFormProps) {
  const emailId = useId()

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]">
      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Redefinir senha
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Informe o e-mail da conta. Se existir, enviaremos um link válido por 24 horas.
      </p>

      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? (
          <p
            className="rounded-[var(--radius)] border border-[var(--cp-danger)]/30 bg-[var(--cp-danger)]/5 px-3 py-2 text-sm text-[var(--cp-danger)]"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor={emailId}>E-mail</Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            placeholder="voce@empresa.com…"
            value={email}
            readOnly={submitting}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>

        <Button type="submit" className="h-11 w-full touch-manipulation" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Enviando…
            </>
          ) : (
            "Enviar link"
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="mt-3 h-11 w-full touch-manipulation"
        onClick={onBackToSignIn}
        disabled={submitting}
      >
        Voltar para entrar
      </Button>
    </section>
  )
}
