# Backlog — MVP Leads / Indicação

> **Design:** `docs/superpowers/specs/2026-08-07-mvp-leads-roadmap-design.md`  
> **Uso:** issues prontas para colar no GitHub (corpo pt-BR).  
> **Ordem MVP:** respeitar dependências (Abordagem 2 — multi-tenant primeiro).

---

## MVP

### MVP-01 — Workspace (tenant) + membership + isolamento na API

- **Labels sugeridas:** `mvp` `auth` `dominio`
- **Tipo:** feat
- **Depende de:** nenhuma (auth Better Auth já existe)
- **Spec sugerida:** `docs/specs/workspace-tenancy.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Introduzir workspace (tenant) e membership com papéis `operacao` e `parceiro`. Toda query de domínio futura deve ser escopada ao workspace do contexto. Super-admin de plataforma permanece fora do tenant.

**Escopo**
- Dentro: criar workspace; vincular usuário; papel na membership; middleware/contexto de workspace; testes de isolamento (acesso cross-tenant → 403/404); ADR short em DECISIONS ou na spec (API-first isolation).
- Fora: white-label; RLS Postgres; multi-membership UX sofisticada (decidir 1:1 se simplificar — ver D1 no design); cascata.

**Critérios de aceite**
- [ ] Usuário autenticado só acessa dados do workspace em que é membro
- [ ] Papéis `operacao` e `parceiro` distinguíveis na sessão/contexto
- [ ] Tentativa de acessar recurso de outro workspace falha de forma segura
- [ ] Spec aprovada + testes automatizados de isolamento + `bun run check`

**Notas / riscos**
- Não confundir com Better Auth admin plugin (plataforma).
- Dinheiro/centavos N/A nesta fatia.

---

### MVP-02 — CRUD Parceiro Distribuidor (UI flat)

- **Labels sugeridas:** `mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-01
- **Spec sugerida:** `docs/specs/partner-distributor.md`
- **Dono sugerido:** CTO → DEV (+ Design handoff UI)

**Resumo**
Cadastro de parceiros no workspace: ativo/inativo, dados básicos. Schema inclui `parent_id` opcional sem UI de árvore/equipe. Operação gerencia; parceiro não cria outros parceiros no MVP.

**Escopo**
- Dentro: CRUD operação; listagem; inativar; `parent_id` no schema (não exposto na UI); testes tenant-scoped.
- Fora: convite hierárquico; tela “minha equipe”; cascata; % no convite (PRD Clique).

**Critérios de aceite**
- [ ] Operação cria/edita/inativa parceiro no seu workspace
- [ ] Parceiro de outro workspace invisível
- [ ] UI sem hierarquia; campo parent não exigido no fluxo
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Parceiro inativo: sem login operacional; elegibilidade a comissão futura tratada em MVP-05.

---

### MVP-03 — CRUD Produto / Serviço + regra de comissão

- **Labels sugeridas:** `mvp` `dominio` `comissoes`
- **Tipo:** feat
- **Depende de:** MVP-01
- **Spec sugerida:** `docs/specs/product-commission-rules.md`
- **Dono sugerido:** CTO → DEV (+ Design)

**Resumo**
Catálogo do workspace: modalidade `unica` | `recorrente`; regra `%` e/ou valor absoluto em centavos; rótulos livres; override opcional de dias de validade da indicação.

**Escopo**
- Dentro: CRUD produto; validação de regra (% e/ou absoluto ≥ constraints); override validade; testes.
- Fora: engines MRR/TCV/setup; progressivo/regressivo; cascata; precificação UF.

**Critérios de aceite**
- [ ] Produto salva modalidade + % e/ou amount_cents
- [ ] Override de validade opcional; sem override usa default do workspace (config mínima)
- [ ] Valores monetários só em centavos inteiros
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Default de dias do workspace pode nascer em MVP-01 ou aqui (config mínima).

---

### MVP-04 — Config mínima de validade de indicação (workspace)

- **Labels sugeridas:** `mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-01
- **Spec sugerida:** `docs/specs/indication-validity-settings.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Permitir definir o default de dias de validade da indicação por workspace (produto pode override — MVP-03).

**Escopo**
- Dentro: setting `indication_validity_days`; leitura na criação de lead.
- Fora: regra por parceiro; seletor de precedência; validade por tipo com motor complexo.

**Critérios de aceite**
- [ ] Operação altera default do workspace
- [ ] Valor usado quando produto não tem override
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Meta numérica default `[definir]` com board (D5).

---

### MVP-05 — Lead / indicação (CNPJ, temperatura, tempo)

- **Labels sugeridas:** `mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-02, MVP-03, MVP-04
- **Spec sugerida:** `docs/specs/leads-indication.md`
- **Dono sugerido:** CTO → DEV (+ Design)

**Resumo**
Parceiro/operação cadastram leads com CNPJ único por workspace; 1º indicador; validade; temperatura frio/morno/quente; início de conversa manual com fallback `created_at`; sugestão automática de temperatura só na UI.

**Escopo**
- Dentro: criar/editar/listar; unicidade CNPJ; bloqueio 2º indicador enquanto válido; permissões (parceiro só os próprios); temperatura; conversation_started_at; testes de corrida.
- Fora: venda; comissão; central de notificações; expiração job avançado (pode ser lazy nesta fatia).

**Critérios de aceite**
- [ ] CNPJ obrigatório e único por workspace
- [ ] Segundo indicador rejeitado enquanto indicação válida
- [ ] Parceiro edita só leads que indicou; operação edita todos
- [ ] Sugestão de temperatura não sobrescreve valor manual
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Normalização de CNPJ (somente dígitos) na spec.

---

### MVP-06 — Expiração de indicação + liberação de CNPJ

- **Labels sugeridas:** `mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-05
- **Spec sugerida:** `docs/specs/indication-expiry.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Quando `valid_until` passa sem venda, CNPJ fica livre para novo 1º indicador. Estratégia lazy e/ou job (D3).

**Escopo**
- Dentro: transição para expirado; permitir nova indicação; testes de tempo.
- Fora: override de venda (MVP-08); e-mail de expiração.

**Critérios de aceite**
- [ ] Após expirar, outro parceiro consegue indicar o mesmo CNPJ
- [ ] Indicador anterior perde exclusividade no caminho padrão
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Decidir lazy vs cron na spec (D3).

---

### MVP-07 — Venda / assinatura + pagamento manual

- **Labels sugeridas:** `mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-05, MVP-06
- **Spec sugerida:** `docs/specs/manual-sale-payment.md`
- **Dono sugerido:** CTO → DEV (+ Design)

**Resumo**
Registro manual de venda/assinatura ligada a lead + produto; marcar pagamento (única ou ciclos recorrentes). Sem gateway. Venda com indicação expirada bloqueada no caminho padrão.

**Escopo**
- Dentro: criar venda; informar valores; marcar pago; ciclos recorrentes manuais; bloqueio pós-expiração.
- Fora: gateway; override admin (MVP-08); cálculo de comissão (MVP-09).

**Critérios de aceite**
- [ ] Operação registra venda com indicação válida
- [ ] Parceiro/operação comum não registram venda se indicação expirada
- [ ] Produto recorrente permite múltiplos pagamentos/ciclos manuais
- [ ] Centavos inteiros
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Modelar “ciclo” de forma mínima (evitar over-engineering de billing).

---

### MVP-08 — Override admin de venda pós-expiração

- **Labels sugeridas:** `mvp` `dominio` `auth`
- **Tipo:** feat
- **Depende de:** MVP-07
- **Spec sugerida:** `docs/specs/sale-expiry-override.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Papel operação pode registrar venda após expiração com motivo obrigatório, creditando o indicador original; trilha de auditoria.

**Escopo**
- Dentro: endpoint/ação de override; motivo; audit event; testes.
- Fora: UI de auditoria completa para todos os eventos (mínimo: persistir e consultar se trivial).

**Critérios de aceite**
- [ ] Override exige motivo e ator operação
- [ ] Crédito permanece no indicador original
- [ ] Evento de auditoria gravado (sem PII desnecessária)
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Confirmar se qualquer `operacao` ou subset (D2).

---

### MVP-09 — Comissão (1º indicador) + transparência

- **Labels sugeridas:** `mvp` `comissoes`
- **Tipo:** feat
- **Depende de:** MVP-07, MVP-03
- **Spec sugerida:** `docs/specs/commission-first-indicator.md`
- **Dono sugerido:** CTO → DEV (+ Design carteira)

**Resumo**
Ao marcar pagamento, calcular comissão do 1º indicador (% e/ou absoluto do produto sobre valor informado); snapshot imutável; estados pendente→liberado; parceiro inativo continua elegível no deal; UI de transparência.

**Escopo**
- Dentro: motor sem cascata; snapshot; listagem parceiro; testes de propriedade da conta.
- Fora: cascata; e-mail (MVP-10); progressivo.

**Critérios de aceite**
- [ ] Pagamento marcado gera/libera comissão correta (única e recorrente por ciclo)
- [ ] Ciclo recorrente fica pendente até marcar pago
- [ ] Parceiro vê valor e motivo (produto/regra/venda)
- [ ] Centavos; transação atômica
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Schema pode reservar campos para cascata futura sem ativar.

---

### MVP-10 — E-mail “comissão liberada”

- **Labels sugeridas:** `mvp` `notificacoes`
- **Tipo:** feat
- **Depende de:** MVP-09
- **Spec sugerida:** `docs/specs/email-commission-released.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Reutilizar mailer/SMTP existente para notificar o parceiro quando a comissão for liberada. Único e-mail de domínio do MVP.

**Escopo**
- Dentro: template fixo pt-BR; disparo no liberar; teste com mailer fake.
- Fora: templates editáveis; SMS/push; outros eventos.

**Critérios de aceite**
- [ ] Parceiro recebe e-mail ao liberar comissão
- [ ] Falha de SMTP não corrompe o snapshot (definir: retry/log)
- [ ] Spec + TDD + `bun run check`

**Notas / riscos**
- Não logar e-mail em cleartext além do necessário.

---

### MVP-11 — Hardening multi-tenant + ADRs de docs

- **Labels sugeridas:** `mvp` `chore` `docs`
- **Tipo:** chore
- **Depende de:** MVP-01 … MVP-10 (pode começar docs em paralelo após MVP-01)
- **Spec sugerida:** `docs/specs/mvp-leads-hardening.md`
- **Dono sugerido:** CTO → QA + DEV

**Resumo**
Bateria de testes de isolamento; atualizar `docs/README.md` / nota de stack supersedida; ADRs tenancy + money cents + jobs; checklist LGPD pendente explícito.

**Escopo**
- Dentro: testes; docs; ADR-lite em `DECISIONS.md`.
- Fora: implementar política LGPD completa; Sentry.

**Critérios de aceite**
- [ ] Suite de isolamento documentada e verde
- [ ] ADRs registrados
- [ ] `bun run check` verde
- [ ] Lista D4 LGPD visível como aberto

**Notas / riscos**
- Não fingir compliance LGPD fechada.

---

## Pós-MVP

### POST-01 — UI de hierarquia de parceiros + convites

- **Labels sugeridas:** `pos-mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-02
- **Spec sugerida:** `docs/specs/partner-hierarchy-ui.md`
- **Dono sugerido:** Design → CTO → DEV

**Resumo**
Expor `parent_id`, convites e tela de equipe.

**Escopo**
- Dentro: árvore; convite; permissões de sub-rede.
- Fora: cascata (POST-02).

**Critérios de aceite**
- [ ] Parceiro convida subnível com parent correto
- [ ] UI de equipe visível quando há descendentes

**Notas / riscos**
- Alinhar a PRD Clique módulo A sem copiar N1/N2/N3 ainda.

---

### POST-02 — Toggle workspace + motor de cascata

- **Labels sugeridas:** `pos-mvp` `comissoes`
- **Tipo:** feat
- **Depende de:** POST-01, MVP-09
- **Spec sugerida:** `docs/specs/commission-cascade-toggle.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Ativar segundo motor de comissão (ancestrais) configurável por workspace; default permanece sem cascata.

**Escopo**
- Dentro: toggle; cálculo com árvore; testes vs planilha Clique quando estratégia chained_markup.
- Fora: markup encadeado completo Clique pode ser POST-03.

**Critérios de aceite**
- [ ] Workspace sem cascata comporta-se como MVP
- [ ] Workspace com cascata distribui conforme estratégia escolhida
- [ ] Snapshot audita níveis

**Notas / riscos**
- Fechar OPEN_QUESTIONS relevantes antes de chained_markup.

---

### POST-03 — Estratégia chained_markup (Clique)

- **Labels sugeridas:** `pos-mvp` `comissoes`
- **Tipo:** feat
- **Depende de:** POST-02, decisões OPEN_QUESTIONS
- **Spec sugerida:** `docs/specs/commission-chained-markup.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Implementar markup encadeado como `CommissionStrategy` plugável (PRD/DATA_MODEL).

**Escopo**
- Dentro: estratégia; house take; testes com `Comissões.xlsx`.
- Fora: gateway.

**Critérios de aceite**
- [ ] Soma da cascata = margem
- [ ] Ancestral inativo → house conforme PRD

**Notas / riscos**
- Bloqueadores §9 do PRD.

---

### POST-04 — Validade por parceiro + precedência configurável

- **Labels sugeridas:** `pos-mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP-04, MVP-05
- **Spec sugerida:** `docs/specs/indication-validity-precedence.md`
- **Dono sugerido:** board (regra) → CTO → DEV

**Resumo**
Regra exclusiva por parceiro e seletor de qual regra manda (produto vs parceiro vs workspace).

**Escopo**
- Dentro: modelo de precedência; UI; testes de conflito.
- Fora: mudar default MVP.

**Critérios de aceite**
- [ ] Conflito resolvido de forma determinística e documentada
- [ ] Auditoria do prazo aplicado na criação do lead

**Notas / riscos**
- Decisão de produto sensível a disputa de canal.

---

### POST-05 — Funil Clique: reserva / vistoria / proposta

- **Labels sugeridas:** `pos-mvp` `dominio`
- **Tipo:** feat
- **Depende de:** MVP estável; OPEN_QUESTIONS
- **Spec sugerida:** `docs/specs/clique-ops-funnel.md` (fatiar depois)
- **Dono sugerido:** CEO → CTO + Design

**Resumo**
Módulos B/C do PRD Clique como pós-MVP.

**Escopo**
- Dentro: conforme PRD fatiado.
- Fora: MVP leads.

**Critérios de aceite**
- [ ] Specs fatiadas aprovadas antes de código
- [ ] Não quebrar isolamento tenant

**Notas / riscos**
- Escopo grande — quebrar em várias issues reais.

---

### POST-06 — Central de notificações (e-mail templates + canais)

- **Labels sugeridas:** `pos-mvp` `notificacoes`
- **Tipo:** feat
- **Depende de:** MVP-10
- **Spec sugerida:** `docs/specs/notification-center.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Templates por workspace; eventos além de comissão liberada; preparar push/SMS.

**Escopo**
- Dentro: e-mail templates; preferências básicas.
- Fora: MCP.

**Critérios de aceite**
- [ ] Operação edita template de pelo menos 1 evento
- [ ] Parceiro recebe conforme preferência

**Notas / riscos**
- Idempotência de envio.

---

### POST-07 — eCondos Discovery + onboarding 2º tenant

- **Labels sugeridas:** `pos-mvp` `docs` `dominio`
- **Tipo:** docs / feat
- **Depende de:** questionário discovery; MVP-01
- **Spec sugerida:** `docs/specs/econdos-discovery.md` + specs de estratégias
- **Dono sugerido:** board → CEO → CTO

**Resumo**
Levantar regras eCondos e plugar como 2º tenant (Fase 4 da arquitetura).

**Escopo**
- Dentro: discovery doc; gaps vs MVP; estratégias necessárias.
- Fora: assumir regras Clique.

**Critérios de aceite**
- [ ] Discovery respondido
- [ ] Plano de onboarding sem quebrar núcleo

**Notas / riscos**
- Pendência histórica PLATFORM_ARCHITECTURE §12.

---

## Plus

### PLUS-01 — MCP CondoPartners

- **Labels sugeridas:** `plus` `integracoes`
- **Tipo:** feat
- **Depende de:** MVP estável (mínimo leads + comissão)
- **Spec sugerida:** `docs/specs/mcp-condopartners.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Expor ferramentas MCP para automação externa (consulta leads/comissões conforme auth).

**Escopo**
- Dentro: surface mínima read/write controlada.
- Fora: caminho crítico do MVP.

**Critérios de aceite**
- [ ] Authz tenant-aware
- [ ] Spec de tools + testes

**Notas / riscos**
- Superfície de ataque — least privilege.

---

### PLUS-02 — Nó n8n

- **Labels sugeridas:** `plus` `integracoes`
- **Tipo:** feat
- **Depende de:** API estável; preferencialmente PLUS-01 ou webhooks
- **Spec sugerida:** `docs/specs/n8n-node-condopartners.md`
- **Dono sugerido:** CTO → DEV

**Resumo**
Nó n8n para fluxos de automação (ex.: avisar comissão, sync CRM).

**Escopo**
- Dentro: autenticação; operações documentadas.
- Fora: MVP.

**Critérios de aceite**
- [ ] Fluxo exemplo documentado
- [ ] Credenciais fora do repo

**Notas / riscos**
- Versionamento do nó vs API.

---

### PLUS-03 — Gateway de pagamento

- **Labels sugeridas:** `plus` `integracoes` `comissoes`
- **Tipo:** feat
- **Depende de:** MVP-07/09; decisões financeiras board
- **Spec sugerida:** `docs/specs/payment-gateway.md`
- **Dono sugerido:** board → CTO

**Resumo**
Substituir/complementar marcação manual com webhook de pagamento real.

**Escopo**
- Dentro: provedor escolhido; idempotência; liberação automática.
- Fora: inventar provedor sem decisão.

**Critérios de aceite**
- [ ] Pagamento confirmado libera comissão sem marcação manual obrigatória
- [ ] Replay de webhook seguro

**Notas / riscos**
- PCI / responsabilidade — board.

---

## Ordem sugerida para abrir no GitHub

1. MVP-01 → MVP-04 (pode paralelizar MVP-02/03/04 após MVP-01)  
2. MVP-05 → MVP-06 → MVP-07 → MVP-08  
3. MVP-09 → MVP-10 → MVP-11  
4. Pós-MVP / Plus conforme prioridade do board (POST-07 discovery cedo é recomendado em paralelo de produto)

---

## Handoff (próximo passo humano)

1. Board/CEO revisa `docs/superpowers/specs/2026-08-07-mvp-leads-roadmap-design.md`  
2. Fechar D1/D2/D5 se possível antes de specs MVP-01/04/08  
3. Abrir issues MVP-01…11 no GitHub a partir deste backlog  
4. Spec + Design handoff por fatia → DEV (TDD) → QA → PR  
5. Não implementar domínio sem issue + spec aprovada
