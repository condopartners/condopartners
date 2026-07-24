import type { HealthResponse } from "@condopartners/shared"
import { APP_NAME } from "@condopartners/shared"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

type LoadState =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string }

export function App() {
  const [state, setState] = useState<LoadState>({ kind: "loading" })

  const loadHealth = useCallback(async () => {
    setState({ kind: "loading" })
    try {
      const { data, error } = await api.health.get()
      if (error || !data) {
        setState({ kind: "error", message: "Falha ao verificar a saúde da API" })
        return
      }
      setState({ kind: "ok", data })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      setState({ kind: "error", message })
    }
  }, [])

  useEffect(() => {
    void loadHealth()
  }, [loadHealth])

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Scaffolding
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          Verificação do monorepo. Ainda sem features de produto — esta página só prova que o web
          consegue chamar a API via Eden Treaty.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">API /health</h2>
        {state.kind === "loading" && <p>Verificando…</p>}
        {state.kind === "error" && (
          <p className="text-sm text-red-700" role="alert">
            {state.message}
          </p>
        )}
        {state.kind === "ok" && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{state.data.status}</dd>
            <dt className="text-muted-foreground">Serviço</dt>
            <dd className="font-medium">{state.data.service}</dd>
            <dt className="text-muted-foreground">Timestamp</dt>
            <dd className="font-mono text-xs">{state.data.timestamp}</dd>
          </dl>
        )}
        <div className="mt-4">
          <Button type="button" onClick={() => void loadHealth()}>
            Verificar de novo
          </Button>
        </div>
      </section>
    </main>
  )
}
