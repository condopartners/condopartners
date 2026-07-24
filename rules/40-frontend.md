# 40 — Frontend (React)

- React function components only. Prefer composition over inheritance.
- Styling: Tailwind CSS v4 utility classes. UI primitives via shadcn/ui under `apps/web/src/components/ui/`.
- Use the Eden Treaty client in `apps/web/src/lib/api.ts` for API calls. Do not invent ad-hoc `fetch` wrappers for typed routes.
- Keep presentational components dumb; put data loading and mutations near page/feature boundaries.
- Accessibility is required: semantic HTML, labels, focus states, keyboard support, meaningful `role`/`aria` when needed.
- Before building UI, consult **ui-ux-pro-max** (design system) and run a **taste-skill** pre-flight to avoid generic AI slop.
- Do not add routing libraries, state managers, or animation frameworks unless the approved spec requires them.
- Prefer calm, dense B2B UI over marketing flash for product screens.
- Default locale for all user-visible strings is **pt-BR** (labels, errors, empty states, emails). Do not ship English UI copy unless the spec explicitly requires bilingual support.
