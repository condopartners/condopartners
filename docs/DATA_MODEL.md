# Data Model — Clique Retire Partners

> Configuração de referência da **Clique Retire**, 1º tenant da plataforma **condopartners**.
> A fundação multiempresa está em `PLATFORM_ARCHITECTURE.md`; a §0 abaixo é a regra global de multi-tenancy e vale para **todo** o schema. O **produto vendido é definido por tenant** (catálogo próprio) — nada no schema assume um produto específico.

Stack: **Supabase (Postgres 15+)** com RLS, `pg_cron`, Storage, Edge Functions.
Schema em **inglês**, snake_case. Toda PK é `uuid` (`gen_random_uuid()`).
Toda tabela tem `created_at timestamptz default now()` e `updated_at timestamptz` (mantido por trigger genérica).

---

## 0. Multi-tenancy (regra global)

Projeto Supabase **dedicado** (não mais compartilhado). Nomes de tabelas, funções e bucket **sem prefixo**.

- **`tenants`** — empresa (Clique, eCondos, …): `id uuid PK`, `name`, `slug`, `branding jsonb` (white-label), `commission_strategy text`, `pricing_strategy text`, `is_active bool`.
- **`tenant_id uuid not null references tenants(id)`** em **toda tabela de negócio** abaixo. Para não poluir as tabelas, é **omitido** delas — assuma `tenant_id` presente em todas.
- **Uniques de negócio são por tenant:** `(tenant_id, cnpj)` em `condominiums`, `(tenant_id, cpf)` em `users`, `(tenant_id, code)` em `modules_catalog`, `(tenant_id, module_id, uf)` em `module_uf_pricing`, PK `(tenant_id, key)` em `system_settings`. Unicidade **global** (ex.: CNPJ) vazaria a existência de um registro de uma empresa para outra.
- **RLS escopada por tenant:** além da regra de papel/dono, **toda** policy inclui `tenant_id = current_tenant_id()`. Zero leitura cruzada entre empresas.
- **Helpers** (security definer, lêem do perfil do usuário logado):
  - `current_tenant_id()` → tenant do usuário logado.
  - `auth_role()` → papel do usuário logado.
- **Hierarquia tenant-scoped:** `descendants_of()` / `ancestors_of()` filtram por `tenant_id` — a árvore **nunca** atravessa empresas.
- **Papéis e estados continuam enums fixos** (decisão opinativa #6 — ver `PLATFORM_ARCHITECTURE.md`). O que varia por empresa são valores/permissões e as **estratégias** de comissão e preço — não a definição de papéis/estados em runtime.

---

## 1. Domínio de Identidade & Hierarquia

### `users`
Estende `auth.users` do Supabase 1:1.

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | mesmo `id` de `auth.users` |
| `parent_id` | `uuid` FK → `users(id)` nullable | adjacency list; null = topo da rede |
| `role` | `enum user_role` | `admin_n1` \| `admin_n2` \| `admin_n3` \| `partner` |
| `commission_pct` | `numeric(5,4)` nullable | % que ESTE parceiro embute como markup. Definida no convite. Só faz sentido para `role=partner`. Range 0..1 (ex: `0.1000`). |
| `full_name` | `text` | |
| `cpf` | `text` unique nullable | parceiros têm CPF; admins podem não ter |
| `phone` | `text` | |
| `status` | `enum user_status` | `pending_approval` \| `active` \| `inactive` |
| `inactivated_by` | `uuid` FK → `users(id)` | quem inativou |
| `inactivated_at` | `timestamptz` | |

> **Observação sobre "Líder vs Subsequente":** não é coluna. É derivado: um `partner` é "Líder" sse `exists (select 1 from users where parent_id = this.id)`. Simplifica permissões.

**Índices:** `parent_id`, `role`, `status`, `cpf`.

### `invites`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `token` | `text` unique | usado no link |
| `generated_by` | `uuid` FK → `users(id)` | quem gerou (vira `parent_id` do convidado) |
| `commission_pct` | `numeric(5,4)` | % que o convidado vai usar como markup |
| `target_role` | `enum user_role` | normalmente `partner` |
| `expires_at` | `timestamptz` | |
| `consumed_at` | `timestamptz` nullable | |
| `consumed_by` | `uuid` FK → `users(id)` nullable | |

### Funções auxiliares de hierarquia (Postgres)
```sql
-- Todos descendentes (recursive CTE)
create function descendants_of(ancestor uuid) returns table (id uuid)
language sql stable as $$
  with recursive tree as (
    select id from users where parent_id = ancestor
    union all
    select u.id from users u join tree t on u.parent_id = t.id
  ) select id from tree;
$$;

-- Todos ancestrais (subindo a árvore)
create function ancestors_of(descendant uuid) returns table (id uuid, depth int)
language sql stable as $$
  with recursive chain as (
    select parent_id as id, 1 as depth from users where id = descendant and parent_id is not null
    union all
    select u.parent_id, c.depth + 1 from users u join chain c on u.id = c.id where u.parent_id is not null
  ) select id, depth from chain;
$$;
```

---

## 2. Domínio Operacional (Condomínios)

### `condominiums`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `cnpj` | `text` unique not null | **trava de duplicidade** |
| `legal_name` | `text` | |
| `trade_name` | `text` | |
| `address` | `jsonb` **not null** | logradouro, número, complemento, bairro, cidade, uf, cep. **Obrigatório no momento da reserva** (anti concentração de praça). |
| `uf` | `text` not null | denormalizado de `address.uf` para indexar e cruzar com `price_tables` |
| `units_count` | `int` | nº de unidades — input para dimensionar produto |
| `status` | `enum condo_status` | `available` \| `reserved` \| `under_inspection` \| `proposal_active` \| `contracted` \| `blocked_by_matriz` \| `terminated` |
| `reserved_by` | `uuid` FK → `users(id)` nullable | |
| `reserved_at` | `timestamptz` nullable | |
| `reservation_expires_at` | `timestamptz` nullable | |
| `blocked_reason` | `text` nullable | preenchido quando `status=blocked_by_matriz` |
| `created_by` | `uuid` FK → `users(id)` | quem cadastrou |

**Índices:** `cnpj` unique, `status`, `uf`, `reserved_by`, `reservation_expires_at`.

**Transições de `status`:** `reserved` nasce na reserva (ver `FLOWS.md` Fluxo 5); `proposal_active` é setado na criação da proposta (Fluxo 1); `contracted` na assinatura (Fluxo 2); volta a `available` por expiração, liberação manual ou cancelamento de contrato.
⚠️ **Em aberto (decisão pequena):** quem/quando seta `under_inspection` — na criação ou na submissão da vistoria? E a expiração da reserva continua correndo durante a vistoria? Definir antes de implementar o módulo operacional.

### `condominium_reservation_blocks`
Implementa **anti-harding**: parceiro que perdeu reserva por expiração não pode reservar de novo por **6 meses** (default), parametrizável em `system_settings.anti_harding_window_days`. Sem revogação automática — bloqueio acaba quando `blocked_until < now()`.

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users(id)` | |
| `condominium_id` | `uuid` FK → `condominiums(id)` | |
| `blocked_until` | `timestamptz` | |
| `reason` | `text` | `'expired_reservation'` etc |

**Unique:** `(user_id, condominium_id)` para impedir múltiplos blocks ativos do mesmo par. Um novo bloqueio para um par que já teve bloqueio no passado é feito via upsert (`on conflict ... do update`) — ver job em §7.

⚠️ **Em aberto (decisão pequena):** o bloqueio nasce **apenas na expiração** (`released_expired`). Liberação **manual** pelo parceiro (`released_manual`) não bloqueia — premissa atual: devolver a praça voluntariamente não pune. Confirmar se é isso mesmo.

### `condominium_reservation_events`
Histórico de reservas (auditoria + relatórios).

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `condominium_id` | `uuid` FK | |
| `user_id` | `uuid` FK | |
| `event_type` | `enum reservation_event` | `reserved` \| `released_manual` \| `released_expired` \| `converted_to_proposal` |
| `reserved_at` | `timestamptz` | |
| `expires_at` | `timestamptz` nullable | |
| `released_at` | `timestamptz` nullable | |

### `inspections`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `condominium_id` | `uuid` FK | |
| `performed_by` | `uuid` FK → `users(id)` | **único permitido**: parceiro reservante |
| `status` | `enum inspection_status` | `draft` \| `submitted` \| `approved` \| `rejected` |
| `submitted_at` | `timestamptz` nullable | |
| `reviewed_by` | `uuid` FK → `users(id)` nullable | admin que aprovou/rejeitou |
| `reviewed_at` | `timestamptz` nullable | |
| `rejection_reason` | `text` nullable | |
| `technical_data` | `jsonb` | laudo: capacidade, infra, condições etc. Schema validado em app. |

### `inspection_photos`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `inspection_id` | `uuid` FK | |
| `storage_path` | `text` | path no bucket `inspection-photos` |
| `caption` | `text` | |
| `uploaded_by` | `uuid` FK → `users(id)` | |

> **Storage bucket:** `inspection-photos`, private, RLS via policy que cruza com `inspections` → `performed_by` / admins.

---

## 3. Catálogo & Precificação

### `modules_catalog`
Catálogo de SKUs/produtos **do tenant** — cada empresa cadastra o próprio catálogo (na Clique, módulos de locker inteligente; na eCondos, o produto dela). **Apenas metadados** — o preço vive em `module_uf_pricing` (matriz por UF).

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `code` | `text` unique | SKU |
| `name` | `text` | |
| `description` | `text` | |
| `is_active` | `bool` | soft-disable |

### `module_uf_pricing`
Matriz de precificação: **uma linha por (módulo, UF)**. Cada combinação tem um valor base e dois acréscimos (% e R$) que permitem rastrear inflação regional sem alterar o valor de referência.

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `module_id` | `uuid` FK → `modules_catalog(id)` | |
| `uf` | `text` not null | |
| `base_value` | `numeric(12,2)` | custo Matriz do módulo nesta UF |
| `uplift_pct` | `numeric(5,4)` default `0` | acréscimo percentual (ex: `0.0500` = +5%) |
| `uplift_amount` | `numeric(12,2)` default `0` | acréscimo fixo em R$ |
| `is_active` | `bool` default `true` | |
| `valid_from` | `timestamptz` not null | versionamento |
| `valid_to` | `timestamptz` nullable | null = vigente |
| `created_by` | `uuid` FK → `users(id)` | admin_n1 |

**Unique vigente:** `(module_id, uf) where valid_to is null` — trigger garante apenas uma linha ativa por par.

**Fórmula do preço efetivo:**
```
effective_unit_price = (base_value × (1 + uplift_pct)) + uplift_amount
```

**Função helper:**
```sql
create function effective_module_price(p_module_id uuid, p_uf text, p_at timestamptz default now())
returns numeric language sql stable as $$
  select round((base_value * (1 + coalesce(uplift_pct,0))) + coalesce(uplift_amount,0), 2)
  from module_uf_pricing
  where module_id = p_module_id
    and uf = p_uf
    and valid_from <= p_at
    and (valid_to is null or valid_to > p_at)
    and is_active = true
  limit 1;
$$;
```

### `price_tables` (teto por UF, versionada)
Reduzida ao essencial: o **teto regional** que o parceiro não pode ultrapassar no `sale_price`. O `base_cost_master` é agora **derivado da soma dos itens da proposta** (via `module_uf_pricing`), não mais uma constante por UF.

> **Nota de negócio — uplift não é comissionado (intencional):** o `uplift_pct`/`uplift_amount` entra no `effective_module_price` e portanto compõe o `base_cost_master` (piso de custo). Logo o uplift regional é **receita não-comissionada da matriz** — ele cobre custo regional (logística/tributo), não margem do canal. Alinhado à prática de mercado: comissão incide sobre a margem *acima* do piso; ajuste regional de custo fica fora da base comissionável. Confirmação final em aberto — `OPEN_QUESTIONS.md` §5 (B2).

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `uf` | `text` not null | |
| `max_price` | `numeric(12,2)` | teto que o parceiro pode cobrar (sale_price ≤ max_price) |
| `valid_from` | `timestamptz` not null | |
| `valid_to` | `timestamptz` nullable | null = vigente |
| `created_by` | `uuid` FK → `users(id)` | admin_n1 |

**Constraint:** para cada `uf`, no máximo uma linha com `valid_to is null`.

### `system_settings`
Tabela KV para parâmetros operacionais. Editável por `admin_n1`.

| coluna | tipo | nota |
|---|---|---|
| `key` | `text` PK | ex: `anti_harding_window_days`, `reservation_default_ttl_hours` |
| `value` | `jsonb` | tipo flexível (number, string, array) |
| `description` | `text` | |
| `updated_by` | `uuid` FK → `users(id)` | |
| `updated_at` | `timestamptz` | |

Seeds iniciais:
```sql
insert into system_settings(key, value, description) values
  ('anti_harding_window_days', '180', '6 meses de bloqueio após expiração de reserva'),
  ('reservation_default_ttl_hours', '72', 'TTL default de uma reserva nova'),
  ('reference_uf', '"SP"', 'UF de referência para a tabela base de preços');
```

---

## 4. Propostas & Contratos

### `proposals`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `condominium_id` | `uuid` FK | |
| `author_id` | `uuid` FK → `users(id)` | vendedor (leaf da cascata) |
| `status` | `enum proposal_status` | `draft` \| `pending` \| `under_negotiation` \| `rejected` \| `approved` |
| `sale_price` | `numeric(12,2)` | preço de venda decidido pelo autor |
| `uf` | `text` | denorm para auditoria |
| `price_table_id` | `uuid` FK → `price_tables(id)` | snapshot da `price_tables` vigente (carrega `max_price`) |
| `base_cost_master_snapshot` | `numeric(12,2)` | **derivado** no INSERT: `SUM(effective_module_price(item.module_id, condo.uf) × item.quantity)`. Input da cascata. |
| `max_price_snapshot` | `numeric(12,2)` | snapshot do `price_tables.max_price` da UF do condomínio |
| `cascade_snapshot` | `jsonb` | **árvore de parceiros congelada na criação** — ver seção 6 |
| `submitted_at` | `timestamptz` nullable | |
| `approved_by` | `uuid` FK → `users(id)` nullable | admin_n1 ou admin_n2 |
| `approved_at` | `timestamptz` nullable | |
| `rejection_reason` | `text` nullable | |

**Validação (constraint + trigger):**
- `sale_price between base_cost_master_snapshot and max_price_snapshot`
- Só edita se `status in ('draft', 'pending', 'under_negotiation')`

### `proposal_items`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `proposal_id` | `uuid` FK cascade | |
| `module_id` | `uuid` FK → `modules_catalog(id)` | |
| `quantity` | `int` | |
| `unit_price` | `numeric(12,2)` | snapshot de `effective_module_price(module_id, condo.uf)` no momento da criação |

### `proposal_events`
Trilha de auditoria + chat de negociação.

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `proposal_id` | `uuid` FK | |
| `event_type` | `enum` | `status_change` \| `comment` |
| `from_status` | `enum proposal_status` nullable | |
| `to_status` | `enum proposal_status` nullable | |
| `comment` | `text` nullable | |
| `actor_id` | `uuid` FK → `users(id)` | |

### `contracts`
| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `proposal_id` | `uuid` FK unique | 1:1 |
| `signed_by` | `uuid` FK → `users(id)` | admin_n1/n2 |
| `signed_at` | `timestamptz` not null | |
| `monthly_amount` | `numeric(12,2)` | mensalidade derivada da proposta |
| `start_date` | `date` | |
| `end_date` | `date` nullable | |
| `status` | `enum contract_status` | `active` \| `terminated` \| `cancelled` |
| `cancelled_by` | `uuid` FK → `users(id)` nullable | admin_n1 apenas |
| `cancelled_at` | `timestamptz` nullable | |
| `cancellation_reason` | `text` nullable | |

---

## 5. Pagamentos & Comissionamento

### `payments`
Modelado como tabela própria desde já para suportar mensalidades e futura integração com gateway.

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `contract_id` | `uuid` FK | |
| `installment_number` | `int` | 1, 2, 3… |
| `due_date` | `date` | |
| `amount` | `numeric(12,2)` | |
| `paid_at` | `timestamptz` nullable | quando marcado pago |
| `marked_paid_by` | `uuid` FK → `users(id)` nullable | admin_n2 normalmente |

**Unique:** `(contract_id, installment_number)`.

**Escopo MVP:** apenas `installment_number = 1` é criada (no momento da assinatura do contrato). Mensalidades 2+ ficam para fase posterior ("controle financeiro completo"). O propósito atual do `payments` é puramente disparar a liberação da cascata.

**Trigger crítica:** quando `installment_number = 1` recebe `paid_at`, dispara `commissions.status = 'released'` para todos os lançamentos daquele contrato.

### `commissions`
Snapshot da cascata calculada **no momento da aprovação do contrato** (ou da proposta → contrato).

| coluna | tipo | nota |
|---|---|---|
| `id` | `uuid` PK | |
| `contract_id` | `uuid` FK | |
| `beneficiary_id` | `uuid` FK → `users(id)` **nullable** | quem recebe. **NULL quando `role_in_sale='house'`** (markup que ficaria com ancestral inativo é absorvido pela Clique). |
| `role_in_sale` | `enum commission_role` | `author` \| `coauthor` \| `house` |
| `tree_depth` | `int` | 0 = autor; 1+ = N ancestral |
| `markup_pct_applied` | `numeric(5,4)` | snapshot da `commission_pct` daquele parceiro no momento |
| `visible_base_at_level` | `numeric(12,2)` | "valor base" daquele nível (debug/auditoria) |
| `amount` | `numeric(12,2)` | valor calculado |
| `status` | `enum commission_status` | `future` (contrato assinado, 1ª mensalidade não paga) \| `released` (1ª mensalidade paga) \| `void` (contrato cancelado antes do pagamento) |
| `released_at` | `timestamptz` nullable | |

**Integridade:** `sum(amount) where contract_id = X` deve ser igual a `sale_price - base_cost_master_snapshot`. Constraint via trigger após inserção em lote.

---

## 6. Cálculo da Cascata (plpgsql)

A função é chamada **no `INSERT` em `contracts`** (via trigger ou função `sign_proposal()` que cria contract + commissions atomicamente).

> **Multiempresa:** `calculate_commission_cascade` é a estratégia **`chained_markup`** (a regra da Clique) = **implementação #1** atrás da interface `CommissionStrategy`. Na assinatura, o sistema despacha para a estratégia do `tenant` (`tenants.commission_strategy`). A eCondos pluga a estratégia dela na mesma interface, sem tocar nesta função. Não é DSL genérica — é dispatch por estratégia (decisão opinativa #6).

```sql
create or replace function calculate_commission_cascade(p_proposal_id uuid, p_contract_id uuid)
returns void language plpgsql as $$
declare
  v_sale_price       numeric;
  v_base_cost_master numeric;
  v_author_id        uuid;
  v_visible_base     numeric;
  v_residual_margin  numeric;
  v_node             record;
begin
  select sale_price, base_cost_master_snapshot, author_id
    into v_sale_price, v_base_cost_master, v_author_id
  from proposals where id = p_proposal_id;

  -- Começa do TOPO da árvore acima do autor, descendo até o autor.
  -- Cada nível aplica seu markup_pct sobre (sale_price - visible_base_current).
  v_visible_base := v_base_cost_master;

  -- Ancestrais ordenados do MAIS ALTO (depth máximo) ao MAIS BAIXO (depth 1).
  -- Inclui inativos: o markup que seria deles vira "house take" (beneficiary_id=NULL, role='house').
  for v_node in
    select u.id, u.commission_pct, u.status, a.depth
    from ancestors_of(v_author_id) a
    join users u on u.id = a.id
    where u.role = 'partner'
    order by a.depth desc
  loop
    v_residual_margin := v_sale_price - v_visible_base;
    if v_node.status = 'active' then
      insert into commissions (
        contract_id, beneficiary_id, role_in_sale, tree_depth,
        markup_pct_applied, visible_base_at_level, amount, status
      ) values (
        p_contract_id, v_node.id, 'coauthor', v_node.depth,
        v_node.commission_pct, v_visible_base,
        round(v_residual_margin * v_node.commission_pct, 2),
        'future'
      );
    else
      -- Ancestral inativo: markup fica para a Clique (house take).
      insert into commissions (
        contract_id, beneficiary_id, role_in_sale, tree_depth,
        markup_pct_applied, visible_base_at_level, amount, status
      ) values (
        p_contract_id, null, 'house', v_node.depth,
        v_node.commission_pct, v_visible_base,
        round(v_residual_margin * v_node.commission_pct, 2),
        'future'
      );
    end if;
    v_visible_base := v_visible_base + round(v_residual_margin * v_node.commission_pct, 2);
  end loop;

  -- Autor (leaf) fica com o resíduo
  insert into commissions (
    contract_id, beneficiary_id, role_in_sale, tree_depth,
    markup_pct_applied, visible_base_at_level, amount, status
  ) values (
    p_contract_id, v_author_id, 'author', 0,
    null, v_visible_base, v_sale_price - v_visible_base, 'future'
  );
end;
$$;
```

**Trigger no pagamento da 1ª mensalidade:**
```sql
create function release_commissions_on_first_payment() returns trigger language plpgsql as $$
begin
  if new.installment_number = 1 and new.paid_at is not null and old.paid_at is null then
    update commissions
       set status = 'released', released_at = new.paid_at
     where contract_id = new.contract_id and status = 'future';
  end if;
  return new;
end;
$$;
```

**Trigger no cancelamento antes do pagamento:** `commissions.status = 'void'` para todas as `future`.

---

## 7. Jobs Agendados (`pg_cron`)

```sql
-- A cada 5 minutos: expira reservas vencidas, aplica anti-harding e registra o evento.
-- Atenção: RETURNING de um UPDATE devolve os valores NOVOS (reserved_by já nulo);
-- por isso o snapshot dos dados antigos sai de um SELECT ... FOR UPDATE antes do UPDATE.
select cron.schedule('expire-reservations', '*/5 * * * *', $$
  with expired as (
    select id, reserved_by, reserved_at, reservation_expires_at
      from condominiums
     where status = 'reserved'
       and reservation_expires_at < now()
     for update skip locked
  ),
  released as (
    update condominiums c
       set status = 'available',
           reserved_by = null,
           reserved_at = null,
           reservation_expires_at = null
      from expired e
     where c.id = e.id
  ),
  blocked as (
    insert into condominium_reservation_blocks (user_id, condominium_id, blocked_until, reason)
    select e.reserved_by, e.id,
           now() + ((select (value #>> '{}')::int from system_settings where key = 'anti_harding_window_days') || ' days')::interval,
           'expired_reservation'
      from expired e
     where e.reserved_by is not null
    on conflict (user_id, condominium_id) do update
       set blocked_until = excluded.blocked_until,
           reason        = excluded.reason
  )
  insert into condominium_reservation_events
         (condominium_id, user_id, event_type, reserved_at, expires_at, released_at)
  select e.id, e.reserved_by, 'released_expired', e.reserved_at, e.reservation_expires_at, now()
    from expired e
   where e.reserved_by is not null;
$$);
```

Janela anti-harding default = **180 dias (6 meses)**, lida de `system_settings.anti_harding_window_days`.

```sql
-- Diariamente às 03:00: encerra contratos com end_date no passado
select cron.schedule('terminate-expired-contracts', '0 3 * * *', $$
  update contracts
     set status = 'terminated'
   where status = 'active'
     and end_date is not null
     and end_date < current_date;
$$);
```

Contratos sem `end_date` ficam `active` até cancelamento explícito por Admin N1.

---

## 8. RLS Policies (resumo)

Princípios:
- **N1/N2**: bypass quase total (SELECT em tudo). **Aprovação de cadastro de parceiro** (`users.status: pending_approval → active`) é restrita a N1/N2 — N3 fica focado em vistorias.
- **N3**: SELECT em condomínios/inspeções/propostas; escrita só em `inspections.review_*`.
- **Partner**: vê **a si + descendentes** via `descendants_of()`.

### `proposals`
```sql
alter table proposals enable row level security;

-- N1/N2 leem e escrevem; N3 só lê (escrita de N3 é restrita a inspections.review_*)
create policy proposals_admin_rw on proposals for all
  using (auth_role() in ('admin_n1','admin_n2'));

create policy proposals_admin_n3_read on proposals for select
  using (auth_role() = 'admin_n3');

create policy proposals_partner_select on proposals for select
  using (
    author_id = auth.uid()
    or author_id in (select id from descendants_of(auth.uid()))
  );

create policy proposals_partner_insert on proposals for insert
  with check (
    author_id = auth.uid()
    and (select role from users where id = auth.uid()) = 'partner'
  );

create policy proposals_partner_update on proposals for update
  using (
    author_id = auth.uid()
    and status in ('draft', 'pending', 'under_negotiation')
  )
  with check (author_id = auth.uid());
```

### `users` — aprovação restrita a N1/N2
```sql
create policy users_approve_only_n1_n2 on users for update
  using (
    auth_role() in ('admin_n1','admin_n2')
  )
  with check (
    auth_role() in ('admin_n1','admin_n2')
  );
-- A policy gate QUEM pode dar update em users. A validação da transição específica
-- (pending_approval → active, e não outra) é de uma trigger BEFORE UPDATE — RLS não
-- compara valores antigos vs novos.
```

### `commissions` — líder vê override da sub-rede; house só para N1/N2
```sql
-- N1/N2 veem tudo (incluindo rows house com beneficiary=NULL)
create policy commissions_admin_n1_n2 on commissions for select
  using (auth_role() in ('admin_n1','admin_n2'));

-- N3 não tem acesso a finanças
-- (sem policy para N3)

-- Parceiro vê só rows nominais de si ou de descendentes; NUNCA rows house
create policy commissions_partner_select on commissions for select
  using (
    beneficiary_id is not null
    and (
      beneficiary_id = auth.uid()
      or beneficiary_id in (select id from descendants_of(auth.uid()))
    )
  );
```

**House take fica invisível para parceiros.** Só admins N1/N2 enxergam linhas `role_in_sale='house'` (receita absorvida pela Clique quando um ancestral está inativo). Aparece no Dashboard Financeiro Macro como "Receita Clique por inativação".

**Defesa em profundidade na UI:** quando o usuário logado **não é** o `beneficiary` de uma row (ou seja, está olhando uma comissão de um descendente), a UI **omite** os campos `markup_pct_applied` e `visible_base_at_level` da resposta. RLS dá o macro (quais rows ver); a camada de API + UI dá o micro (quais campos por row). Isso impede que um líder reverse-engineering o `commission_pct` dos parceiros abaixo dele.

Política análoga para `condominiums` (criador + descendentes).

**Custo base do líder fica oculto do convidado:** a UI nunca exibe `base_cost_master` real para `partner` — só o "valor base aparente" derivado do contexto da proposta. RLS não basta aqui; é regra de UI + API server-side.

---

## 9. Resumo de Enums

> Papéis e estados são **enums fixos** por opção (decisão opinativa #6 — `PLATFORM_ARCHITECTURE.md` §5). A variação por empresa é de **valores/permissões** e de **estratégia** (comissão, preço), não da definição em runtime. Papéis/workflow data-driven só entram se um 3º tenant provar necessidade (YAGNI).

```sql
create type user_role as enum ('admin_n1','admin_n2','admin_n3','partner');
create type user_status as enum ('pending_approval','active','inactive');
create type condo_status as enum ('available','reserved','under_inspection','proposal_active','contracted','blocked_by_matriz','terminated');
create type inspection_status as enum ('draft','submitted','approved','rejected');
create type proposal_status as enum ('draft','pending','under_negotiation','rejected','approved');
create type contract_status as enum ('active','terminated','cancelled');
create type commission_role as enum ('author','coauthor','house');
create type commission_status as enum ('future','released','void');
create type reservation_event as enum ('reserved','released_manual','released_expired','converted_to_proposal');
```

---

## 10. Diagrama de Relacionamentos (textual)

```
users ──parent_id──> users (self-FK, adjacency list)
users ──┬──> invites (generated_by, consumed_by)
        ├──> condominiums (created_by, reserved_by)
        ├──> inspections (performed_by, reviewed_by)
        ├──> proposals (author_id, approved_by)
        ├──> contracts (signed_by, cancelled_by)
        ├──> payments (marked_paid_by)
        └──> commissions (beneficiary_id)

condominiums ──> inspections ──> inspection_photos
condominiums ──> condominium_reservation_blocks
condominiums ──> condominium_reservation_events
condominiums ──> proposals ──> proposal_items ──> modules_catalog
                          └──> proposal_events
                          └──> contracts ──> payments
                                        └──> commissions

modules_catalog ──> module_uf_pricing (matriz módulo × UF, com uplift % e R$)
price_tables (max_price por UF, versionada)
```

---

## Registro de decisões de modelagem

1. **Anti-harding**: 180 dias (6 meses), global, parametrizável em `system_settings.anti_harding_window_days`. Não expira automaticamente antes do prazo.
2. **Cotas de reserva**: **ilimitadas no MVP**. Coluna `reservation_quota` removida do `users`. Controle social via auditoria de admins (questionar quem reserva demais).
3. **Convites**: **sem revogação**. Uma vez consumido o pré-cadastro, o caminho é inativar o usuário (`users.status = 'inactive'`).
4. **% de comissão**: definida no convite e armazenada em `users.commission_pct`. Vale para **todos os contratos futuros** daquele parceiro. Mudanças no `commission_pct` valem só para propostas criadas após a mudança (snapshot via `commissions` na assinatura).
5. **Cancelamento de contrato**: comissões `future` viram `void`; comissões `released` ficam intocadas (sistema é apenas controle, não há reversão de pagamento real).
6. **Endereço obrigatório na reserva**: `condominiums.address` é `not null`. Anti concentração de praça.
7. **House take por ancestral inativo**: quando um ancestral está `inactive` no momento da assinatura, o markup que seria dele vira linha em `commissions` com `beneficiary_id=NULL` e `role_in_sale='house'`. Receita absorvida pela Clique, visível apenas para N1/N2.
8. **Catálogo é matriz `(módulo × UF)`**: tabela `module_uf_pricing` com `base_value`, `uplift_pct`, `uplift_amount`. Preço efetivo = `(base × (1 + pct)) + R$`. `modules_catalog` reduzido a metadados.
9. **`price_tables` reduzida**: carrega só `max_price` por UF (teto regional). `base_cost_master` da proposta é **derivado da soma dos itens** (`SUM(effective_module_price × quantity)`).
10. **Multiempresa (2026-06-20)**: projeto Supabase dedicado (`condopartners`), `tenant_id` em toda tabela de negócio, RLS escopada por tenant, cascata vira estratégia `chained_markup` — ver §0 e `PLATFORM_ARCHITECTURE.md`.

## Pendências de especificação

- **Decisões de negócio em aberto** que podem alterar este modelo — `PRD.md` §9 / `OPEN_QUESTIONS.md` (sobretudo modalidade de comissão e base da comissão: mensal vs contrato).
- **B3 / B5** (decisões pequenas, marcadas ⚠️ acima): quem seta `under_inspection` e se liberação manual de reserva gera bloqueio.
- **API surface**: operações que envolvem `service_role` (sign_proposal, mark_payment_paid, approve_inspection) — desenhar como Server Actions ou Route Handlers.
- **Storage policies**: políticas detalhadas do bucket `inspection-photos`.
- **Schema do laudo**: campos do `inspections.technical_data` (jsonb) — obrigatórios, condicionais (ver `SCREENS.md`, wizard de vistoria).
- **Setup do projeto**: estrutura de pastas Next.js, ferramenta de migrations (drizzle/kysely/SQL puro), seeds, ambientes (local/staging/prod).
