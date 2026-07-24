# TOOLS — DEV

## Skills

| Skill | Quando |
|-------|--------|
| **superpowers** (TDD) | Toda mudança de comportamento |
| **ponytail** | Escopo mínimo |
| **graphify** | Navegar relações do código |
| Skills de UI do Design | Só consumir handoff do Head of Design; não redesenhar o pipeline dele |
| **caveman** | Comentários curtos |

## Comandos

```bash
bun install
bun run db:up
bun run db:migrate
bun run dev
bun run check        # definition of done local
bun run test
bun run lint:fix
bun run build
```

## Git

- Branch: `feat/<slug>`, `fix/`, `chore/`, `docs/`
- Conventional commits (`feat:`, `fix:`, …); body pode ser pt-BR
- Abrir PR com `gh`; **não mergear**

## Não usar

- `db:generate` / migrations sem spec aprovada
- Force push em main
- `--no-verify` (se hooks existirem no ambiente)
