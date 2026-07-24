---
name: working-on-a-task
description: End-to-end CondoPartners workflow from approved issue through spec, TDD implementation, check, and PR. Use for any non-trivial change.
---

# Working on a task

## Preconditions

- There is an **approved GitHub issue**.
- You have read [`AGENTS.md`](../../AGENTS.md) and the relevant files under [`rules/`](../../rules/).

## Steps

1. **Orient**
   - Read the issue and linked design docs.
   - If `graphify-out/` exists, prefer **graphify** queries for codebase context.
   - Confirm the change is in scope (no opportunistic features).

2. **Specify** (superpowers)
   - Use brainstorming / writing-plans until the design is clear.
   - Write or update a spec under `docs/specs/<slug>.md`.
   - Stop for human approval if the issue requires it.

3. **Plan**
   - Break work into small tasks with file paths and verification steps.
   - Prefer **ponytail**: only what the task needs.

4. **Implement with TDD** (superpowers test-driven-development)
   - Red → green → refactor.
   - Follow `rules/30-api.md` / `rules/40-frontend.md` as applicable.
   - For UI: consult **ui-ux-pro-max**, then **taste-skill** pre-flight.

5. **Verify**
   - Run `bun run check`.
   - Manually smoke-test affected paths (`bun run dev` when relevant).

6. **PR**
   - Branch `feat/<slug>` (or `fix/` / `chore/` / `docs/`).
   - Fill `.github/pull_request_template.md`.
   - Keep prose **caveman**-terse in comments; be precise in the PR body.
   - Wait for CI + engineer review. Do not merge yourself.

## Done when

- Spec exists (for features).
- Tests cover the new behavior.
- `bun run check` is green.
- PR is open and linked to the issue.
