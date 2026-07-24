# CondoPartners

Multi-tenant partner network and commission platform scaffolding.

Site: [condopartners.com.br](https://condopartners.com.br)

This repository is ready to **run and extend**. It intentionally ships **no product features** yet — only apps wiring, shared types, agent guardrails, local Postgres, and CI.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime / package manager | [Bun](https://bun.sh) workspaces |
| API | [ElysiaJS](https://elysiajs.com) |
| Web | React 19 + Vite + Tailwind CSS v4 + shadcn/ui |
| Database | Postgres 17 (Docker) + [Drizzle ORM](https://orm.drizzle.team) |
| Types across the wire | [Eden Treaty](https://elysiajs.com/eden/overview.html) |
| Lint / format | Biome |
| Tests | `bun:test` |

Schema is **empty** until an approved feature spec adds tables ([`docs/DECISIONS.md`](docs/DECISIONS.md)).

## Quickstart

```bash
# Requires Bun (https://bun.sh) and Docker
bun install
cp .env.example .env
bun run db:up
bun run db:migrate
bun run dev
```

- API: http://localhost:3000 — try `curl http://localhost:3000/health`
- Web: http://localhost:5173 — shell page calls `/health` via Eden

```bash
bun run check   # lint + typecheck + test (definition of done)
bun run build
```

## Repository map

```
apps/api          Elysia API (health module = canonical pattern)
apps/web          React app (minimal shell)
packages/shared   Shared types/constants
docker-compose.yml  Local Postgres
AGENTS.md         Agent operating manual (start here for agents)
rules/            Mandatory coding rules
skills/           Project-local agent skills
docs/PRODUCT.md   Product overview + glossary
docs/DECISIONS.md Architecture decision log
docs/specs/       Feature specs (required before implementation)
.github/          CI, PR template, CODEOWNERS, issue templates
```

## How we work

Development is primarily **Paperclip-agent driven** (vibe coding). Engineers review PRs.

1. Approved issue
2. Spec in `docs/specs/` (superpowers)
3. TDD implementation following `rules/`
4. `bun run check` green
5. PR → engineer review → merge

Read [`AGENTS.md`](AGENTS.md) for golden rules and the company skills roster (superpowers, graphify, ui-ux-pro-max, ponytail/caveman, taste-skill).

## Product context

See [`docs/PRODUCT.md`](docs/PRODUCT.md) and [`docs/FEATURES.md`](docs/FEATURES.md). Deeper design artifacts live on branch `docs/fundacao-design` and are merged by the team separately.
