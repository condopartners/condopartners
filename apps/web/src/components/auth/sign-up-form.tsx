import { Loader2 } from "lucide-react"
import type { FormEvent } from "react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type SignUpFormProps = {
  name: string
  email: string
  password: string
  error: string | null
  submitting: boolean
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSwitchToSignIn: () => void
}

export function SignUpForm({
  name,
  email,
  password,
  error,
  submitting,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Criar conta
      </h1>

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
          <Label htmlFor={nameId}>Nome</Label>
          <Input
            id={nameId}
            type="text"
            autoComplete="name"
            required
            placeholder="Maria Silva…"
            value={name}
            readOnly={submitting}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor={passwordId}>Senha</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            readOnly={submitting}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
        </div>

        <Button type="submit" className="h-11 w-full touch-manipulation" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Criando conta…
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="mt-3 h-11 w-full touch-manipulation"
        onClick={onSwitchToSignIn}
        disabled={submitting}
      >
        Já tem conta? Entrar
      </Button>
    </section>
  )
}
