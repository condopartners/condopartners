# Architecture decisions

Short ADR-lite log. Newest first.

## 2026-07-24 — Agent-driven development with engineer PR review

- **Decision:** Paperclip agents implement; engineers review/merge via CODEOWNERS.
- **Why:** Accelerate delivery while keeping quality gates (specs, TDD, CI, human approval).
- **Consequence:** `AGENTS.md`, `rules/`, `skills/`, issue/PR templates are mandatory process infrastructure.

## 2026-07-24 — English-only repository language

- **Decision:** Code, docs produced by agents, commits, and PRs are English.
- **Why:** Shared language for multi-company contributors and agent tooling.
- **Consequence:** Portuguese source materials (transcript, foundation branch) remain reference inputs; durable docs are English distillations (`PRODUCT.md`).

## 2026-07-24 — Persistence deferred

- **Decision:** Scaffolding includes no database, ORM, or migrations.
- **Why:** First approved feature spec should choose persistence deliberately.
- **Consequence:** Health check and web shell prove wiring only. Foundation docs on `docs/fundacao-design` that assume Postgres/RLS remain design input, not current runtime.

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
