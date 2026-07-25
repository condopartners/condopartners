# Fundação de autenticação — Better Auth (email + senha)

## Status

Aprovada

## Issue

- GitHub: [condopartners#14](https://github.com/condopartners/condopartners/issues/14)
- Paperclip: [SIS-65](/SIS/issues/SIS-65) (spec base) · [SIS-67](/SIS/issues/SIS-67) (fundação) · [SIS-69](/SIS/issues/SIS-69) (fatia DEV)

## Resumo

Entregar a **fundação técnica** de autenticação email+senha com [Better Auth](https://www.better-auth.com/)
no CondoPartners: API Elysia/Bun + Drizzle/Postgres com handler em `/api/auth/*`, client
`better-auth/react` no web e sessão por cookie em dev local. O shell SaaS polido e o PWA ficam
na issue irmã bloqueada por Design; aqui entra apenas o **wiring mínimo** de UI (forms crus pt-BR +
gate de sessão) para provar o fluxo ponta a ponta.

## Escopo

- Dentro:
  - Dependência `better-auth` na API e client `better-auth/react` no web.
  - Adapter Drizzle (`provider: "pg"`) sobre o `db` existente.
  - Schema/migrations das tables Better Auth: `user`, `session`, `account`, `verification`.
  - Mount do handler em `/api/auth/*`.
  - CORS com `credentials` e origin do web (`WEB_ORIGIN`, `http://localhost:5173` em dev).
  - Fluxos: cadastro, login, logout, sessão atual.
  - Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN` (em `.env.example`, sem valor real).
  - Testes API (bun:test): sign-up, sign-in ok, credencial inválida, get-session, sign-out.
  - Wiring web: forms mínimos pt-BR + gate de sessão (visual cru aceitável).
- Fora:
  - Shell SaaS polido e PWA (issue irmã, bloqueada por Design).
  - OAuth / social login.
  - Verificação obrigatória de e-mail e reset por e-mail (sem mailer).
  - RBAC, roles, convites, organizações, multi-tenant (`tenant_id`).
  - Partners, comissões, produtos, vendas.

## Comportamento

Critérios de aceite (subconjunto de auth de SIS-65 — itens 1–3, 5, 9):

1. Com Postgres up e migrations aplicadas, sign-up com e-mail/senha válidos cria usuário e retorna
   sessão (`Set-Cookie`).
2. Sign-in com credenciais corretas estabelece sessão; credenciais erradas falham (comportamento
   padrão Better Auth).
3. Com cookie de sessão, get-session retorna o usuário; após sign-out, sessão inativa.
4. Web: **Criar conta** / **Entrar** em pt-BR (forms mínimos); logado vê saudação + e-mail + **Sair**.
5. Cookies cross-origin em local (`web:5173` → `api:3000`) com CORS + credentials.
6. `.env.example` lista variáveis novas sem secrets reais.

## Dados / API

### Env

| Var | Onde | Exemplo local |
|-----|------|----------------|
| `DATABASE_URL` | API (já existe) | `postgres://condopartners:condopartners@localhost:5432/condopartners` |
| `BETTER_AUTH_SECRET` | API | string aleatória ≥32 chars (só `.env`) |
| `BETTER_AUTH_URL` | API | `http://localhost:3000` |
| `WEB_ORIGIN` | API | `http://localhost:5173` |
| `VITE_API_URL` | Web | `http://localhost:3000` |

### Auth server

- `betterAuth({ database: drizzleAdapter(db, { provider: "pg", schema }), secret, baseURL, trustedOrigins: [WEB_ORIGIN], emailAndPassword: { enabled: true, requireEmailVerification: false } })`
- Base path: `/api/auth`

### Endpoints (Better Auth)

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`

### Schema Drizzle

Gerado via CLI Better Auth em `apps/api/src/db/auth-schema.ts` e re-exportado de
`apps/api/src/db/schema.ts`. Migrations via `bun run db:generate` + `bun run db:migrate`.
Sem tables de domínio além do auth.

## UI

Apenas wiring mínimo nesta fatia (layout polido fica com o handoff de Design). Copy pt-BR mínima:

| Contexto | Copy |
|----------|------|
| Título cadastro | Criar conta |
| Título login | Entrar |
| Campo e-mail | E-mail |
| Campo senha | Senha |
| Campo nome (sign-up) | Nome |
| CTA cadastro | Criar conta |
| CTA login | Entrar |
| CTA logout | Sair |
| Erro genérico | Não foi possível autenticar. Verifique os dados e tente de novo. |
| Saudação logada | Olá, {email} |

## Riscos

- **CORS/cookies** em HTTP local — validar defaults Better Auth (`credentials`, `trustedOrigins`).
- **Secrets** — `BETTER_AUTH_SECRET` obrigatório; nunca commitar valor real.
- **Adapter package** — confirmar import Drizzle na versão pinada.
- **Tenancy futuro** — não acoplar `user` a tenant agora.

## Plano de teste

1. `bun run db:up` + `bun run db:migrate`.
2. Testes API `apps/api/src/modules/auth/auth.test.ts` (bun:test): sign-up, sign-in ok, credencial
   inválida, get-session, sign-out — sequência red → green → refactor registrada no PR.
3. Smoke web: cadastro → sessão → logout → login.
4. `bun run check` verde.
