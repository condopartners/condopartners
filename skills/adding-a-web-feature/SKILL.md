---
name: adding-a-web-feature
description: Add a React UI feature wired through Eden Treaty, Tailwind, and shadcn. Use for any frontend product UI work.
---

# Adding a web feature

## Preconditions

- Approved issue + spec in `docs/specs/`.
- API contract exists (or is added in the same PR) and is typed via `export type App`.

## Steps

1. **Design**
   - Load **ui-ux-pro-max** and generate/consult the design system for this product surface.
   - Run **taste-skill** pre-flight: avoid generic AI landing-page patterns for B2B screens.

2. **Client**
   - Call the API through [`apps/web/src/lib/api.ts`](../../apps/web/src/lib/api.ts) (Eden Treaty).
   - Reuse shared types from `@condopartners/shared`.

3. **UI**
   - Prefer shadcn primitives under `apps/web/src/components/ui/`.
   - Compose feature components under `apps/web/src/components/` or a feature folder.
   - Follow `rules/40-frontend.md` (a11y, Tailwind, calm B2B UI).

4. **Verify**
   - Typecheck and lint (`bun run check`).
   - Smoke-test with `bun run dev` (API + web).

## Do not

- Bypass Eden with untyped `fetch` for existing routes.
- Install heavy UI kits without a spec-driven reason.
- Ship motion-heavy decorative loops on operational screens.
