# Paperclip org — CondoPartners (Scaled team)

## Status

Aprovada (design colaborativo 2026-07-24)

## Resumo

Definir a empresa autônoma Paperclip do CondoPartners como **Scaled team**: CEO com braços de engenharia (CTO), crescimento (CMO), operações (COO) e design (Head of Design). Cada funcionário tem um bundle versionado no repo (`AGENTS.md`, `SOUL.md`, `HEARTBEAT.md`, `TOOLS.md`) para colar no Instructions tab do Paperclip.

Fonte de produto/processo do código continua sendo o `AGENTS.md` raiz + `docs/` + `rules/` + `skills/` — os bundles Paperclip **referenciam**, não duplicam.

## Issue

N/A (infra de agentes / operação Paperclip; sem feature de produto)

## Escopo

### Dentro

- Organograma Scaled (opção C + Head of Design enxuto)
- Pasta `paperclip/` com `COMPANY.md`, `README.md` e 10 employees
- Quatro arquivos por employee (convenção Paperclip)
- Fluxos de delegação, heartbeat e safety alinhados ao CondoPartners

### Fora

- Hire/config na UI do Paperclip (só documentar o passo a passo)
- Budgets em cents por agente
- Escolha de adapter (Claude/Cursor/etc.) além de “onde configurar”
- Implementar features de produto no monorepo
- Reescrever o `AGENTS.md` raiz do repo

## Organograma

```
CEO                         → board (humano / engenheiros)
├── CTO                     → entrega de engenharia
│   ├── DEV
│   └── QA
├── CMO                     → crescimento / GTM
│   └── Marketing
├── Head of Design          → UI/UX de produto (executa sozinho no início)
└── COO                     → operações do escritório Paperclip
    ├── Summarizer
    └── Reflection Coach
```

### Reports-to

| Employee | Reports to | Direct reports |
|----------|------------|----------------|
| CEO | Board | CTO, CMO, Head of Design, COO |
| CTO | CEO | DEV, QA |
| DEV | CTO | — |
| QA | CTO | — |
| CMO | CEO | Marketing |
| Marketing | CMO | — |
| Head of Design | CEO | — (Product Designer depois, se volume crescer) |
| COO | CEO | Summarizer, Reflection Coach |
| Summarizer | COO | — |
| Reflection Coach | COO | — |

## Responsabilidades

| Cargo | Faz | Não faz |
|-------|-----|---------|
| **CEO** | Estratégia, goals → tasks, delega a CTO/CMO/Design/COO, hire requests, reporta ao board | Código, QA, posts, pixels finais |
| **CTO** | Prioriza eng; garante issue + spec; delega DEV/QA; revisa se o fluxo foi seguido | Merge final (humano); marketing; inventar feature |
| **DEV** | Spec → TDD → `bun run check` → PR | Merge; feature sem issue+spec |
| **QA** | Aceite, regressão, evidência; bloqueia sem `check` verde | Implementar features |
| **CMO** | Estratégia GTM; briefs para Marketing | Código / schema |
| **Marketing** | Conteúdo e copy pt-BR de campanha | Telas do app; código |
| **Head of Design** | UX/UI de produto; handoff para DEV; pipeline Frontend Design → UI UX Pro Max → Impeccable → Web Design Guidelines → Astryx | Merge; inventar regra de negócio; campanhas de Marketing |
| **COO** | Ritmo operacional; handoffs; saúde da fila; aciona Summarizer/Coach | Decidir produto sozinho |
| **Summarizer** | Digests factuais para CEO/board | Executar delivery |
| **Reflection Coach** | Retros + recomendações de processo | Executar delivery |

## Estrutura de pastas

```
paperclip/
  README.md
  COMPANY.md
  employees/
    ceo/
    cto/
    dev/
    qa/
    cmo/
    marketing/
    head-of-design/
    coo/
    summarizer/
    reflection-coach/
```

Cada pasta em `employees/<role>/` contém:

- `AGENTS.md` — entry file (Paperclip carrega no heartbeat)
- `SOUL.md`
- `HEARTBEAT.md`
- `TOOLS.md`

### Idioma

- Prosa dos bundles: **pt-BR**
- Nomes de pasta/arquivo e referências a `rules/`, `skills/`, commits: **inglês**

### Ponte com o monorepo

Todo `AGENTS.md` referencia (caminhos relativos a partir de `paperclip/employees/<role>/`):

- `../../../AGENTS.md`
- `../../../docs/PRODUCT.md`
- `../../../docs/FEATURES.md`
- `../../../docs/DECISIONS.md`
- `../../../docs/specs/`
- `../../../rules/`
- `../../../skills/`

## Convenção dos quatro arquivos

Alinhado à [documentação Paperclip de Agents](https://docs.paperclip.ing/guides/org/agents/) e [Org Structure](https://docs.paperclip.ing/guides/org/org-structure/).

| Arquivo | Pergunta que responde | Conteúdo mínimo |
|---------|----------------------|-----------------|
| `AGENTS.md` | Qual é meu trabalho? | Cargo, reports, faz/não faz, delegação, escalonamento, safety, links para os outros três + docs do repo |
| `SOUL.md` | Como penso e falo? | Identidade em 1 frase, princípios, tom, anti-padrões |
| `HEARTBEAT.md` | O que faço agora, em ordem? | Checklist numerado mecânico |
| `TOOLS.md` | O que tem na caixa? | Skills Paperclip, comandos do monorepo (se aplicável), GitHub/`gh`, “não usar” |

Managers (CEO, CTO, CMO, COO, Head of Design como IC senior sem reports) enfatizam **delegar quando houver a quem** / **executar no próprio domínio**. ICs enfatizam **uma task checkoutada por vez**.

## Fluxo de delivery

```
Board aprova strategy/goals do CEO
  → CEO cria tasks de alto nível → CTO | CMO | Head of Design | COO
  → CTO: issue aprovada + spec → DEV (implementa) → QA (valida)
  → Head of Design: UI/UX → handoff na task/spec → DEV consome
  → CMO → Marketing (conteúdo/campanha)
  → COO mantém ritmo; Summarizer digests; Reflection Coach retros
  → DEV abre PR; humano (CODEOWNERS) mergeia
  → CEO reporta ao board
```

### Design no fluxo

1. Tasks de UI pedem input do Head of Design **antes** ou **em paralelo** ao DEV (não depois do PR “pronto”).
2. Notas de design entram na spec (`docs/specs/`) ou comentário da task Paperclip.
3. Marketing não redefine UI do produto; Head of Design não escreve posts de campanha.

## HEARTBEAT — padrão e focos

Checklist base (todos):

1. Ler identidade (`AGENTS` / `SOUL`)
2. Checar assignments / menções / aprovações
3. Checkout de **uma** task
4. Executar ou delegar (conforme o papel)
5. Comentar status / escalar blocker ao manager
6. Extrair fatos úteis → sair limpo

| Papel | Foco extra no heartbeat |
|-------|-------------------------|
| CEO | Goals → strategy; delegar; hire requests; report board |
| CTO | Priorizar eng; issue+spec; DEV/QA |
| DEV | TDD; `bun run check`; PR |
| QA | Aceite; evidência; bloqueio se vermelho |
| CMO | Briefs GTM; delegar Marketing |
| Marketing | Entregar copy/conteúdo pedido |
| Head of Design | Pipeline Frontend Design → UI UX Pro Max → Impeccable → Web Design Guidelines → Astryx; handoff claro para DEV |
| COO | Fila/handoffs; acionar Summarizer/Coach |
| Summarizer | Digest curto e factual |
| Reflection Coach | Retro + 2–5 recomendações acionáveis |

## Safety (todos os bundles)

- Sem secrets no repo; `.env` a partir de `.env.example`
- Sem feature sem issue aprovada + spec em `docs/specs/`
- Dinheiro sempre em **centavos integer** (nunca float)
- Agentes abrem PR; **humanos mergeiam**
- Escalation sobe a árvore (ex.: DEV → CTO → CEO → board)
- UI produto e issues/PRs operator-facing: **pt-BR**

## COMPANY.md (conteúdo alvo)

- Mission: plataforma B2B multi-tenant para redes hierárquicas de partners, catálogo, vendas e comissões (Clique Retire / eCondos primeiro)
- Goal operacional inicial: operar o scaffolding com qualidade de processo (specs, TDD, check, PRs) até a primeira feature aprovada
- Organograma C + Head of Design
- Board: aprova strategy e hires; merge via CODEOWNERS
- Link para `AGENTS.md` do monorepo

## README.md em `paperclip/` (conteúdo alvo)

1. Como criar a company no Paperclip
2. Ordem de hire (CEO → CTO/CMO/Design/COO → ICs)
3. Como colar cada bundle no Instructions tab
4. Lembrete: reports-to na Configuration tab deve espelhar este doc

## Critérios de aceite

- [ ] Existe `paperclip/COMPANY.md` e `paperclip/README.md`
- [ ] Existem 10 pastas sob `paperclip/employees/` com os 4 arquivos cada
- [ ] Organograma e reports-to batem com esta spec
- [ ] DEV/QA/CTO reforçam issue+spec, TDD, `bun run check`, merge humano
- [ ] Head of Design referencia o pipeline: Frontend Design → UI UX Pro Max → Impeccable → Web Design Guidelines → Astryx
- [ ] Nenhum bundle inventa tabelas/features de domínio

## Riscos

- Head of Design sem reports pode virar gargalo — mitigação: priorizar só telas da issue ativa; Product Designer depois
- Duplicação de regras vs `AGENTS.md` raiz — mitigação: referenciar, não copiar parágrafos longos
- COO sem trabalho claro — mitigação: heartbeat focado em fila, handoffs e ciclos Summarizer/Coach

## Plano de implementação (após aprovação desta spec)

1. Criar `paperclip/README.md` + `COMPANY.md`
2. Criar bundles na ordem: CEO → CTO → DEV → QA → CMO → Marketing → Head of Design → COO → Summarizer → Reflection Coach
3. Revisar links relativos e consistência reports-to
4. (Opcional) commit `docs:` + `chore:` quando o board pedir
