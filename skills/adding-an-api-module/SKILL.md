---
name: adding-an-api-module
description: Add a new Elysia API module following the health module template. Use when creating or extending backend routes.
---

# Adding an API module

## Template

Canonical example: [`apps/api/src/modules/health/`](../../apps/api/src/modules/health/)

## Steps

1. Create `apps/api/src/modules/<name>/index.ts` exporting an `Elysia` plugin (use `prefix`).
2. Validate request/response with `t` schemas (`rules/30-api.md`).
3. Put domain types in `@condopartners/shared` when the web app also needs them.
4. Register the module in [`apps/api/src/app.ts`](../../apps/api/src/app.ts) via `.use(...)`.
5. Add `apps/api/src/modules/<name>/<name>.test.ts` using `app.handle(new Request(...))`.
6. Keep handlers thin. Extract pure functions for logic.
7. Run `bun run --filter '@condopartners/api' test` and `bun run check`.

## Do not

- Add auth, background jobs, or **new tables/migrations** without an approved spec.
- Put business logic in `src/index.ts` (bootstrap only).
- Break the exported `App` type used by Eden Treaty.
