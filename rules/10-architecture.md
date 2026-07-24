# 10 — Architecture

- **Modular monolith.** One deployable API, one web app, clear module boundaries.
- API modules live under `apps/api/src/modules/<name>/` and are registered in `apps/api/src/app.ts`.
- Shared types and constants belong in `packages/shared`. Do not duplicate types across apps.
- Web talks to the API via Eden Treaty (`apps/web/src/lib/api.ts`), typed from `export type App` in the API.
- Keep domain logic out of React components and out of thin HTTP handlers — put it in named functions/services inside the module.
- Database access lives in `apps/api/src/db/` (Drizzle client + schema). Modules import `db` from there — do not open ad-hoc connections.
- Multi-tenancy will be `tenant_id`-scoped when domain tables land. Design new domain types with that in mind; do not hardcode a single company.
- Configurable concerns (commission, pricing) will use strategy interfaces later. Do not invent a rules engine.
