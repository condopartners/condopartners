import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export type VerifyEmailNoticeProps = {
  email: string
  message: string | null
  error: string | null
  submitting: boolean
  onResend: () => void
  onBackToSignIn: () => void
}

export function VerifyEmailNotice({
  email,
  message,
  error,
  submitting,
  onResend,
  onBackToSignIn,
}: VerifyEmailNoticeProps) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]">
      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Conta criada
      </h1>

      <p
        className="mb-4 rounded-[var(--radius)] border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/5 px-3 py-2 text-sm text-[var(--cp-success)]"
        role="status"
        aria-live="polite"
      >
        Conta criada. Verifique seu e-mail para ativar o acesso.
      </p>

      <p className="mb-6 text-sm text-muted-foreground">
        Enviamos um link de ativação para{" "}
        <span className="break-all font-medium text-foreground">{email}</span>. Abra a mensagem e
        clique em <span className="font-medium text-foreground">Ativar conta</span>. O link vale por{" "}
        <span className="font-medium text-foreground">30 dias</span>.
      </p>

      {error ? (
        <p
          className="mb-4 rounded-[var(--radius)] border border-[var(--cp-danger)]/30 bg-[var(--cp-danger)]/5 px-3 py-2 text-sm text-[var(--cp-danger)]"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      {message ? (
        <p
          className="mb-4 rounded-[var(--radius)] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        className="h-11 w-full touch-manipulation"
        onClick={onResend}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Reenviando…
          </>
        ) : (
          "Reenviar e-mail de ativação"
        )}
      </Button>

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
