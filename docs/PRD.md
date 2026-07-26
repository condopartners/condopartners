# PRD — Clique Retire Partners (V2)

> **Product Requirements Document.** Define o *quê* e o *porquê* do produto. O *como* técnico vive nos anexos.
> **Versão:** V2 · **Data:** 2026-06-19 · **Autor:** Darlan Paiva · **Status:** 🟡 Em validação (decisões de negócio em aberto para debate — ver §9).
>
> **Multiempresa:** este PRD descreve a **configuração de referência da Clique Retire**, 1º tenant da plataforma **condopartners**. Na plataforma, o **produto vendido é definido por tenant** (catálogo próprio) — o locker é o produto da Clique, não do núcleo. A fundação (multi-tenancy, núcleo vs. configurável) está em `PLATFORM_ARCHITECTURE.md`.

## 0. Como ler este documento

Este PRD é a fonte de verdade de **produto**. Ele referencia, mas não substitui, os anexos técnicos:

| Documento | Papel |
|---|---|
| **`PRD.md`** (este) | Visão, objetivos, personas, escopo, requisitos funcionais, regras de negócio, não-funcionais. |
| `DATA_MODEL.md` | Fonte de verdade do schema: tabelas, colunas, RLS, `plpgsql`, jobs. |
| `FLOWS.md` | Diagramas de sequência dos fluxos críticos. |
| `SCREENS.md` | Inventário de telas por papel + matriz rota×permissão. |
| `DIAGRAMS.md` | Diagramas visuais para reunião. |
| `BRIEF.md` | Resumo executivo (5 min). |
| `PLATFORM_ARCHITECTURE.md` | Fundação da plataforma multiempresa (condopartners). |
| `OPEN_QUESTIONS.md` | Questões de negócio em aberto, para debate (ver §9). |

> ⚠️ **Antes do handoff técnico definitivo**, ler a §9 (Decisões em aberto). Parte delas pode alterar o modelo de dados e segue em aberto para debate.

---

## 1. Contexto e Problema

A Clique Retire opera uma **rede hierárquica de parceiros** que captam, vistoriam e vendem contratos de *lockers* para condomínios. Hoje a operação sofre com:

- **Sem controle centralizado** de captação, reserva e vistoria de condomínios.
- **Comissionamento em cascata feito manualmente em planilha** — propenso a erro humano e a disputas entre parceiros.
- **Precificação regional (por UF)** e versionamento de catálogo viram problema operacional sem ferramenta.
- **Sem trilha de auditoria** para cancelamentos, pagamentos e aprovações.

**Oportunidade:** uma plataforma B2B que digitaliza o funil inteiro (convite → cadastro → reserva → vistoria → proposta → contrato → pagamento → liberação de comissão) e calcula a comissão de forma **automática, auditável e imutável** no banco.

---

## 2. Objetivos e Métricas de Sucesso

> ⚠️ As **metas numéricas** abaixo são propostas e ainda precisam ser validadas — marcadas `[definir]`. As **definições** de métrica já servem para o time instrumentar.

### Objetivos de negócio
1. **Eliminar o erro de comissão** — cálculo da cascata 100% no sistema, com snapshot imutável por contrato.
2. **Dar previsibilidade ao parceiro** — cada parceiro vê seu saldo futuro e liberado em tempo real.
3. **Centralizar e auditar a operação** — toda ação sensível (aprovação, assinatura, cancelamento, pagamento) tem trilha.
4. **Escalar a rede** sem perder o controle de precificação regional.

### KPIs (métricas de sucesso)
| Métrica | Definição | Meta |
|---|---|---|
| Erro de comissão | % de contratos com divergência entre cálculo do sistema e o devido | `[definir]` (proposto: 0%) |
| Tempo reserva → contrato | mediana de dias entre `reserved_at` e `signed_at` | `[definir]` |
| Taxa de conversão de proposta | propostas `approved` ÷ propostas `submitted` | `[definir]` |
| Parceiros ativos | `users` com `status='active'` e ≥1 ação em 30 dias | `[definir]` |
| Condomínios contratados | condomínios em `status='contracted'` | `[definir]` |
| Reservas expiradas | % de reservas que vencem sem virar proposta | `[definir]` (sinaliza anti-harding/eficiência) |

---

## 3. Personas

| Persona | Papel no sistema | Objetivo principal | Dor que o produto resolve |
|---|---|---|---|
| **Diretor / Matriz** | Admin N1 | Controlar preços, ver o financeiro macro, cancelar contratos | Não confiar em planilha; visão de receita prevista vs realizada |
| **Gestor Operacional** | Admin N2 | Aprovar parceiros, assinar contratos, reconciliar pagamentos | Operação manual e sem fila clara |
| **Backoffice Técnico** | Admin N3 | Aprovar/rejeitar vistorias | Vistorias sem padrão nem trilha |
| **Parceiro de campo** | Partner | Reservar condomínio, vistoriar, vender e acompanhar comissão | Não saber quanto vai ganhar; disputa de praça |
| **Parceiro líder** | Partner *com sub-rede* | Acompanhar a equipe e a comissão de override | Não enxergar a performance de quem ele convidou |

> "Líder" **não é um papel** — é estado emergente: um parceiro vira líder quando alguém entra com `parent_id` apontando para ele.

---

## 4. Escopo

### 4.1. Dentro do MVP
- RBAC com 4 papéis (N1, N2, N3, Partner) + RLS hierárquica.
- Convite com `commission_pct` + onboarding + aprovação de cadastro.
- Reserva de condomínio com trava de duplicidade (CNPJ), endereço obrigatório, expiração e anti-harding.
- Vistoria técnica em campo (com fotos) + aprovação por N3.
- Catálogo de módulos + precificação matriz **(módulo × UF)** com uplift.
- Proposta com **preview da cascata** + negociação + assinatura.
- Cálculo da cascata de comissão (markup encadeado) com snapshot imutável.
- **Comissão única**: nasce `future` na assinatura, vira `released` na 1ª mensalidade paga. ⚠️ *premissa — ver §9.2.*
- Cancelamento de contrato (N1) com regra de `void`/intocável.
- Dashboards por papel + auditoria.

### 4.2. Fora do MVP (out of scope)
- **Mensalidades 2+** e controle financeiro recorrente completo — só `installment_number=1` é criada (apenas para disparar a liberação).
- **Integração com gateway de pagamento** — pagamento real é feito fora do sistema; aqui é só controle.
- **Comissão recorrente/mensal** — ⚠️ *depende da decisão em aberto (§9.2).*
- **Reajuste/upsell pós-assinatura com recálculo de comissão** — ⚠️ *depende da decisão em aberto (§9.4).*
- **Notificações push** além do Realtime básico (lista a confirmar — `SCREENS.md`).
- Exportações além de "Comissões — N1".

---

## 5. Perfis e Permissões (RBAC)

| Papel | Escopo |
|---|---|
| **Admin N1 (Diretoria/Matriz)** | Acesso total. CRUD da tabela de preços e upliftes por UF, dashboards financeiros macro, cancelamento de contratos, exclusão definitiva, `system_settings`. |
| **Admin N2 (Gestão Operacional)** | Aprova cadastros, assina contratos, gerencia carteira, marca pagamentos. Não altera preços globais nem exclui registros. |
| **Admin N3 (Backoffice Técnico)** | Aprova/rejeita vistorias técnicas. Sem acesso a financeiro. |
| **Parceiro** | Captura condomínios, vistoria, propostas, acompanha carteira/comissão. Sub-rede derivada da árvore via RLS; sem flag de "líder". |

> Matriz completa rota × papel em `SCREENS.md`.

---

## 6. Requisitos Funcionais (histórias de usuário + critérios de aceite)

> Notação: **US-<módulo>.<n>**. Cada história tem critérios de aceite (CA) verificáveis. Detalhe de fluxo em `FLOWS.md`; de tela em `SCREENS.md`.

### Módulo A — Rede e Convites
**US-A.1** — Como parceiro, quero gerar um link de convite definindo a `commission_pct` do convidado, para crescer minha sub-rede.
- CA1: o convite carrega `commission_pct` e `expires_at`; gera link com `token` único.
- CA2: ao consumir, o convidado entra com `parent_id = meu id`, `role='partner'`, `status='pending_approval'`.
- CA3: a `commission_pct` do convite é gravada em `users.commission_pct` do convidado e vale para todos os contratos futuros dele.
- CA4: **convite não pode ser revogado após consumo** do pré-cadastro; para desativar, inativa-se o usuário.

**US-A.2** — Como Admin N1/N2, quero aprovar/rejeitar cadastros pendentes, para controlar quem entra na rede.
- CA1: só N1/N2 conseguem mudar `status: pending_approval → active` (N3 **não** pode).
- CA2: usuário `pending_approval` vê tela bloqueante e não opera.

**US-A.3** — Como Admin N1, quero inativar qualquer usuário; como parceiro líder, quero inativar apenas minha sub-rede.
- CA1: N1/N2 inativam qualquer um; líder só inativa descendentes via `descendants_of()`.
- CA2: inativação grava `inactivated_by` e `inactivated_at`.

### Módulo B — Operacional (Condomínios, Reserva, Vistoria)
**US-B.1** — Como parceiro, quero reservar um condomínio informando CNPJ + endereço, para garantir minha praça.
- CA1: CNPJ duplicado é **rejeitado** (trava de duplicidade).
- CA2: `address` é obrigatório (anti concentração de praça).
- CA3: reserva define `reservation_expires_at` (TTL default 72h, parametrizável).
- CA4: corrida resolvida por `UPDATE ... WHERE status='available'`; segundo a tentar recebe 409.
- CA5: se o parceiro tem bloqueio anti-harding ativo para aquele condomínio, recebe **403 com a data de liberação**.

**US-B.2** — Como sistema, quero liberar reservas vencidas e aplicar anti-harding automaticamente.
- CA1: `pg_cron` a cada 5 min libera reservas com `reservation_expires_at < now()` → `available`.
- CA2: ex-reservante recebe bloqueio de **180 dias** (parametrizável em `system_settings.anti_harding_window_days`) para aquele condomínio.

**US-B.3** — Como parceiro reservante, quero registrar a vistoria técnica com fotos, para submeter à aprovação.
- CA1: só o **parceiro reservante** (`performed_by`) pode preencher a vistoria.
- CA2: fotos vão para bucket privado (`inspection-photos`), com RLS.
- CA3: ao enviar, vistoria vai para `submitted`.

**US-B.4** — Como Admin N3, quero aprovar/rejeitar vistorias, para garantir qualidade técnica.
- CA1: N3 só escreve em `inspections.review_*`; aprovação/rejeição grava `reviewed_by`, `reviewed_at`.
- CA2: rejeição exige `rejection_reason`.

### Módulo C — Propostas e Contratos
**US-C.1** — Como parceiro, quero montar uma proposta e ver o **preview da cascata** antes de submeter, para saber meu ganho.
- CA1: só condomínios com vistoria `approved` podem virar proposta.
- CA2: `base_cost_master` é **derivado da soma dos itens** (`SUM(effective_module_price(module, uf) × qtd)`).
- CA3: `sale_price` deve respeitar `base_cost_master ≤ sale_price ≤ max_price` da UF.
- CA4: o preview mostra o ganho do autor e de cada coautor, sem persistir (stateless), usando a **mesma fórmula** da assinatura.

**US-C.2** — Como Admin N1/N2, quero negociar/rejeitar/assinar uma proposta.
- CA1: estados: `draft → pending → (under_negotiation ⇄ pending) → (rejected | approved)`.
- CA2: edição só em `draft`, `pending`, `under_negotiation`.
- CA3: **assinatura é exclusiva de N1/N2** e é **uma transação**: cria `contract`, calcula cascata (`commissions=future`), cria `payment` da 1ª mensalidade, atualiza condomínio para `contracted`. Falha em qualquer passo aborta tudo.

### Módulo D — Financeiro e Comissão
**US-D.1** — Como sistema, quero calcular a cascata de markup encadeado na assinatura.
- CA1: parte do `base_cost_master` real e desce a árvore até o autor.
- CA2: `markup_nivel_N = (sale_price − base_visível_N) × commission_pct_N`; autor (folha) fica com o resíduo.
- CA3: `SUM(amount) = sale_price − base_cost_master`.
- CA4: ancestral **inativo** → linha `house` (`beneficiary=NULL`), markup absorvido pela Clique; invisível para parceiros.

**US-D.2** — Como Admin N2, quero marcar a 1ª mensalidade como paga, para liberar as comissões.
- CA1: marcar `payments.paid_at` da `installment_number=1` dispara trigger → todas as `commissions` do contrato viram `released`.
- CA2: parceiros veem o "Saldo Liberado" subir (Realtime).

**US-D.3** — Como Admin N1, quero cancelar um contrato.
- CA1: cancelado **antes** da 1ª mensalidade → `future` viram `void`.
- CA2: cancelado **depois** → `released` ficam **intocados** (sem reversão; pagamento real é externo).
- CA3: cancelamento exige motivo e grava `cancelled_by`/`cancelled_at`; condomínio volta a `available`.

**US-D.4** — Como parceiro, quero ver minha carteira (Liberado/Futuro) e a comissão de override da sub-rede.
- CA1: parceiro vê só rows de si + descendentes (RLS); **nunca** rows `house`.
- CA2: a UI **omite** `markup_pct_applied` e `visible_base_at_level` quando o usuário não é o beneficiário da row (defesa em profundidade).

### Módulo E — Administração e Catálogo
**US-E.1** — Como Admin N1, quero versionar a precificação matriz (módulo × UF) e o teto regional (`max_price`).
- CA1: nova versão encerra a anterior com `valid_to`; no máximo uma vigente por par.
- CA2: preço efetivo = `(base × (1 + uplift_pct)) + uplift_amount`.

**US-E.2** — Como Admin N1, quero editar `system_settings` (anti-harding, TTL reserva, UF referência).

---

## 7. Regras de Negócio (consolidadas)

> Conteúdo migrado e mantido do PRD V1. Fonte técnica detalhada em `DATA_MODEL.md`.

### 7.1. Rede / Hierarquia
- Árvore **infinita** via *adjacency list* (`users.parent_id`).
- `commission_pct` definida no convite; vale para todos os contratos futuros do convidado. Mudança só afeta propostas criadas **após** a mudança (snapshot na assinatura).
- Convites **sem revogação** após consumo. Inativação afeta sub-rede (líder) ou qualquer um (N1/N2).
- **Cotas de reserva: ilimitadas no MVP.** Controle social via auditoria.

### 7.2. Operacional
- Trava de duplicidade por CNPJ. Endereço obrigatório na reserva.
- Expiração de reserva por `pg_cron` (5 min) + anti-harding de 180 dias (parametrizável).
- Levantamento técnico só pelo parceiro reservante.

### 7.3. Precificação
- Matriz `(módulo × UF)` em `module_uf_pricing` (base + uplift % + uplift R$).
- `price_tables` carrega só o teto `max_price` por UF, versionado.
- `base_cost_master` da proposta é **derivado** da soma dos itens.

### 7.4. Comissionamento (markup encadeado)
- Cada parceiro tem sua `commission_pct`; cascata percorre a árvore inteira, sem limite de profundidade.
- Snapshot imutável em `commissions` na assinatura. Estados: `future → released → (void)`.
- House take por ancestral inativo. Sem redistribuição.
- **⚠️ Premissa central:** comissão é **única** (one-shot na 1ª mensalidade). *Decisão em aberto — §9.2.*

---

## 8. Requisitos Não-Funcionais

| Categoria | Requisito |
|---|---|
| **Segurança / Autorização** | RLS no Postgres (macro) + camada de API/UI (micro, esconde campos sensíveis). `service_role` só em operações que precisam bypassar RLS (assinatura, pagamento). Papel lido via `auth_role()` e tenant via `current_tenant_id()` (ver `DATA_MODEL.md` §0). |
| **LGPD** | ⚠️ **Pendente de definição:** CPF/telefone em cleartext vs criptografia at-rest; política de retenção; logs de acesso. Bloqueia go-live. |
| **Integridade financeira** | Cálculo da cascata é **atômico** (transação única). Snapshot imutável; soma da cascata = margem. |
| **Auditoria** | Toda ação sensível registrada (quem, quando, payload): aprovação, assinatura, cancelamento, pagamento, inativação. |
| **Desempenho** | RLS recursiva (`descendants_of`) com índice em `parent_id`; materializar view se a árvore passar de ~10k parceiros. |
| **Disponibilidade / Backup** | ⚠️ **Definir SLO + RTO/RPO.** Supabase tem PITR no plano Pro. |
| **Mobile** | Fluxo de **vistoria é mobile-first** (campo). Resto pode ser desktop-first. |
| **Multi-tenant** | Projeto Supabase **dedicado** (`condopartners`). Isolamento por `tenant_id` + RLS escopada por tenant; zero leitura cruzada entre empresas (ver `DATA_MODEL.md` §0 e `PLATFORM_ARCHITECTURE.md`). |

---

## 9. Decisões em Aberto — ⚠️ BLOQUEADORES de negócio (para debate)

> As decisões abaixo estão detalhadas em `OPEN_QUESTIONS.md` e **seguem em aberto para debate (status em 2026-07-17)**. Exceto a 9.3, todas podem **alterar o modelo de dados**. O time pode começar pelos módulos estáveis (A, B, E e parte de C), mas **não deve fechar D (financeiro/comissão)** antes destas respostas.

| # | Decisão em aberto | Premissa atual do modelo | Impacto se mudar |
|---|---|---|---|
| 9.1 | **Contrato do Locker (cliente) vs Acordo de Parceria (parceiro)** | "Contrato" é uma entidade única (`contracts`). | Pode exigir separar em duas entidades + ajustar comissões e fluxos. |
| 9.2 | **Modalidades de comissão** (única vs mensal recorrente vs trimestral) | **Comissão única** (one-shot na 1ª mensalidade). | Recorrência reescreve `payments`, `commissions` e a liberação. **Alto impacto.** |
| 9.3 | **Quem negocia com quem** (Clique↔parceiro vs Clique↔cliente) | "Em negociação" = parceiro ↔ Clique. | Pode adicionar um eixo de negociação com o cliente. |
| 9.4 | **Mudança de valor pós-assinatura** (reajuste anual, upsell) | Cascata **congelada** na assinatura; sem recálculo. | Recálculo automático exige triggers e nova modelagem de upsell. |
| 9.5 | **Base da comissão** — `sale_price` é a **mensalidade**, um **valor fechado** ou **setup + MRR**? (`OPEN_QUESTIONS.md` §5) | `sale_price` é um valor único; contrato carrega `monthly_amount`. | Se o modelo for setup + MRR / TCV, reescreve `proposals`, `contracts` e a base da cascata. **Alto impacto** — amarrada à 9.2. |

Itens menores a confirmar (também em `OPEN_QUESTIONS.md`): lista real de SKUs do catálogo, cobertura/prioridade de UFs, regras internas de LGPD.

---

## 10. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Time sem fluência em `plpgsql` | Concentrar lógica em uma função (`calculate_commission_cascade`, estratégia `chained_markup`) com testes; resto em TypeScript. |
| RLS recursiva lenta em árvore grande | Índice em `parent_id`; materializar view se necessário (não antes de ~10k parceiros). |
| Disputas sobre cascata | Snapshot imutável + `cascade_snapshot` para preview transparente antes de assinar. |
| Cancelamento sem reversão | Decisão clara: sistema é controle; pagamento real é externo. |
| Lock-in Supabase | Schema portável; RLS é Postgres puro; jobs migráveis. |
| LGPD | **Pendente** — definir criptografia e retenção (ver §8). |
| **Decisões em aberto (§9) podem invalidar premissas** | **Segurar Módulo D até §9 ser resolvido.** Construir A/B/E em paralelo. |

---

## 11. Roadmap (proposta)

| Fase | Entregável | Estimativa |
|---|---|---|
| 0 — Alinhamento | Fechamento das decisões de negócio (§9) + decisões técnicas (em `BRIEF.md`) | 1 sem |
| 1 — Setup | Repo Next.js + Supabase + migrations + CI/CD | 1 sem |
| 2 — Núcleo | Auth, RLS, modelo de dados, telas Admin N1 (catálogo, parceiros, preços) | 3 sem |
| 3 — Fluxo de parceiro | Convite, onboarding, reserva, vistoria, proposta, preview da cascata | 3 sem |
| 4 — Fechamento | Assinatura, payments, liberação, dashboard de comissão | 2 sem |
| 5 — Hardening | Testes de cascata, RLS audit, LGPD review, smoke tests | 2 sem |
| **Total MVP** | | **~12 sem** |

> A Fase 4 (financeiro) depende das respostas de §9.2, §9.4 e §9.5.
>
> **Nota (redesenho multiempresa):** o plano de fases vigente da plataforma está em `PLATFORM_ARCHITECTURE.md` §9. Este roadmap fica como referência de esforço do **escopo Clique** (o 1º tenant) dentro daquelas fases.

---

## 12. Changelog

- **V2 (2026-06-19):** reescrito no formato de produto. Adicionados objetivos/KPIs (§2), personas (§3), escopo in/out explícito (§4), requisitos funcionais como histórias de usuário com critérios de aceite (§6), não-funcionais (§8) e seção de decisões em aberto/bloqueadores de negócio (§9). Regras de negócio do V1 absorvidas em §7. Specs técnicas mantidas nos anexos.
- **V1:** substituído pelo V2 (todo o conteúdo foi absorvido); o arquivo original permanece no histórico do git.
