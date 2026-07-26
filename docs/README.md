# Documentação de Design — condopartners

> Fundação de design da plataforma. **Comece por `PLATFORM_ARCHITECTURE.md`.**

## O que é a plataforma

Plataforma multiempresa para gestão de redes hierárquicas de parceiros que captam, vistoriam
e vendem contratos para condomínios. **O produto vendido é definido por empresa** — cada tenant
tem seu próprio catálogo, comissionamento, precificação e marca; o núcleo não assume nenhum
produto específico. A **Clique Retire** (lockers inteligentes) é o tenant fundador; a **eCondos**
(produto próprio) será o segundo.

## Índice

| Documento | Conteúdo |
|---|---|
| **`PLATFORM_ARCHITECTURE.md`** | **Fundação arquitetural** (multi-tenancy, núcleo vs. configurável). **Comece aqui.** |
| `PRD.md` | PRD V2 — a **configuração de referência da Clique** (1º tenant). |
| `DATA_MODEL.md` | Modelo de dados: regra global de multi-tenancy (§0) + schema de referência da Clique. |
| `FLOWS.md` | Diagramas de sequência dos fluxos críticos (referência Clique). |
| `SCREENS.md` | Mapa de telas por papel + matriz rota×permissão (referência Clique). |
| `DIAGRAMS.md` | Diagramas visuais para reunião. |
| `BRIEF.md` | Brief executivo (5 min). |
| `OPEN_QUESTIONS.md` | Questões de negócio em aberto, para debate. |
| `Comissões.xlsx` | Planilha original de comissões da Clique — base do exemplo numérico da cascata. |

## Status (2026-07-17)

- **Fase atual:** Fundação / design (ver `PLATFORM_ARCHITECTURE.md` §9).
- **Stack pretendida:** Next.js (App Router) + Supabase (Postgres, Auth, Storage, RLS),
  multi-tenant por `tenant_id` + RLS, num projeto Supabase dedicado.
- **Pendências que destravam o design:** fechar as questões de negócio em aberto (`PRD.md` §9 /
  `OPEN_QUESTIONS.md`) e o levantamento das regras da eCondos ("eCondos Discovery").
- **Origem:** repositório de design `clique-retire-partners` (histórico preservado lá; docs vivem
  aqui a partir de agora — ver `PLATFORM_ARCHITECTURE.md` §11).
