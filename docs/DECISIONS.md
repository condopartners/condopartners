# Architecture decisions

Short ADR-lite log. Newest first.

## 2026-07-24 — Postgres local via Docker + Drizzle ORM

- **Decision:** Local Postgres 17 via `docker-compose.yml` + Drizzle ORM (`drizzle-orm/bun-sql`) in `apps/api`.
- **Why:** Matches the foundation docs’ Postgres assumption; Bun-native driver; typed schema/migrations without inventing domain tables yet.
- **Consequence:** Infra is wired (`bun run db:up`, `db:migrate`, `db:studio`). Schema stays **empty** until an approved feature spec adds tables. Supersedes “Persistence deferred”. Health reports `database: ok | unreachable` (soft-fail).

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
