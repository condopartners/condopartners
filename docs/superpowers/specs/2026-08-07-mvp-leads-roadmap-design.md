# MVP Leads / Indicação — Roadmap + plano de design

> **Status:** Aprovado em brainstorming (2026-08-07) · **Idioma:** pt-BR  
> **Prompt:** `docs/superpowers/prompts/2026-08-07-roadmap-mvp-leads-prompt.md`  
> **Backlog:** `docs/superpowers/plans/2026-08-07-mvp-leads-backlog.md`  
> **Abordagem de entrega:** #2 — multi-tenant primeiro, depois CRUDs, comissão no final do MVP

---

## 1. Resumo executivo

**O que é o MVP:** primeiro valor do CondoPartners como sistema de indicação multi-tenant: workspaces isolados, parceiros flat (UI), produtos com regras de comissão configuráveis, leads com CNPJ único por workspace + 1º indicador, validade de indicação, registro manual de venda/pagamento, comissão transparente (só 1º indicador) e um e-mail de domínio (“comissão liberada”).

**O que não é:** funil Clique completo (reserva/vistoria/anti-harding/UF/proposta), cascata ativa na UI, gateway, MCP/n8n, RBAC N1/N2/N3, central completa de notificações, engines distintos MRR/TCV/setup.

**Stack vigente:** Bun + Elysia + React/Vite + Drizzle/Postgres + Better Auth (já no repo). Docs antigos Next/Supabase são referência de domínio, não runtime.

**Modelo híbrido:** reunião = escopo MVP; `PRD.md` / `FEATURES.md` / `PLATFORM_ARCHITECTURE.md` = pós-MVP / visão; MCP + n8n = Plus.

---

## 2. Personas / quem acessa

| Persona | Papel MVP | Objetivo |
|---------|-----------|----------|
| **Operação** | Usuário interno do workspace | Cadastrar parceiros/produtos, ver todos os leads, registrar venda, marcar pagamento, override pós-expiração |
| **Parceiro Distribuidor** | Parceiro | Indicar leads (CNPJ), editar só os que indicou, acompanhar comissões |
| **Super-admin plataforma** | Já existe (fora do tenant) | Contas da plataforma — não substitui operação do workspace |

Papéis N1/N2/N3 do PRD Clique ficam para pós-MVP.

---

## 3. Escopo MVP

### Dentro
- Workspace (tenant) + membership + isolamento na API
- Papéis: `operacao` | `parceiro`
- CRUD Parceiro (UI flat; `parent_id` no schema, sem UI de equipe)
- CRUD Produto/Serviço: modalidade `unica` \| `recorrente`; regra **% e/ou absoluto** (centavos); rótulos livres; override opcional de validade
- Lead/indicação: CNPJ obrigatório, único/workspace, 1º indicador, temperatura, tempo do lead, validade
- Venda/assinatura + pagamento **manual**
- Comissão só ao **1º indicador**; pendente até marcar pago (recorrente por ciclo)
- E-mail domínio: **comissão liberada**
- Auditoria de ações sensíveis (override, pagamento, inativação)

### Fora
- Cascata na prática / toggle UI; tela de equipe; convites hierárquicos
- Validade exclusiva por parceiro + seletor de precedência avançado
- SMS/push/templates editáveis / central completa
- Reserva, vistoria, anti-harding, precificação UF, funil proposta→contrato Clique
- Gateway; MCP; n8n; ecossistema cross-company; white-label completo

---

## 4. Roadmap do sistema completo

| Fase | Nome | Conteúdo |
|------|------|----------|
| **0** | Fundação já entregue | Auth Better Auth, super-admin, PWA, landing, CD, Postgres/Drizzle |
| **1 = MVP** | Leads / indicação (este doc) | Multi-tenant → CRUDs → venda manual → comissão 1º indicador |
| **2** | Pós-MVP operação Clique | Reserva, vistoria, catálogo UF, proposta, cascata `chained_markup` |
| **3** | Comissão avançada | Cascata UI, progressivo/regressivo, validade por parceiro/precedência, engines MRR/TCV |
| **4** | eCondos onboarding | 2º tenant com estratégias próprias (prova a plataforma) |
| **5** | Plus | MCP CondoPartners, nó n8n, gateway, notificações multi-canal |
| **6** | Visão | Ecossistema cross-company (`FEATURES.md` #7), white-label avançado |

---

## 5. Plano do MVP (ordem de entrega — Abordagem 2)

Multi-tenant é a **fatia zero** (prioridade de negócio confirmada).

| Ordem | Entrega | Dependências | Riscos |
|-------|---------|--------------|--------|
| **MVP-0** | Workspace + membership + papéis + enforcement API | Auth existente | Desenho de contexto de sessão / 1:1 vs multi-membership |
| **MVP-1** | Parceiro (flat UI, `parent_id` schema) | MVP-0 | Confusão com super-admin |
| **MVP-2** | Produto + regras %/absoluto + validade override | MVP-0 | Escopo de regra “completa” demais — manter só % + absoluto + flag modalidade |
| **MVP-3** | Lead/indicação (CNPJ, validade, temperatura, tempo) | MVP-1, MVP-2 | Corrida no CNPJ; job/expiração |
| **MVP-4** | Venda/assinatura + pagamento manual | MVP-3 | Assinatura recorrente vs venda única — modelar ciclos manuais |
| **MVP-5** | Comissão + transparência + e-mail liberada | MVP-4 | Snapshot, centavos, parceiro inativo continua no deal |
| **MVP-6** | Hardening isolamento + auditoria + ADRs docs | MVP-0…5 | LGPD ainda pendente de política humana |

**Abordagem descartada para este ciclo:** #1 (comissão cedo) e #3 (só leads sem comissão). Comissão permanece **dentro do MVP**, após fundação multi-tenant e CRUDs.

---

## 6. Modelo mental de domínio

```
Workspace
  ├── Membership (user + role: operacao | parceiro)
  ├── Partner (parent_id opcional, UI flat)
  ├── Product (modality, percent_bps?, amount_cents?, validity_days_override?)
  ├── Lead / Indication (cnpj, indicator_partner_id, valid_until, temperature, conversation_started_at?)
  ├── Sale / Subscription (lead, product, manual)
  ├── Payment (manual mark paid → libera ciclo)
  └── Commission (snapshot, beneficiary = 1º indicador no MVP)
```

- Dinheiro: **centavos integer** (nunca float / evitar `numeric` de dinheiro sem conversão explícita).
- Uniques de negócio: **por workspace** (ex.: CNPJ).
- Sem inventar SQL de migration neste doc — cada fatia gera `docs/specs/<slug>.md`.

---

## 7. Regras de indicação

| Regra | Decisão |
|-------|---------|
| CNPJ | Obrigatório; único por workspace |
| 1º indicador | Quem cria o lead com CNPJ livre |
| Exclusividade | Enquanto `valid_until` no futuro |
| Validade MVP | Default **workspace** + override **produto** |
| Validade pós-MVP | Regra por parceiro + seletor de precedência (desenhado, não implementado) |
| Expiração sem venda | CNPJ **livre** para novo indicador |
| Nascimento da exclusividade | Na **criação** do lead |
| Venda | Confirma comissão se indicação válida (caminho normal) |
| Venda pós-expiração (padrão) | **Bloqueada** |
| Override | Só papel operação/admin do workspace, **motivo auditado**, pode creditar indicador original |

---

## 8. Comissionamento

### MVP
- Modalidade **por produto:** `unica` \| `recorrente`
- Fórmula: **% sobre valor informado** na venda/pagamento **e/ou valor absoluto** (centavos) por liberação
- Rótulos “MRR / TCV / setup” = texto de produto, **não** engines separados
- Quem recebe: **somente 1º indicador** (motor sem cascata)
- Cascata: config/schema **preparados**; UI e motor ativo **off** até árvore utilizável
- Atraso (recorrente): ciclo **pendente** até marcar pagamento → libera
- Parceiro inativo: **continua** recebendo em deals já atribuídos
- Transparência: parceiro vê o quê / por quê (snapshot)
- E-mail: comissão liberada

### Fases seguintes
- Toggle workspace + motor com cascata + UI de equipe
- Progressivo/regressivo, caps de tempo avançados
- Engines MRR/TCV/setup distintos
- Markup encadeado Clique (`chained_markup`)

---

## 9. Temperatura e tempo do lead

| Tema | Decisão |
|------|---------|
| Temperatura | `frio` \| `morno` \| `quente` |
| Edição | Manual; sugestão automática **só UI**, nunca sobrescreve manual |
| Parceiro | Edita só leads que indicou (incl. temperatura) |
| Operação | Edita todos |
| Tempo | Campo manual **início de conversa**; idade desde `created_at` separada; se início vazio → fallback `created_at` |

---

## 10. Notificações

| MVP | Pós-MVP |
|-----|---------|
| Reusar SMTP: **1** evento — comissão liberada (parceiro) | Central, templates editáveis, SMS, push, demais eventos |
| E-mails de auth já existentes | — |

---

## 11. Decisões em aberto (humanas — não inventar)

| # | Pergunta | Impacto | Premissa temporária | Quem decide |
|---|----------|---------|---------------------|-------------|
| D1 | Membership 1:1 user↔workspace no MVP ou multi-workspace? | Sessão / UX | Preferir **1 membership ativa** no MVP se simplificar | CTO / board |
| D2 | Quem é “admin” do override — qualquer `operacao` ou role extra? | AuthZ | Qualquer `operacao` | CEO / board |
| D3 | Job de expiração: cron in-process, pg, ou só check lazy na leitura/escrita? | Infra | Lazy + job simples depois | CTO |
| D4 | Política LGPD (retenção CPF/CNPJ, DSR) | Go-live | Minimizar PII; ADR pendente | board |
| D5 | Default de dias de validade (workspace) | Produto | `[definir]` ex. 30/60/90 | board / operação Clique |
| D6 | eCondos Discovery (regras reais) | Fase 4 plataforma | Não bloqueia MVP leads | board + eCondos |
| D7 | OPEN_QUESTIONS Clique restantes (contrato locker vs parceria, etc.) | Pós-MVP Clique | Fora do MVP leads | board |

### Premissas já fechadas neste brainstorming (referência)

Ver seções 7–10 e o histórico da sessão: modalidade C→D→A (UI completa depois simplificada para %/rótulos), %+absoluto, pendente até pagar, inativo continua, cascata configurável mas MVP só sem cascata, validade D com camadas MVP workspace+produto, expiração libera CNPJ, etc.

---

## 12. Mapeamento para docs existentes

| Doc | Relação com este MVP |
|-----|----------------------|
| Reunião / prompt 2026-08-07 | **Fonte do MVP** |
| `PRODUCT.md` / `FEATURES.md` | Visão; atualizar glossário (Lead, temperatura) em chore docs |
| `PRD.md` Clique | **Pós-MVP**; reaproveitar conceitos de snapshot, release após pagamento, auditoria |
| `PLATFORM_ARCHITECTURE.md` | Multi-tenant + estratégias: alinhado; fases §9 reordenadas pelo MVP leads |
| `DATA_MODEL.md` | Referência Clique; **não** copiar stack Supabase/RLS como obrigatória; uniques por tenant sim |
| `BRIEF.md` roadmap 12 sem / Next | **Histórico** — não vigente |
| `OPEN_QUESTIONS.md` | Parcialmente endereçado para MVP (modalidade/base simplificadas); resto pós-MVP |
| `DECISIONS.md` | Stack Bun vigente; novos ADRs: tenancy API-first, money cents, jobs |
| Specs auth/admin | Reutilizar; membership é camada **acima** do Better Auth user |
| `FEATURES.md` #7 ecossistema | Visão futura |

---

## 13. Critérios de sucesso do MVP

**Qualitativos**
- Dois workspaces sem vazamento de dados
- Fluxo indicação → venda manual → comissão visível para o parceiro
- CNPJ/1º indicador/validade/override admin comportam-se como nas seções 7–8
- `bun run check` verde em cada fatia mergeada

**Métricas propostas** (metas numéricas `[definir]`)
| KPI | Definição |
|-----|-----------|
| Isolamento | 0 incidentes cross-tenant em testes automatizados |
| Disputas de atribuição | Contagem de overrides admin / mês `[definir]` |
| Tempo lead → venda marcada | Mediana em dias `[definir]` |
| Erro de comissão | Divergência snapshot vs regra do produto = 0% em casos de teste |
| Parceiros ativos | ≥1 lead ou ação em 30 dias `[definir]` |

---

## 14. Requisitos não-funcionais (MVP)

- Isolamento tenant na API (RLS opcional depois)
- Dinheiro em centavos; cálculos em transação
- Sem PII em logs (`rules/70-security.md`)
- Auditoria append-only para override e pagamento
- Observabilidade além de `/health`: backlog pós-MVP (Sentry etc.) — não bloqueia fatias 0–5

---

## 15. Changelog deste design

- **2026-08-07:** criado após análise do repo + brainstorming (abordagem 2, premissas de comissão/indicação/parceiro/temperatura/notificações).
