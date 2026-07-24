# 00 — Project

- This is a Bun workspaces monorepo: `apps/api`, `apps/web`, `packages/shared`.
- **Product UI and user-facing copy: pt-BR.** Operator-facing GitHub issues/PRs: pt-BR.
- **Code identifiers, file paths, and agent manuals (`AGENTS.md`, `rules/`, `skills/`): English.**
- Do not invent product features. Implement only what an approved issue + `docs/specs/` entry require.
- Prefer the smallest change that satisfies the spec (YAGNI / ponytail).
- Keep the modular monolith: no microservices, no premature abstractions.
- Persistence infra is wired (Docker Postgres + Drizzle). Do not create or alter **tables or migrations** without an approved feature spec.
- Definition of done for any PR: `bun run check` passes locally and CI is green.
