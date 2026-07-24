# Landing pública (`@condopartners/landing`)

Marketing waitlist page for CondoPartners. Isolated from `apps/web` (no Eden/API).

## Dev

```bash
bun run dev:landing
# http://localhost:5174
```

## Env

See `.env.example`:

| Var | Purpose |
|-----|---------|
| `VITE_BASE_PATH` | Vite `base` for GitHub Pages (e.g. `/condopartners/`) |
| `VITE_CONTACT_EMAIL` | Default `mailto:` target |
| `VITE_CONTACT_URL` | Optional URL instead of mailto |
| `VITE_WAITLIST_ENDPOINT` | Optional public POST endpoint; empty = local stub (option A) |

## Build

```bash
VITE_BASE_PATH=/condopartners/ bun run --filter '@condopartners/landing' build
```

## GitHub Pages

| Item | Value |
|------|--------|
| Workflow | [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) |
| Trigger | push to `main` (landing paths) + `workflow_dispatch` |
| Base path | `/condopartners/` (`VITE_BASE_PATH`) |
| URL | https://condopartners.github.io/condopartners/ |

Repo setting: **Settings → Pages → Source = GitHub Actions** (after the workflow exists on `main`).

## Design

See [`DESIGN.md`](./DESIGN.md) and `docs/specs/landing-page.md`.
