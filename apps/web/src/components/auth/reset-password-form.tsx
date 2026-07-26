import { Loader2 } from "lucide-react"
import type { FormEvent } from "react"
import { useId } from "react"
import type { FieldErrors } from "@/components/auth/auth-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ResetPasswordFormProps = {
  password: string
  confirmPassword: string
  error: string | null
  fieldErrors: FieldErrors
  submitting: boolean
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onRequestNewLink: () => void
}

export function ResetPasswordForm({
  password,
  confirmPassword,
  error,
  fieldErrors,
  submitting,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onRequestNewLink,
}: ResetPasswordFormProps) {
  const passwordId = useId()
  const confirmId = useId()
  const passwordErrorId = useId()
  const confirmErrorId = useId()
  const passwordHintId = useId()

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Escolha uma nova senha
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
          <Label htmlFor={passwordId}>Nova senha</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            readOnly={submitting}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? passwordErrorId : passwordHintId}
            className={
              fieldErrors.password
                ? "border-[var(--cp-danger)] focus-visible:ring-[var(--cp-danger)]"
                : undefined
            }
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          {fieldErrors.password ? (
            <p id={passwordErrorId} className="text-sm text-[var(--cp-danger)]">
              {fieldErrors.password}
            </p>
          ) : (
            <p id={passwordHintId} className="text-sm text-muted-foreground">
              Use pelo menos 8 caracteres.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={confirmId}>Confirmar senha</Label>
          <Input
            id={confirmId}
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            readOnly={submitting}
            aria-invalid={fieldErrors.confirm ? true : undefined}
            aria-describedby={fieldErrors.confirm ? confirmErrorId : undefined}
            className={
              fieldErrors.confirm
                ? "border-[var(--cp-danger)] focus-visible:ring-[var(--cp-danger)]"
                : undefined
            }
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
          {fieldErrors.confirm ? (
            <p id={confirmErrorId} className="text-sm text-[var(--cp-danger)]">
              {fieldErrors.confirm}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="h-11 w-full touch-manipulation" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            "Salvar nova senha"
          )}
        </Button>
      </form>

      {error ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-11 w-full touch-manipulation"
          onClick={onRequestNewLink}
          disabled={submitting}
        >
          Pedir novo link
        </Button>
      ) : null}
    </section>
  )
}
