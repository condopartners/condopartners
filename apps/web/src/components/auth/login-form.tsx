import { Loader2 } from "lucide-react"
import type { FormEvent } from "react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type LoginFormProps = {
  email: string
  password: string
  rememberMe: boolean
  error: string | null
  success: string | null
  submitting: boolean
  showResend?: boolean
  resending?: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberMeChange: (value: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onForgotPassword: () => void
  onSwitchToSignUp: () => void
  onResendVerification?: () => void
}

export function LoginForm({
  email,
  password,
  rememberMe,
  error,
  success,
  submitting,
  showResend = false,
  resending = false,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit,
  onForgotPassword,
  onSwitchToSignUp,
  onResendVerification,
}: LoginFormProps) {
  const emailId = useId()
  const passwordId = useId()
  const rememberId = useId()
  const rememberHintId = useId()

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Entrar
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

        {success ? (
          <p
            className="rounded-[var(--radius)] border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/5 px-3 py-2 text-sm text-[var(--cp-success)]"
            role="status"
            aria-live="polite"
          >
            {success}
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

        <div className="space-y-1.5">
          <Label htmlFor={passwordId}>Senha</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            readOnly={submitting}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <button
            type="button"
            className="min-h-11 touch-manipulation text-left text-sm font-medium text-[var(--cp-primary)] hover:underline disabled:opacity-50"
            onClick={onForgotPassword}
            disabled={submitting || resending}
          >
            Esqueci minha senha
          </button>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={rememberId}
            className="flex min-h-11 cursor-pointer items-start gap-3 touch-manipulation"
          >
            <input
              id={rememberId}
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border-border accent-[var(--cp-primary)]"
              checked={rememberMe}
              disabled={submitting}
              aria-describedby={rememberHintId}
              onChange={(e) => onRememberMeChange(e.target.checked)}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">Manter conectado</span>
              <span id={rememberHintId} className="block text-sm text-muted-foreground">
                Mantém a sessão por até 30 dias neste dispositivo. Sem marcar, a sessão termina ao
                fechar o navegador.
              </span>
            </span>
          </label>
        </div>

        <Button type="submit" className="h-11 w-full touch-manipulation" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="mt-3 h-11 w-full touch-manipulation"
        onClick={onSwitchToSignUp}
        disabled={submitting || resending}
      >
        Criar conta
      </Button>

      {showResend && onResendVerification ? (
        <Button
          type="button"
          variant="outline"
          className="mt-2 h-11 w-full touch-manipulation"
          onClick={onResendVerification}
          disabled={submitting || resending || !email}
        >
          {resending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Reenviando…
            </>
          ) : (
            "Reenviar e-mail de ativação"
          )}
        </Button>
      ) : null}
    </section>
  )
}
