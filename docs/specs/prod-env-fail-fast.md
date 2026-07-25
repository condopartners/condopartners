# Fail-fast de WEB_ORIGIN / BETTER_AUTH_URL em produção

## Status

Aprovada (issue [SIS-123](/SIS/issues/SIS-123) — guardrail pós-[SIS-119](/SIS/issues/SIS-119))

## Issue

- Paperclip: [SIS-123](/SIS/issues/SIS-123)
- Parent: [SIS-119](/SIS/issues/SIS-119)

## Resumo

Evitar falha silenciosa em produção quando `WEB_ORIGIN` ou `BETTER_AUTH_URL`
faltam no ambiente da API. Hoje o código cai em `http://localhost:*`, a API
sobe saudável (`/health` 200) e o browser do usuário quebra com CORS / callbacks
errados. Alinhar ao padrão já usado por `BETTER_AUTH_SECRET` (erro no boot).

## Escopo

- Dentro:
  - Fail-fast quando `NODE_ENV === "production"` e `WEB_ORIGIN` ausente.
  - Idem para `BETTER_AUTH_URL`.
  - `NODE_ENV: production` no serviço `api` de `prod.stack.yml` e
    `prod.portainer.yml` (sem isso o guard não dispara).
  - Testes cobrindo presença/ausência em produção vs fora.
- Fora:
  - Mudar fallback de CORS em dev (`http://localhost:5173` continua válido).
  - SMTP, super-admin, hosts dev.

## Aceite

1. API em produção sem `WEB_ORIGIN` **não** sobe (erro explícito
   `WEB_ORIGIN is required`).
2. Idem para `BETTER_AUTH_URL`.
3. Fora de produção, fallbacks locais permanecem.
4. `bun run check` verde.

## Refs

- Código: `apps/api/src/env.ts`, `apps/api/src/app.ts`, `apps/api/src/auth/auth.ts`
- Deploy: `deploy/portainer/prod.stack.yml`, `prod.portainer.yml`
- Spec auth: [`auth-better-auth.md`](./auth-better-auth.md)
- Spec CORS hotfix: [`prod-cors-admin-access.md`](./prod-cors-admin-access.md)
