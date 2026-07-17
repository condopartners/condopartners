# Clique Retire Partners — Brief Executivo

> Resumo executivo de 5 minutos. Detalhes em `PRD.md`, `DATA_MODEL.md`, `FLOWS.md`, `SCREENS.md`.
>
> **Multiempresa:** o produto virou a plataforma **condopartners** (ver `PLATFORM_ARCHITECTURE.md`); este brief resume a **configuração de referência da Clique**, o 1º tenant — o produto vendido (locker) é o **da Clique**, definido no catálogo dela, não no núcleo da plataforma. Os mecanismos descritos (cascata, RLS hierárquica, anti-harding) seguem válidos como as estratégias da Clique.

---

## Em uma frase

Plataforma B2B para a Clique Retire gerir uma rede hierárquica de parceiros que captam, vistoriam e vendem contratos para condomínios — com cálculo automático de comissão em cascata por markup encadeado.

## O problema hoje

- Rede de parceiros sem controle centralizado de captação, reserva e vistoria.
- Comissionamento em cascata é feito manualmente, em planilha — propenso a erro humano e a disputas.
- Precificação regional (UF) e versionamento de catálogo viram problema operacional sem ferramenta.
- Sem trilha de auditoria para cancelamentos, pagamentos, aprovações.

## A solução em 3 bullets

1. **Workflow operacional** completo: convite → cadastro → reserva de condomínio → vistoria técnica → proposta → contrato → pagamento → liberação de comissão.
2. **Comissão calculada e auditada no banco** via `plpgsql` no momento da assinatura, com snapshot imutável por contrato.
3. **RBAC + RLS** para 4 papéis (N1, N2, N3, Parceiro) — sub-rede é estado emergente da árvore, não papel separado.

---

## Stack proposta

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui | App Router casa com Server Actions; produtividade alta; padrão do mercado |
| Backend & Banco | **Supabase** (Postgres 15+, Auth, Storage, Edge, Realtime) | Postgres nativo para queries recursivas e integridade financeira; RLS encaixa direto no RBAC; elimina serviço de backend separado |
| Regra crítica | `plpgsql` (cascata, triggers de liberação/cancelamento) | Atomicidade transacional não-negociável; lógica financeira fica perto do dado |
| Jobs | `pg_cron` (expiração de reserva, encerramento de contrato) | Sem worker externo |
| Autorização | RLS no banco + Route Handlers/Server Actions com `service_role` em casos pontuais | Defesa em profundidade; código não pode burlar RLS por engano |

**Trade-off explícito:** lock-in em Supabase. Mitigação: migrations em SQL puro, schema portável; o que é Supabase-specific (RLS, pg_cron, Auth) tem equivalente em qualquer Postgres gerenciado.

---

## As 4 peças singulares do produto

### 1. Markup encadeado (não é "% sobre margem")

Cada parceiro tem sua **própria %**. Quando convida alguém, o convidado vê um custo aparente já com o markup do convidante embutido. Cascata percorre toda a árvore até a Matriz. O vendedor (leaf) fica com o resíduo.

**Exemplo real (planilha do cliente — `Comissões.xlsx`):** venda R$ 1.200, custo Matriz R$ 1.000, 10% por nível.

| Nível | Valor base visível | Margem residual | Markup do nível |
|---|---|---|---|
| 1 (topo) | 1.000,00 | 200,00 | 20,00 |
| 2 | 1.020,00 | 180,00 | 18,00 |
| 3 | 1.038,00 | 162,00 | 16,20 |
| ... | ... | ... | ... |
| 10 (vendedor) | 1.122,52 | 77,48 (fica com ele) | — |

Soma = R$ 200. **Margem inteira distribuída, sem sobra (exceto house take — ver item 4).**

### 2. RLS hierárquica via `descendants_of()`

Recursive CTE no Postgres responde "quem está abaixo de mim na árvore". RLS usa isso para:
- Parceiro vê **só ele + descendentes** (carteira, propostas, comissões de override da sub-rede).
- Líder não tem flag — é emergente: quem tem `parent_id` apontando para ele.
- Defesa em profundidade na UI: campos sensíveis (`markup_pct_applied`) são omitidos quando o usuário não é beneficiário direto da row.

### 3. Anti-harding com janela de 6 meses

Parceiro que perde reserva por expiração fica **bloqueado por 180 dias** para reservar aquele condomínio específico. Implementado com `pg_cron` (5 min) + tabela `condominium_reservation_blocks`. Janela parametrizável em `system_settings`.

### 4. House take por ancestral inativo

Se um ancestral está `inactive` no momento da assinatura, o markup que seria dele vai para a Clique (linha em `commissions` com `beneficiary=NULL`, `role='house'`). Visível apenas para N1/N2 no dashboard financeiro macro.

---

## Gatilhos e estados financeiros

- Comissão **nasce** como `future` na assinatura do contrato (snapshot em `commissions`).
- Vira **`released`** quando a 1ª mensalidade é marcada como paga por Admin N2.
- Vira **`void`** se o contrato é cancelado **antes** da 1ª mensalidade.
- Cancelamento **depois** da 1ª mensalidade NÃO reverte `released` — sistema é controle, não processamento de pagamento.

---

## Riscos conhecidos e mitigação

| Risco | Mitigação |
|---|---|
| Time não tem fluência em `plpgsql` | Concentrar lógica em **uma função** (`calculate_commission_cascade`) com testes de propriedade. Tudo o mais em TypeScript. |
| RLS recursiva (descendentes) pode ficar lenta com árvore grande | Índice em `parent_id`; materializar `descendants_of` em view se necessário. Não é problema antes de ~10k parceiros. |
| Disputas sobre cascata | Snapshot imutável em `commissions` + `cascade_snapshot` em `proposals` para preview transparente antes de assinar. Cada row guarda `markup_pct_applied` e `visible_base_at_level` para auditoria. |
| Cancelamento sem reversão pode causar dor | Decisão clara: comissão real é controlada/paga fora do sistema; aqui só registra. Sem dívida técnica financeira no banco. |
| Vendor lock-in Supabase | Schema portável, RLS é Postgres puro, jobs migráveis para qualquer scheduler. Migração custaria semanas, não meses. |
| LGPD (CPF + dados de parceiros) | Pendente. Definir nível de criptografia em colunas sensíveis + política de retenção. |

---

## Decisões técnicas em aberto (para debate)

1. **Stack lock-in Supabase** — vai com ou avalia RDS/Cognito separados?
2. **Ferramenta de migrations** — `supabase-cli` (SQL puro) vs Drizzle vs Kysely. Afeta DX do time.
3. **Mobile-first vs desktop-first** — vistoria em campo praticamente exige mobile-first naquele fluxo. Resto pode ser desktop-first.
4. **Quem mantém `plpgsql`** — se o time é só TypeScript, isso precisa de um backend/DBA dedicado ou treinamento.
5. **Política de backup + RTO/RPO** — Supabase tem PITR no plano Pro. Define a SLO?
6. **Compliance LGPD** — CPF em cleartext? Criptografar at-rest? Logs de acesso?
7. **Ambientes** — local (Supabase CLI) + staging + prod? Quem provisiona?

---

## Próximos passos (proposta)

| Fase | Entregável | Duração estimada |
|---|---|---|
| 0 — Alinhamento | Esta apresentação + fechamento das decisões técnicas | 1 semana |
| 1 — Setup | Repo Next.js + Supabase local + migrations + CI/CD básico | 1 semana |
| 2 — Núcleo | Auth, RLS, modelo de dados, telas de Admin N1 (catálogo, parceiros, preços) | 3 semanas |
| 3 — Fluxo de parceiro | Convite, onboarding, reserva, vistoria, proposta, preview da cascata | 3 semanas |
| 4 — Fechamento | Assinatura, payments, liberação, dashboard de comissão | 2 semanas |
| 5 — Hardening | Testes de cascata, RLS audit, LGPD review, smoke tests | 2 semanas |
| **Total MVP** | | **~12 semanas** |

> **Nota:** com o redesenho multiempresa, o plano de fases vigente da plataforma está em `PLATFORM_ARCHITECTURE.md` §9; a tabela acima é a referência de esforço do escopo Clique.

---

## Artefatos disponíveis

- `PLATFORM_ARCHITECTURE.md` — fundação da plataforma multiempresa (condopartners)
- `PRD.md` — regras de negócio e papéis
- `DATA_MODEL.md` — schema completo + RLS + `plpgsql` + cron
- `FLOWS.md` — 6 diagramas de sequência dos fluxos críticos
- `SCREENS.md` — inventário de ~35 telas com matriz de permissões
- `Comissões.xlsx` — planilha original do cliente (base do exemplo da cascata)
- `BRIEF.md` — este documento
