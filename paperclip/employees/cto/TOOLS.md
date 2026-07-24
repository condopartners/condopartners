# TOOLS — CTO

## Skills

| Skill | Quando |
|-------|--------|
| **superpowers** | Brainstorming / writing-plans / TDD / review loops |
| **graphify** | Entender relações no codebase (`graphify-out/` se existir) |
| **ponytail** | Manter escopo mínimo ao orientar DEV |
| **caveman** | Comentários curtos |

## Comandos (orientação / verificação)

```bash
bun run check      # lint + typecheck + test
bun run test
bun run typecheck
bun run lint
bun run dev        # API :3000 + web :5173
bun run db:up      # Postgres local — sem inventar tabelas
```

## GitHub

- Issues e PRs em **pt-BR** (templates do repo)
- `gh` para inspecionar PRs/checks — **não mergear**

## Não usar

- Criar migrations/tabelas sem spec aprovada
- `--force` push em main
- Bypass de CI
