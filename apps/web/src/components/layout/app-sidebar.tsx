import { APP_NAME } from "@condopartners/shared"
import { Home, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type AppSidebarProps = {
  className?: string
  isAdmin?: boolean
  onNavigate?: () => void
}

type NavItemProps = {
  href: string
  label: string
  icon: typeof Home
  active: boolean
  onNavigate?: () => void
}

function NavItem({ href, label, icon: Icon, active, onNavigate }: NavItemProps) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-foreground",
        "transition-colors duration-150 hover:bg-muted",
        active &&
          "bg-muted/70 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--cp-accent)]",
      )}
      onClick={onNavigate}
    >
      <Icon className="size-4 shrink-0 text-[var(--cp-accent)]" aria-hidden />
      {label}
    </a>
  )
}

export function AppSidebar({ className, isAdmin = false, onNavigate }: AppSidebarProps) {
  // Testes renderizam com renderToString (sem window)
  const pathname = typeof window === "undefined" ? "/" : window.location.pathname
  const onAdmin = pathname.startsWith("/admin")

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-14 items-center border-b border-border px-5">
        <p className="text-base font-bold tracking-tight text-foreground">{APP_NAME}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Principal">
        <NavItem href="/" label="Início" icon={Home} active={!onAdmin} onNavigate={onNavigate} />
        {isAdmin ? (
          <NavItem
            href="/admin"
            label="Admin"
            icon={ShieldCheck}
            active={onAdmin}
            onNavigate={onNavigate}
          />
        ) : null}
      </nav>
    </div>
  )
}
