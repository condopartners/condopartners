import { Loader2 } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20
const GENERIC_ERROR = "Não foi possível concluir a ação. Tente de novo."

type AdminUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role: string | null
  createdAt: string
}

type Feedback = { kind: "success" | "error"; message: string }

function errorMessage(value: unknown): string {
  if (value && typeof value === "object" && "error" in value) {
    const message = (value as { error: unknown }).error
    if (typeof message === "string") return message
  }
  return GENERIC_ERROR
}

function FeedbackNote({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null
  return (
    <p
      className={cn(
        "rounded-[var(--radius)] border px-3 py-2 text-sm",
        feedback.kind === "error"
          ? "border-[var(--cp-danger)]/30 bg-[var(--cp-danger)]/5 text-[var(--cp-danger)]"
          : "border-border bg-muted/60 text-foreground",
      )}
      role={feedback.kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {feedback.message}
    </p>
  )
}

type CreateUserFormProps = {
  onCreated: () => void
  onCancel: () => void
}

function CreateUserForm({ onCreated, onCancel }: CreateUserFormProps) {
  const emailId = useId()
  const nameId = useId()
  const passwordId = useId()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)
    const { error } = await api.api.admin.users.post({ email, name, password })
    setSubmitting(false)
    if (error) {
      setFeedback({ kind: "error", message: errorMessage(error.value) })
      return
    }
    onCreated()
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Criar conta</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FeedbackNote feedback={feedback} />
        <div className="space-y-1.5">
          <Label htmlFor={emailId}>E-mail</Label>
          <Input
            id={emailId}
            type="email"
            required
            spellCheck={false}
            value={email}
            readOnly={submitting}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={nameId}>Nome</Label>
          <Input
            id={nameId}
            required
            value={name}
            readOnly={submitting}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={passwordId}>Senha</Label>
          <Input
            id={passwordId}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            readOnly={submitting}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Criando…
              </>
            ) : (
              "Criar conta"
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  )
}

type UserDetailProps = {
  user: AdminUser
  onChanged: () => void
  onClose: () => void
}

function UserDetail({ user, onChanged, onClose }: UserDetailProps) {
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [newPassword, setNewPassword] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setNewPassword("")
    setFeedback(null)
  }, [user])

  async function run(
    action: string,
    request: () => Promise<{ error: { value: unknown } | null }>,
    successMessage: string | ((result: unknown) => string),
  ) {
    setBusy(action)
    setFeedback(null)
    const { error, ...rest } = await request()
    setBusy(null)
    if (error) {
      setFeedback({ kind: "error", message: errorMessage(error.value) })
      return
    }
    const message =
      typeof successMessage === "function"
        ? successMessage((rest as { data?: unknown }).data)
        : successMessage
    setFeedback({ kind: "success", message })
    onChanged()
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run(
      "save",
      () => api.api.admin.users({ id: user.id }).patch({ name, email }),
      "Dados salvos.",
    )
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run(
      "set-password",
      () => api.api.admin.users({ id: user.id })["set-password"].post({ password: newPassword }),
      "Senha definida.",
    )
    setNewPassword("")
  }

  async function handleSendReset() {
    await run(
      "send-reset",
      () => api.api.admin.users({ id: user.id })["send-password-reset"].post(),
      "Link de reset enviado por e-mail.",
    )
  }

  async function handleInvalidate() {
    if (!window.confirm("Isso encerra as sessões e invalida a senha atual. Continuar?")) return
    await run(
      "invalidate",
      () => api.api.admin.users({ id: user.id })["invalidate-password"].post(),
      (data) => {
        const sent = Boolean((data as { resetEmailSent?: boolean } | undefined)?.resetEmailSent)
        return sent
          ? "Senha invalidada. Link de reset enviado por e-mail."
          : "Senha invalidada. O link de reset não foi enviado (SMTP indisponível)."
      },
    )
  }

  async function handleRevokeSessions() {
    if (!window.confirm("Isso encerra todas as sessões deste usuário. Continuar?")) return
    await run(
      "revoke",
      () => api.api.admin.users({ id: user.id })["revoke-sessions"].post(),
      "Sessões encerradas.",
    )
  }

  const anyBusy = busy !== null

  return (
    <section className="space-y-5 rounded-[var(--radius)] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <FeedbackNote feedback={feedback} />

      <form className="space-y-4" onSubmit={handleSave}>
        <div className="space-y-1.5">
          <Label htmlFor={nameId}>Nome</Label>
          <Input
            id={nameId}
            required
            value={name}
            readOnly={anyBusy}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={emailId}>E-mail</Label>
          <Input
            id={emailId}
            type="email"
            required
            spellCheck={false}
            value={email}
            readOnly={anyBusy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={anyBusy}>
          {busy === "save" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </form>

      <form className="space-y-1.5 border-t border-border pt-4" onSubmit={handleSetPassword}>
        <Label htmlFor={passwordId}>Senha</Label>
        <div className="flex gap-2">
          <Input
            id={passwordId}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            readOnly={anyBusy}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" variant="outline" disabled={anyBusy}>
            {busy === "set-password" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Definindo…
              </>
            ) : (
              "Definir senha"
            )}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" disabled={anyBusy} onClick={handleSendReset}>
          {busy === "send-reset" ? "Enviando…" : "Enviar link de reset"}
        </Button>
        <Button type="button" variant="outline" disabled={anyBusy} onClick={handleInvalidate}>
          {busy === "invalidate" ? "Invalidando…" : "Invalidar senha"}
        </Button>
        <Button type="button" variant="outline" disabled={anyBusy} onClick={handleRevokeSessions}>
          {busy === "revoke" ? "Encerrando…" : "Encerrar sessões"}
        </Button>
      </div>
    </section>
  )
}

export function AdminUsersPage() {
  const searchId = useId()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setPageError(null)
    const { data, error } = await api.api.admin.users.get({
      query: { limit: PAGE_SIZE, offset, ...(search ? { search } : {}) },
    })
    setLoading(false)
    if (error) {
      // Sessão sem privilégio de admin: gate de UI manda de volta para o início.
      if (error.status === 401 || error.status === 403) {
        window.location.replace("/")
        return
      }
      setPageError(errorMessage(error.value))
      return
    }
    setUsers(data.users)
    setTotal(data.total)
  }, [offset, search])

  useEffect(() => {
    void load()
  }, [load])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOffset(0)
    setSearch(searchInput.trim())
  }

  const selected = users.find((u) => u.id === selectedId) ?? null
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuários</h1>
        <Button type="button" onClick={() => setShowCreate((v) => !v)}>
          Criar conta
        </Button>
      </div>

      {showCreate ? (
        <CreateUserForm
          onCreated={() => {
            setShowCreate(false)
            void load()
          }}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      <form className="flex max-w-md gap-2" onSubmit={handleSearch}>
        <Label htmlFor={searchId} className="sr-only">
          Buscar por e-mail
        </Label>
        <Input
          id={searchId}
          type="search"
          placeholder="Buscar por e-mail…"
          spellCheck={false}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {pageError ? (
        <p
          className="rounded-[var(--radius)] border border-[var(--cp-danger)]/30 bg-[var(--cp-danger)]/5 px-3 py-2 text-sm text-[var(--cp-danger)]"
          role="alert"
        >
          {pageError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/60",
                    selectedId === u.id && "bg-muted/70",
                  )}
                  onClick={() => setSelectedId(u.id)}
                >
                  <td className="px-4 py-3 text-foreground">
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={() => setSelectedId(u.id)}
                    >
                      {u.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(u.role ?? "user") === "admin" ? "Super-admin" : "Usuário"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="tabular-nums">
          {from}–{to} de {total}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Próxima
          </Button>
        </div>
      </div>

      {selected ? (
        <UserDetail
          user={selected}
          onChanged={() => void load()}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  )
}
