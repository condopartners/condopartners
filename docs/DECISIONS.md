# Architecture decisions

Short ADR-lite log. Newest first.

## 2026-07-24 — Public GitHub repo for GitHub Pages

- **Decision:** `condopartners/condopartners` is **public** so GitHub Pages can host the marketing landing on the free org plan.
- **Why:** Private repos cannot enable Pages on the free plan; SIS-16 / landing spec require a live Pages URL.
- **Consequence:** Never commit secrets. Landing deploys from `gh-pages` (bootstrap) and via `.github/workflows/pages.yml` (Actions) after merge — URL `https://condopartners.github.io/condopartners/`.

## 2026-07-24 — Local Postgres host port 5433

- **Decision:** Publish Docker Postgres on host **`:5433`** (`5433:5432`), not `:5432`.
- **Why:** Host `:5432` is commonly occupied on shared/dev machines; remapping avoids bind failures without changing the in-container Postgres port.
- **Consequence:** `.env.example`, Drizzle fallbacks, and docs use `localhost:5433`. Run `bun run db:up` then `bun run db:migrate`.

## 2026-07-24 — Vendored Impeccable stays local (gitignored)

- **Decision:** Ignore locally installed Impeccable skill/hooks (`.github/skills/`, `.github/hooks/`, `.cursor/`) in git and Biome.
- **Why:** Impeccable is agent tooling installed per machine; linting/committing the vendored tree would noise CI and PRs.
- **Consequence:** Install/refresh Impeccable locally; do not commit skill blobs. Shared detector exceptions (if any) belong in committed `.impeccable/config.json` later — not in the skill tree.

## 2026-07-24 — Postgres local via Docker + Drizzle ORM

- **Decision:** Local Postgres 17 via `docker-compose.yml` + Drizzle ORM (`drizzle-orm/bun-sql`) in `apps/api`.
- **Why:** Matches the foundation docs’ Postgres assumption; Bun-native driver; typed schema/migrations without inventing domain tables yet.
- **Consequence:** Infra is wired (`bun run db:up`, `db:migrate`, `db:studio`). Schema stays **empty** until an approved feature spec adds tables. Supersedes “Persistence deferred”. Health reports `database: ok | unreachable` (soft-fail). Host port is **5433** (see ADR above).

## 2026-07-24 — Product UI and operator templates in pt-BR

- **Decision:** End-user software copy is **pt-BR**. GitHub issue/PR templates (and filled issues/PRs) are **pt-BR** for Brazilian Paperclip operators.
- **Why:** Operators and users are Brazilian; English-only process friction is unnecessary.
- **Consequence:** Code identifiers, file names, and agent manuals (`AGENTS.md`, `rules/`, `skills/`) remain English for coding-agent consistency. Conventional commit prefixes stay English; commit/PR bodies may be pt-BR. Specs in `docs/specs/` may be written in pt-BR.

## 2026-07-24 — Agent-driven development with engineer PR review

- **Decision:** Paperclip agents implement; engineers review/merge via CODEOWNERS.
- **Why:** Accelerate delivery while keeping quality gates (specs, TDD, CI, human approval).
- **Consequence:** `AGENTS.md`, `rules/`, `skills/`, issue/PR templates are mandatory process infrastructure.

## 2026-07-24 — Durable product docs in English; foundation pack separate

- **Decision:** Core durable docs (`PRODUCT.md`, `FEATURES.md`, `DECISIONS.md`) stay English unless/until the team translates them. Operator workflow templates are pt-BR.
- **Why:** Keep a stable English technical spine for agents while localizing operator UX.
- **Consequence:** The foundation design pack on branch `docs/fundacao-design` remains a separate reference until merged.

## 2026-07-24 — Persistence deferred (superseded)

- **Decision:** Scaffolding includes no database, ORM, or migrations.
- **Status:** **Superseded** by “Postgres local via Docker + Drizzle ORM”.
- **Why (historical):** First approved feature spec should choose persistence deliberately.
- **Consequence (historical):** Health check and web shell proved wiring only.

## 2026-07-24 — Biome + bun:test; no git hooks

- **Decision:** Biome for lint/format; Bun’s test runner; no husky/pre-commit hooks.
- **Why:** Fewer tools for agents; CI + mandatory `bun run check` is the gate.
- **Consequence:** Agents must run `bun run check` before every PR.

## 2026-07-24 — Bun workspaces monorepo

- **Decision:** `apps/api`, `apps/web`, `packages/shared` in one repo.
- **Why:** Spec and code travel together; shared types; one CI pipeline.
- **Consequence:** Root scripts orchestrate workspace tasks with `bun run --filter`.

## 2026-07-24 — Stack: Bun + ElysiaJS + React (Vite)

- **Decision:** TypeScript strict, Bun runtime, Elysia API, React + Vite + Tailwind + shadcn web, Eden Treaty for end-to-end types.
- **Why:** Fast DX for agent-written code; typed HTTP boundary; explicit API/UI split.
- **Consequence:** This **supersedes** the Next.js + Supabase stack note in the foundation design docs. Those docs remain valuable for domain/product design; runtime stack follows this decision.
