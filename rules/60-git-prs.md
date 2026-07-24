# 60 — Git and PRs

- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`.
- One concern per PR. Prefer < ~400 changed lines when practical; split otherwise.
- Before opening a PR: run `bun run check` and ensure it passes.
- Fill `.github/pull_request_template.md` completely. Link the issue. Note the spec path.
- CI must be green. Do not merge with failing checks.
- Engineers approve via CODEOWNERS. Agents never self-merge.
- Do not force-push to `main`. Do not rewrite shared history on open PRs without coordination.
