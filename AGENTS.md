# AGENTS.md — CondoPartners operating manual

This repository is developed primarily by **Paperclip agents** (vibe coding). Engineers review and merge PRs. Read this file first on every task.

## What this product is

CondoPartners is a multi-tenant B2B platform for hierarchical partner networks, product catalogs, sales tracking, and commission distribution across companies (starting with Clique Retire and eCondos).

- Product overview and glossary: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Core features (not built yet): [`docs/FEATURES.md`](docs/FEATURES.md)
- Architecture decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Specs (required before features): [`docs/specs/`](docs/specs/)
- Detailed design pack (Portuguese, merge separately): branch `docs/fundacao-design`

**Do not implement product features in scaffolding PRs.** Features start only from an approved issue + approved spec.

## Golden rules

1. **Language** — product UI and operator-facing GitHub issues/PRs are **pt-BR**. Code identifiers, file names, `AGENTS.md` / `rules/` / `skills/`, and conventional commit *prefixes* stay in English for tooling consistency.
2. **No feature without an approved issue + spec** in `docs/specs/` (specs may be written in pt-BR).
3. **TDD** — failing test first for behavior changes (see `rules/50-testing.md`).
4. **`bun run check` must be green** before opening or updating a PR (lint + typecheck + test).
5. **Small PRs** — one concern per PR; prefer vertical slices over giant diffs.
6. **Conventional commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:` (message body may be pt-BR).
7. **No secrets** in the repo. Use `.env` (never commit) from `.env.example`.
8. **Money as integer cents** (or the smallest currency unit). Never floating-point money.
9. **Follow `rules/`** — they are mandatory, not suggestions.
10. **Engineers approve merges** — agents open PRs; humans merge.

## Commands

```bash
bun install          # install workspaces
bun run dev          # API (:3000) + web (:5173)
bun run dev:api      # API only
bun run dev:web      # web only
bun run lint         # Biome check
bun run lint:fix    # Biome autofix
bun run typecheck    # TypeScript across workspaces
bun run test         # bun:test across workspaces
bun run build        # production builds
bun run check        # lint + typecheck + test  ← definition of done
```

## Repo map

| Path | Role |
|------|------|
| `apps/api` | ElysiaJS API on Bun |
| `apps/web` | React + Vite + Tailwind + shadcn/ui |
| `packages/shared` | Shared types/constants |
| `rules/` | Short imperative coding rules |
| `skills/` | Project-local agent skills |
| `docs/` | Product docs, decisions, specs |

## Workflow (every non-trivial change)

```
approved issue
  → spec in docs/specs/ (superpowers brainstorming / writing-plans)
  → implementation with TDD (superpowers test-driven-development)
  → bun run check
  → PR (fill template; CI green)
  → engineer review (CODEOWNERS)
  → merge
```

Use project skill [`skills/working-on-a-task/SKILL.md`](skills/working-on-a-task/SKILL.md) as the end-to-end checklist.

## Paperclip company skills — when to use which

These skills are installed in the Paperclip company library (not vendored in this repo). Load them on demand:

| Skill | Use when |
|-------|----------|
| **superpowers** | Specifying, planning, TDD, subagent-driven execution, code review loops |
| **graphify** | Understanding codebase relationships; prefer `graphify query` when `graphify-out/` exists instead of broad grepping |
| **ui-ux-pro-max** | Any UI/UX work — generate or consult the design system before building screens |
| **ponytail** | Writing/changing code — YAGNI ladder; write only what the task needs |
| **caveman** | Agent prose — terse replies; no filler narration |
| **taste-skill** (`design-taste-frontend`) | Frontend work — anti-slop pre-flight; avoid generic AI UI patterns |

Project-local skills in [`skills/`](skills/) stitch these into CondoPartners conventions.

## Module patterns

- **API modules:** copy [`apps/api/src/modules/health/`](apps/api/src/modules/health/) — see [`skills/adding-an-api-module/SKILL.md`](skills/adding-an-api-module/SKILL.md)
- **Web features:** Eden client in `apps/web/src/lib/api.ts` — see [`skills/adding-a-web-feature/SKILL.md`](skills/adding-a-web-feature/SKILL.md)

## Out of scope until specified

- Persistence / database
- Auth, tenancy, RBAC
- Partner trees, commissions, products, sales
- Billing integrations

Persistence is deferred until the first approved feature spec chooses it ([`docs/DECISIONS.md`](docs/DECISIONS.md)).
