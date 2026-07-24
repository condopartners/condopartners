# 30 — API (Elysia)

- Every route validates input/output with Elysia's `t` schemas.
- One folder per module under `apps/api/src/modules/<name>/` with `index.ts` exporting an `Elysia` plugin.
- Handlers stay thin: parse → call domain function → return. No business logic inline in handlers.
- Export `type App = typeof app` from `apps/api/src/app.ts` so the web Eden client stays typed.
- Prefer standard error shapes: `{ error: string; code?: string; details?: unknown }` with appropriate HTTP status.
- Do not catch and swallow errors silently. Log safely (no PII) and return controlled responses.
- Colocate `*.test.ts` next to the module (see `health` module).
- Do not add auth, persistence, or background jobs without an approved spec.
