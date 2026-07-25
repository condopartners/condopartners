import { APP_NAME } from "@condopartners/shared"
import { Home } from "lucide-react"
import { cn } from "@/lib/utils"

type AppSidebarProps = {
  className?: string
  onNavigate?: () => void
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-14 items-center border-b border-border px-5">
        <p className="text-base font-bold tracking-tight text-foreground">{APP_NAME}</p>
      </div>
      <nav className="flex-1 p-3" aria-label="Principal">
        <a
          href="/"
          className={cn(
            "relative flex min-h-11 items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-foreground",
            "bg-muted/70 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--cp-accent)]",
            "transition-colors duration-150 hover:bg-muted",
          )}
          onClick={onNavigate}
        >
          <Home className="size-4 shrink-0 text-[var(--cp-accent)]" aria-hidden />
          Início
        </a>
      </nav>
    </div>
  )
}
