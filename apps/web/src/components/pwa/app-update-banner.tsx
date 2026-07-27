import { Button } from "@/components/ui/button"

export type AppUpdateBannerStatus = "available" | "updating" | "error"

export type AppUpdateBannerProps = {
  status: AppUpdateBannerStatus
  onUpdate: () => void
  onDismiss: () => void
}

export function AppUpdateBanner({ status, onUpdate, onDismiss }: AppUpdateBannerProps) {
  const busy = status === "updating"
  const body =
    status === "error"
      ? "Não foi possível atualizar. Tente de novo."
      : "Há uma atualização do CondoPartners. Atualize para usar a versão mais recente."

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Aviso de atualização do aplicativo"
      className="cp-app-update-banner fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card px-4 py-4 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)] sm:px-6"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">Nova versão disponível</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onDismiss}
            className="min-h-11 touch-manipulation sm:min-h-9"
          >
            Agora não
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={onUpdate}
            className="min-h-11 touch-manipulation sm:min-h-9"
          >
            {busy ? "Atualizando…" : "Atualizar agora"}
          </Button>
        </div>
      </div>
    </div>
  )
}
