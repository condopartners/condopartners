import { APP_NAME } from "@condopartners/shared"
import { LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

type AppHeaderProps = {
  title: string
  email: string
  onSignOut: () => void
  onOpenMenu?: () => void
  showMenuButton?: boolean
}

export function AppHeader({
  title,
  email,
  onSignOut,
  onOpenMenu,
  showMenuButton = false,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] sm:px-6">
      {showMenuButton ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 w-11 shrink-0 touch-manipulation px-0 lg:hidden"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold tracking-tight text-foreground lg:hidden">
          {APP_NAME}
        </p>
        <h1 className="hidden truncate text-base font-semibold text-foreground lg:block">
          {title}
        </h1>
      </div>

      <p className="hidden min-w-0 max-w-[12rem] truncate text-sm text-muted-foreground tabular-nums sm:block md:max-w-xs">
        {email}
      </p>

      <Button
        type="button"
        variant="ghost"
        className="h-11 shrink-0 touch-manipulation gap-2"
        onClick={onSignOut}
      >
        <LogOut className="size-4" aria-hidden />
        Sair
      </Button>
    </header>
  )
}
