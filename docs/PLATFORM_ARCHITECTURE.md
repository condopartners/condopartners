# Arquitetura da Plataforma — V0 (Fundação)

> **Status:** 🟡 Em revisão · **Criado:** 2026-06-20 · **Rev.:** 2026-07-17 · **Autor:** Darlan Paiva
> Este documento é a **fundação arquitetural** que vem ANTES do novo PRD. Define como a
> plataforma deixa de ser um app sob medida para a Clique Retire e passa a ser **multiempresa,
> modular e white-label** — a **condopartners**. As decisões aqui foram fechadas em deliberação (ver §2).

---

## 1. O que mudou

| Antes | Agora |
|---|---|
| App sob medida para **uma** empresa (Clique Retire) | **Plataforma para N empresas** (Clique, eCondos, futuras) |
| Regras de negócio **fixas no código** | Regras **configuráveis por empresa** |
| Projeto Supabase compartilhado com outro app (prefixo `crp_`) | **Novo projeto Supabase dedicado** (`condopartners`) |
| App `web/` + Supabase atuais | **Descartados.** Recomeço do zero. |

Os documentos existentes (`PRD.md` V2, `DATA_MODEL.md`, `FLOWS.md`, `SCREENS.md`) **não são descartados**: eles passam a descrever a **configuração de referência da Clique** — o primeiro tenant. Viram um *exemplo de regra*, não o molde da plataforma.

---

## 2. Decisões de fundação (fechadas)

| # | Decisão | Escolha |
|---|---|---|
| 1 | Convivência das empresas | **White-label / instância lógica** (mesma base de código, marca por empresa) |
| 2 | Operação da eCondos | **Instância própria isolada** — não há negócio conjunto com a Clique |
| 3 | Fluxo da eCondos | **Usa rede de parceiros + comissão** (canal de integradores), com regras próprias |
| 4 | Isolamento de dados | **Separados por empresa** — sem leitura cruzada entre tenants |
| 5 | Configurável por empresa | **Comissão, precificação, branding e mapa papel→permissões.** (Papéis e estados em si ficam em enum fixo no MVP — refinamento da decisão #6, ver §5.) |
| 6 | Filosofia de construção | **Plataforma opinativa agora**, reavaliar genericidade só se um 3º cliente exigir |

---

## 3. Insight central: o domínio é compartilhado, as regras não

As duas empresas seguem o **mesmo esqueleto operacional**:

```
Rede de parceiros (hierárquica)
   → reserva de condomínio
      → vistoria técnica
         → proposta (catálogo + preço)
            → contrato (assinatura)
               → pagamento
                  → comissão (distribuída na rede)
```

O que **varia por empresa** são as regras dentro de cada etapa (como calcular comissão, como precificar, quem transiciona cada estado do funil) — **e o próprio produto vendido**. O núcleo não assume nenhum produto específico (não é "plataforma de locker"): cada tenant cadastra o **seu catálogo** e vende o que é dele. Na Clique, o catálogo são módulos de locker inteligente; na eCondos, o produto próprio dela.

Ter **dois** exemplos reais (Clique + eCondos) confirmando o mesmo esqueleto é o que torna a modularização segura. Com um só, qualquer "genérico" seria só a Clique disfarçada. Por isso o levantamento das regras da eCondos (§8) é pré-requisito para fechar as interfaces.

---

## 4. Multi-tenancy (mecânica)

- **Um único projeto Supabase.** A "instância" de cada empresa é **lógica**, não um banco/projeto por empresa.
- **`tenant_id` (empresa) em toda tabela de negócio.** Toda query é escopada por tenant.
- **Isolamento por RLS:** policies garantem que um usuário só enxerga linhas do seu próprio tenant. Zero leitura cruzada entre Clique e eCondos.
- **White-label:** marca, tema, logo e domínio próprios por tenant, resolvidos a partir do `tenant_id` (config, não código).
- **Identidade:** `auth.users` continua único do Supabase; um usuário pertence a um tenant via tabela de perfil (FK + `tenant_id`).

**Racional:** multi-tenant por `tenant_id`+RLS num só projeto é mais barato e sustentável que um deploy por empresa, e o isolamento por RLS é um caso forte do Supabase/Postgres. Essa decisão só deve ser reaberta se uma empresa exigir residência de dados separada por contrato.

---

## 5. As costuras: núcleo genérico vs. configurável

| Concern | Núcleo genérico (igual para todos) | Configurável por empresa | Mecanismo |
|---|---|---|---|
| Tenancy / Identidade | tenants, usuários, auth, sessão | marca, tema, domínio | config por tenant |
| **RBAC** | motor de permissão + **papéis em enum fixo** | mapa papel→permissão e valores por empresa | config por tenant (papéis data-driven adiado) |
| Rede de parceiros | árvore/hierarquia, convites, onboarding | semântica da `commission_pct`, profundidade | parâmetros + estratégia |
| Condomínios / reserva / vistoria | entidades, fotos, storage, **estados em enum fixo** | quais transições são habilitadas (via RBAC) | opinativo; workflow data-driven = fase futura |
| Catálogo / precificação | entidades de produto e preço | **modelo de preço** (uplift, teto, etc.) | estratégia de preço por tenant |
| **Comissão** | snapshot, liberação, auditoria | **fórmula de cálculo** | **estratégia de comissão plugável** |
| Workflow / estados | trilha de eventos, **estados em enum fixo** | quem transiciona cada estado | RBAC por tenant (estados não mudam por empresa no MVP) |
| Pagamentos / auditoria / notificações | genéricos | gatilhos | genérico |

**Padrão de implementação:** cada concern configurável tem uma **interface** com **estratégias prontas** que a empresa **seleciona e parametriza**. Não é low-code; é um conjunto opinativo de opções de fábrica.

**Reconciliação com a decisão #6 (2026-06-20, após auditoria de consistência dos docs):** as costuras **reais** por empresa no MVP são apenas **`tenant_id` + estratégia de comissão + estratégia de preço** (+ branding white-label). **Papéis e estados ficam em enum fixo**; abrir para data-driven (papéis/workflow definidos em runtime) só se um 3º tenant exigir.

---

## 6. Como as regras da Clique viram "uma estratégia"

O que hoje está fixo no modelo da Clique passa a ser **a primeira configuração**, atrás das interfaces:

| Regra atual da Clique | Vira |
|---|---|
| Cascata de markup encadeado | `CommissionStrategy = "chained_markup"` (uma das estratégias) |
| Anti-harding 180 dias | parâmetro de uma `ReservationStrategy` |
| Precificação matriz UF + uplift | `PricingStrategy = "uf_matrix_uplift"` |
| Estados de proposta (`draft→pending→...`) | enum fixo compartilhado; **quem transiciona** cada estado é config do tenant (RBAC) |
| Papéis N1/N2/N3/Parceiro | enum fixo compartilhado; o **mapa papel→permissões** é config do tenant Clique |

A eCondos pluga **as estratégias dela** nas mesmas interfaces — sem tocar no núcleo.

---

## 7. Filosofia de construção (guarda contra over-engineering)

- **Modular monolith**, não microsserviços. Um app, módulos com fronteiras claras.
- **Opinativo, não genérico.** Estratégias de fábrica selecionáveis por tenant. Regra radicalmente nova = **nova estratégia em código** (PR revisável), não configuração mágica em runtime.
- **YAGNI explícito:** só abrimos o núcleo para algo mais genérico (motor de regras, entidades custom) quando um **terceiro** cliente provar a necessidade. Dois clientes não justificam um motor low-code.
- **Lógica financeira crítica** (cálculo de comissão) continua perto do dado e **transacional**.

---

## 8. O que sabemos × o que falta

**Sabemos:** o esqueleto; as regras da Clique (em `PRD.md` V2 e anexos); que a eCondos usa parceiros + comissão.

**Falta (não bloqueia começar o núcleo, mas bloqueia fechar as interfaces de comissão/preço/workflow):**
- 🔴 **Regras concretas da eCondos** — precisamos do equivalente ao `OPEN_QUESTIONS.md`, mas para a eCondos: qual é o produto/catálogo, como calculam comissão, como precificam, quais estados/etapas, quais papéis. *(Próximo artefato: questionário **"eCondos Discovery"**, nos moldes do `OPEN_QUESTIONS.md`.)*
- 🔴 **Questões de negócio em aberto da Clique** (de `PRD.md` §9), agora **mais críticas**: a decisão "comissão única vs. recorrente" não muda só a Clique — ela define o **formato da interface** `CommissionStrategy`. Precisa sair antes.

---

## 9. Plano sugerido (fases)

| Fase | Entregável |
|---|---|
| 0 — Fundação | Este doc revisado + "eCondos Discovery" + fechamento das questões de negócio em aberto (`PRD.md` §9) + novo repo de código (`condopartners`) |
| 1 — Núcleo multi-tenant | Tenancy, auth, RBAC configurável, audit, white-label base — com a **Clique como 1º tenant** |
| 2 — Núcleo operacional + comercial | Condomínios, reserva, vistoria, catálogo, propostas, contratos, pagamentos — com as **estratégias da Clique** |
| 3 — Comissão + financeiro | Engine de comissão plugável (estratégia `chained_markup` da Clique) |
| 4 — Onboarding eCondos | Plugar as estratégias da eCondos como **2º tenant** — isto **prova** a arquitetura |
| 5 — Hardening | Testes de isolamento entre tenants, RLS audit, performance |

> A Fase 4 é o **teste de fogo** da arquitetura: se onboardar a eCondos exigir mexer no núcleo, a abstração estava errada. Por isso o "eCondos Discovery" acontece **cedo** (Fase 0), mesmo que a implementação dela venha depois.

---

## 10. Nome e repositório

- **Nome do produto / projeto Supabase:** **`condopartners`** (atualizado 2026-07-17). Nome neutro de plataforma — a Clique é só um tenant e o produto vendido é definido por tenant.
- **Repositório de código:** **novo repo dedicado**, separado deste (que é o repo de **docs/design**). Começa limpo, sem os artefatos do app de teste descartado.
- **Onde os docs vivem:** ver §11 — decisão de monorepo vs. dois repos.

---

## 11. Onde os docs vivem — ✅ decidido: monorepo (2026-07-17)

Os docs de design vivem em **`condopartners/docs/`**, junto com o código (era a "Opção A"). Spec viaja com o código: mudança de regra e mudança de schema entram no **mesmo PR**, e a divergência doc×código fica visível e revisável na hora. A alternativa (repo de spec separado) foi descartada porque os dois divergem com o tempo — exatamente o tipo de drift já observado (e corrigido) nesta documentação.

O repositório original de design (`clique-retire-partners`) vira **arquivo histórico** assim que este pacote entrar no monorepo.

---

## 12. Pendências de fundação (Fase 0)

1. Validar as decisões da §2 com os stakeholders (Clique + eCondos).
2. Rascunhar e rodar o **"eCondos Discovery"** (questionário de regras, nos moldes do `OPEN_QUESTIONS.md`).
3. Fechar as questões de negócio em aberto da Clique (`PRD.md` §9 / `OPEN_QUESTIONS.md`) — em debate.
4. ✅ ~~Decidir monorepo vs. dois repos e criar o repo~~ — feito (2026-07-17): repo `condopartners` criado, docs em `condopartners/docs/` (§11).
5. Escrever o **novo PRD da plataforma** depois dessas respostas.
