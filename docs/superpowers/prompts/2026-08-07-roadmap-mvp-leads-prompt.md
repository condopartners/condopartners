# Prompt — Roadmap + plano + backlog (MVP leads / indicação)

> **Como usar:** cole este arquivo inteiro (ou aponte o agente para este path) em uma sessão Paperclip no monorepo `condopartners`.  
> **Papel sugerido:** CEO (estratégia + decomposição) **ou** CTO (roadmap técnico + backlog) — **não** implementar código nesta task.  
> **Idioma dos artefatos:** pt-BR (issues/PRs/docs de operador). Identificadores e paths em inglês.

---

## 1. Missão

Você está no monorepo **CondoPartners**. Sua tarefa é **estruturar o roadmap do sistema completo** e o **plano do primeiro MVP**, com base em:

1. **Decisões da reunião** (fonte de verdade do **MVP**) — seção 3 abaixo.
2. **Documentação existente no repo** (fonte de verdade do **pós-MVP / visão**) — seção 2.

**Modelo híbrido (obrigatório):**

| Camada | Fonte | Uso |
|--------|--------|-----|
| **MVP (primeiro valor)** | Reunião (seção 3) | Escopo a fatiar agora: issues, ordem, specs sugeridas |
| **Pós-MVP / sistema completo** | `docs/PRD.md`, `FEATURES.md`, `PLATFORM_ARCHITECTURE.md`, etc. | Roadmap longo prazo; marcar conflitos com o MVP |
| **Plus (integrações)** | MCP CondoPartners + nó n8n | **Fora do MVP** — só backlog pós-MVP |

**Entregáveis desta task (e só estes):**

1. Roadmap + plano de design  
2. Backlog de issues pronto para abrir no GitHub  
3. Lista explícita de decisões em aberto (não inventar respostas)

**Não faça nesta task:** implementar código, migrations, PRs de feature, alterar schema, inventar endpoints, ou “fechar” questões de negócio sem marcar como pendência humana.

---

## 2. Regras e contexto do repositório (ler antes de escrever)

### 2.1 Leitura obrigatória

Nesta ordem (ou equivalente completo):

1. `AGENTS.md`
2. `docs/PRODUCT.md`
3. `docs/FEATURES.md`
4. `docs/DECISIONS.md`
5. `docs/PLATFORM_ARCHITECTURE.md` (fases §9; pendências §12)
6. `docs/PRD.md` (MVP antigo Clique §4; bloqueadores §9)
7. `docs/OPEN_QUESTIONS.md`
8. `docs/BRIEF.md` (referência histórica — **não** tratar o roadmap de ~12 semanas / stack Next+Supabase como vigente)
9. `docs/specs/README.md`
10. Specs de auth/infra já existentes em `docs/specs/` (o que já está em andamento vs. o que ainda falta)

### 2.2 Guardrails CondoPartners

- Nenhuma feature de produto sem **issue aprovada** + **spec** em `docs/specs/<slug>.md`.
- TDD para mudanças de comportamento; `bun run check` verde antes de PR (quando houver implementação — **não nesta task**).
- UI e issues em **pt-BR**; dinheiro em **centavos inteiros** (nunca float).
- Multi-tenant: isolamento por tenant/workspace; **sem** leitura cruzada entre empresas no MVP.
- Stack **vigente** do repo: Bun + Elysia + React/Vite + Drizzle/Postgres — **não** planejar Next.js + Supabase do BRIEF antigo.
- Auth/tenancy/RBAC/domínio: só o que a reunião + specs existentes justificarem para o MVP; o resto vai para pós-MVP com rastreio aos docs.

### 2.3 Papel nesta task

- **CEO:** traduz reunião + docs em fases estratégicas, prioridades, e handoffs (CTO / Design / COO).
- **CTO:** detalha ordem técnica, dependências, tamanho de issues, riscos de schema/API, e o que precisa de spec antes de DEV.
- Se atuar como um só agente: faça as duas lentes, mas **separe** no texto “decisão de produto” vs “decisão técnica”.

---

## 3. Decisões da reunião — fonte do MVP

> Texto normalizado da reunião. Em conflito com o PRD antigo, **vence a reunião para o MVP**; o PRD vira pós-MVP (seção 4).

### 3.1 Objetivos do MVP

- Parceiros **cadastram leads**.
- **Primeiro a indicar** recebe o comissionamento, identificado via **CNPJ da empresa**.
  - CNPJ **obrigatório**.
  - CNPJ **único dentro do workspace** (multi-tenant).
- **Distribuir comissionamento** para parceiros de forma **transparente**.
- **Inserção manual de dados** no início (sem integração de pagamento automática no MVP).
- **Regras de comissionamento** configuráveis, incluindo (desenhar como capacidade; fatiar se necessário):
  - porcentagem;
  - valor absoluto;
  - cálculos e/ou **progressivo/regressivo**;
  - **ilimitado** ou com **regras de tempo**;
  - escopo **por produto/serviço**.
- Indicar **tempo do lead** / início de conversa.
- Terminologia de temperatura: **lead frio / morno / quente**.

### 3.2 Central de notificações (incluir no roadmap; avaliar fatia MVP vs pós)

- Canais: e-mail, push, SMS, etc.
- Com **templates**.
- Se o MVP ficar grande demais, **adiar canais além de e-mail** (ou toda a central) para pós-MVP — **justificar** a escolha no roadmap e listar como trade-off explícito.

### 3.3 CRUDs necessários (domínio)

- Usuários
- Parceiro Distribuidor
- Clientes / Leads
- Produtos / Serviços (tipos: venda única; recorrente ilimitada; recorrente com limite de data; regras ligadas a parceiro — detalhar no plano)
- Assinaturas

### 3.4 Quem acessa

- **Usuários** (lado interno / operação do tenant)
- **Parceiros** (indicação e acompanhamento)

> Papéis finos (N1/N2/N3 do PRD Clique) **não** são requisito do MVP da reunião — se sugerir RBAC mais rico, colocar como pós-MVP ou “fase 0 mínima de auth” alinhada às specs já existentes.

### 3.5 Fluxo de pagamento (negócio)

- Cliente paga → **Nós** **ou** **Parceiro Distribuidor**.
- No MVP: registro **manual** no CondoPartners; sem gateway obrigatório.

### 3.6 Cenário-chave (happy path)

1. Indicação feita (com **regra de validade**).
2. Até fechar a venda, a equipe faz **registro manual** no CondoPartners.
3. Remuneração **recorrente ou não**, conforme produto/tipo de serviço e regras configuradas.
4. Transparência: parceiro consegue ver o que tem a receber / por quê.

### 3.7 Plus — explicitamente fora do MVP

- **MCP CondoPartners**
- **Nó n8n**

Colocar somente em fase **pós-MVP / integrações**, com issues etiquetadas como Plus.

---

## 4. Conflitos MVP (reunião) × docs antigos

Ao montar o roadmap, use (e complete) uma tabela neste espírito:

| Tema | MVP (reunião) | Pós-MVP (docs) | Ação no backlog |
|------|---------------|----------------|-----------------|
| Lead + CNPJ único/workspace + 1º indicador | Sim | Parcialmente alinhado a “atribuição” em FEATURES | Issues MVP |
| Inserção manual de venda/pagamento | Sim | PRD já previa pagamento marcado manualmente (sem gateway) | Issues MVP |
| Regras de comissão flexíveis (%, absoluto, progressivo, tempo, por produto) | Sim (capacidade) | PRD foca markup encadeado Clique | MVP: começar enxuto + evoluir; pós-MVP: estratégias plugáveis / Clique |
| Temperatura do lead + tempo do lead | Sim | Não enfatizado no PRD | Issues MVP |
| Reserva de condomínio / vistoria / anti-harding / UF | Não | PRD módulos B/C | Só pós-MVP |
| Funil completo proposta→contrato→assinatura Clique | Não (salvo o mínimo para registrar venda/assinatura manual) | PRD §4.1 | Pós-MVP; extrair só o necessário ao “registro manual” |
| Mensalidades 2+ / gateway / push avançado | Não (exceto se e-mail templates forem MVP) | PRD out-of-MVP / FEATURES | Pós-MVP / Plus |
| Ecossistema cross-company | Não | FEATURES #7 | Visão futura |
| MCP + n8n | Não | — | Plus pós-MVP |
| `OPEN_QUESTIONS.md` (modalidade comissão, base da venda, etc.) | Pode afetar desenho de Assinaturas/Comissão | Bloqueadores PRD §9 | Listar como **decisões humanas**; não inventar |

**Regra:** se algo do PRD for útil ao MVP da reunião, **reaproveite o conceito** e diga isso; se for só Clique-ops, **não** puxe para o MVP.

---

## 5. Processo (siga nesta ordem)

1. **Ler** os docs da seção 2.
2. **Sintetizar** em duas colunas: MVP (reunião) vs pós-MVP (docs) vs Plus.
3. **Listar decisões em aberto** (produto + técnico) sem fechar sozinho — formato: pergunta, impacto, premissa temporária (se houver), quem decide (board/CEO/CTO).
4. **Propor fases** do sistema completo (arco longo) e **marcar qual fatia é o MVP**.
5. **Quebrar o MVP** em issues pequenas, ordenadas por dependência (auth/tenant → usuários/parceiros → produtos → leads/indicação → registro manual de venda/assinatura → comissão transparente → notificações se couber).
6. **Escrever os artefatos** nos paths da seção 6.
7. **Parar** e pedir review humano. Não implementar.

Use skills de processo se disponíveis na sessão: `brainstorming` (se ainda houver ambiguidade de desenho), depois `writing-plans` para o plano detalhado — sem pular para código.

---

## 6. Artefatos de saída (obrigatório)

Crie/atualize estes arquivos:

### 6.1 Roadmap + plano de design

`docs/superpowers/specs/2026-08-07-mvp-leads-roadmap-design.md`

Deve conter no mínimo:

1. **Resumo executivo** (o que é o MVP e o que não é)
2. **Personas / quem acessa** (Usuário vs Parceiro)
3. **Escopo MVP** (in / out)
4. **Roadmap do sistema completo** (fases numeradas: fundação → MVP leads → pós-MVP PRD → Plus)
5. **Plano do MVP** (ordem de entrega, dependências, riscos)
6. **Modelo mental de domínio** (entidades: Workspace/Tenant, Usuário, Parceiro Distribuidor, Lead/Cliente, Produto/Serviço, Assinatura, Indicação, Comissão, Notificação) — conceitual, **sem** inventar migration SQL
7. **Regras de indicação** (validade, CNPJ único/workspace, primeiro indicador)
8. **Comissionamento** (o que entra no MVP vs fases seguintes; transparência)
9. **Decisões em aberto**
10. **Mapeamento para docs existentes** (o que reaproveita / o que supersede para o MVP)
11. **Critérios de sucesso do MVP** (qualitativos e, se possível, métricas propostas marcadas como `[definir]`)

### 6.2 Backlog de issues

`docs/superpowers/plans/2026-08-07-mvp-leads-backlog.md`

- Lista ordenada de issues **prontas para colar no GitHub** (corpo em pt-BR).
- Separar seções: **MVP**, **Pós-MVP**, **Plus**.
- Cada issue no template da seção 7.
- Sugerir `docs/specs/<slug>.md` por issue (mesmo que a spec ainda não exista).
- Issues devem ser **pequenas** (uma preocupação); preferir fatias verticais testáveis.

### 6.3 (Opcional) Comentário curto de handoff

No final da resposta ao humano: 5–10 linhas com “próximo passo” (ex.: board aprova roadmap → abrir issues MVP 1..N → specs → DEV).

---

## 7. Template obrigatório por issue

```md
### SIS-XXX — <título curto em pt-BR>

- **Labels sugeridas:** `mvp` | `pos-mvp` | `plus` + área (`auth`, `dominio`, `comissoes`, `notificacoes`, `integracoes`, …)
- **Tipo:** feat | docs | chore
- **Depende de:** (issues ou “nenhuma”)
- **Spec sugerida:** `docs/specs/<slug>.md`
- **Dono sugerido:** CTO → DEV | Design | board (decisão)

**Resumo**
<2–4 frases>

**Escopo**
- Dentro:
- Fora:

**Critérios de aceite**
- [ ] …
- [ ] …

**Notas / riscos**
- …
```

Substitua `SIS-XXX` por IDs placeholder sequenciais (`MVP-01`, `MVP-02`, … / `POST-01`, … / `PLUS-01`, …) se não houver numeração real ainda.

---

## 8. Critérios de qualidade (definition of done desta task)

- [ ] MVP cabe em fatias implementáveis; não é o PRD Clique inteiro.
- [ ] CNPJ único/workspace + primeiro indicador + indicação com validade estão cobertos no MVP.
- [ ] Inserção manual está explícita; gateway/MCP/n8n **não** estão no MVP.
- [ ] Regras de comissão ambiciosas estão **faseadas** (MVP honesto vs evolução).
- [ ] Temperatura (frio/morno/quente) e tempo do lead estão no plano MVP ou justificados fora.
- [ ] Conflitos com PRD/FEATURES/OPEN_QUESTIONS estão tabelados.
- [ ] Toda issue tem aceite testável e spec sugerida.
- [ ] Nenhuma migration/API inventada como “já decidida”.
- [ ] Stack e processo batem com `AGENTS.md` / `DECISIONS.md`.
- [ ] Artefatos gravados nos paths da seção 6.

---

## 9. Anti-padrões (não fazer)

- Copiar o roadmap de ~12 semanas do `BRIEF.md` como plano vigente.
- Trazer reserva/vistoria/anti-harding para o MVP “porque estava no PRD”.
- Colocar MCP/n8n no caminho crítico do MVP.
- Esconder bloqueadores de `OPEN_QUESTIONS.md`.
- Issues gigantes (“fazer comissões completas”).
- Implementar código ou abrir PR de feature nesta task.
- Assumir comissão recorrente **ou** única sem listar a decisão em aberto.

---

## 10. Mensagem inicial sugerida (para colar no agente)

```text
Siga integralmente docs/superpowers/prompts/2026-08-07-roadmap-mvp-leads-prompt.md

Papel: CTO (com visão de CEO na priorização).
Modelo: híbrido — reunião = MVP; docs antigos = pós-MVP; MCP+n8n = Plus fora do MVP.
Entregáveis: gravar os dois arquivos da seção 6; não implementar código.
Ao terminar: resumo curto + lista do que precisa de aprovação do board.
```

---

## Changelog do prompt

- **2026-08-07:** criado a partir da reunião (leads/CNPJ/comissão manual/CRUD/notificações) + decisões de framing (híbrido C, agente no repo, backlog tipo C, Plus fora do MVP).
