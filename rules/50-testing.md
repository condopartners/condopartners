# 50 — Testing

- Use **red → green → refactor** TDD for behavior changes.
- Test runner: Bun's built-in `bun:test`.
- API: call `app.handle(new Request(...))` — see `apps/api/src/modules/health/health.test.ts`.
- Money, commission, and hierarchy logic must have thorough tests once those features exist (property/table-driven where useful).
- Do not delete or skip failing tests to make CI green. Fix the code or update the spec deliberately.
- Prefer small, focused tests over large end-to-end suites until the product surface grows.
- Web unit tests are optional in scaffolding; add them when a feature has non-trivial client logic.
