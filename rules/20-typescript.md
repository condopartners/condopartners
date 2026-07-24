# 20 — TypeScript

- `strict` TypeScript is required. Do not weaken `tsconfig` options.
- Ban `any`. Prefer `unknown` + narrowing. Avoid non-null assertions (`!`) unless proven safe.
- Prefer `type` / `interface` exports from `packages/shared` for cross-app contracts.
- Use `as const` and discriminated unions for finite states.
- **Money is integer cents** (or the smallest currency unit). Never use `number` floats for currency math.
- Prefer explicit return types on exported functions.
- Import types with `import type` when using `verbatimModuleSyntax`.
- Do not disable Biome or TypeScript errors with blanket ignores. Fix the root cause.
