# CondoPartners — Company (Paperclip)

## Mission

Construir e operar o **CondoPartners**: plataforma B2B multi-tenant para redes hierárquicas de partners, catálogo de produtos, registro de vendas e distribuição de comissões (começando por Clique Retire e eCondos).

UI do produto e issues/PRs operator-facing: **pt-BR**. Código, paths e manuais de agente técnicos: inglês.

## Goal operacional (agora)

Rodar a empresa Paperclip com processo impecável sobre o scaffolding existente:

1. Issue aprovada
2. Spec em `docs/specs/`
3. TDD + `bun run check`
4. PR → review humano (CODEOWNERS) → merge

Não inventar features de domínio sem issue + spec. Infra (Bun, Elysia, React, Postgres/Drizzle) já está no monorepo.

## Organograma

```
CEO                         → board (humano)
├── CTO
│   ├── DEV
│   └── QA
├── CMO
│   └── Marketing
├── Head of Design
└── COO
    ├── Summarizer
    └── Reflection Coach
```

## Board (humano)

- Aprova strategy / goals do CEO
- Aprova hire requests
- Mergeia PRs (CODEOWNERS) — agentes **não** mergeiam
- Pode pausar/terminar agentes e sobrescrever prioridades

## Regras de ouro (toda a company)

1. Sem feature sem issue aprovada + spec em `docs/specs/`
2. TDD para mudanças de comportamento
3. `bun run check` verde antes de PR
4. PRs pequenos; conventional commits
5. Sem secrets no repo
6. Dinheiro em **centavos integer** (nunca float)
7. Seguir `AGENTS.md` + `rules/` do monorepo

## Fonte da verdade no git

| Artefato | Onde |
|----------|------|
| Manual técnico dos agentes | `AGENTS.md` (raiz do repo) |
| Produto / glossário | `docs/PRODUCT.md` |
| Features alvo | `docs/FEATURES.md` |
| ADRs | `docs/DECISIONS.md` |
| Specs de feature | `docs/specs/` |
| Bundles Paperclip | `paperclip/employees/` |

## Spec desta company

`docs/superpowers/specs/2026-07-24-paperclip-org-design.md`
