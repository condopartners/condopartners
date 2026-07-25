# Hotfix — CORS produção + bootstrap admin

## Status

Aprovada (CTO — plano [SIS-113](/SIS/issues/SIS-113))

## Issue

- Paperclip: [SIS-117](/SIS/issues/SIS-117) (DEV) · parent [SIS-113](/SIS/issues/SIS-113)
- QA: [SIS-118](/SIS/issues/SIS-118)

## Resumo

Corrigir CORS e Better Auth em produção: stacks Portainer não passavam
`WEB_ORIGIN` / `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` ao serviço `api`,
fazendo fallback de CORS para `http://localhost:5173` e `500` em sign-in
(`BETTER_AUTH_SECRET is required`). Provisionar 1 usuário Better Auth bootstrap
(email+senha) sem RBAC/super-admin.

## Escopo

- Dentro:
  - Spec deste hotfix.
  - Wire das 3 vars no `api.environment` de `*.stack.yml` e `*.portainer.yml`
    (prod + dev).
  - Documentação em `deploy/.env.example` + `deploy/README.md` (placeholders).
  - Testes: CORS (origin confiável vs estranha) + assert de artefato deploy.
  - Aplicar env real no Portainer prod + redeploy `api`.
  - Provisionar 1 usuário Better Auth; credenciais ao board por canal seguro.
- Fora:
  - Super-admin / RBAC ([SIS-116](/SIS/issues/SIS-116)).
  - SMTP / verificação de e-mail ([SIS-115](/SIS/issues/SIS-115)).
  - Restaurar app-dev/api-dev ([SIS-114](/SIS/issues/SIS-114)).
  - Mudança de lógica CORS no código (já lê `WEB_ORIGIN`).

## Comportamento / aceite

1. `OPTIONS` com `Origin: https://app.condopartners.com.br` retorna
   `Access-Control-Allow-Origin` correspondente.
2. Auth deixa de falhar por `BETTER_AUTH_SECRET` missing.
3. Board consegue login com usuário bootstrap (handoff seguro de credenciais).
4. Spec + PR abertos; `bun run check` verde.

## Env (prod / dev hospedados)

| Var | Prod | Dev |
|-----|------|-----|
| `WEB_ORIGIN` | `https://app.condopartners.com.br` | `https://app.dev.condopartners.com.br` |
| `BETTER_AUTH_URL` | `https://api.condopartners.com.br` | `https://api.dev.condopartners.com.br` |
| `BETTER_AUTH_SECRET` | aleatório ≥32 (só Portainer) | idem |

## Refs

- Código: `apps/api/src/app.ts`, `apps/api/src/auth/auth.ts`
- Deploy: `deploy/portainer/*`, `deploy/.env.example`
- Spec auth: [`auth-better-auth.md`](./auth-better-auth.md)
